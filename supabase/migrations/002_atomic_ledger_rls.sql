-- =============================================================================
-- 9jaPulse Migration 002: Atomic Ledger + RLS + Idempotency
-- =============================================================================

-- ─── 1. Add request_id to transactions for idempotency ───────────────────────
alter table if exists transactions
  add column if not exists request_id uuid unique;

create index if not exists idx_transactions_request_id
  on transactions (request_id);

-- ─── 2. Atomic ledger function (uses SELECT ... FOR UPDATE) ──────────────────
create or replace function public.apply_transaction_safe(
  p_wallet_id           uuid,
  p_service_type        text,
  p_amount              numeric(15,2),
  p_direction           transaction_direction,
  p_status              transaction_status default 'pending',
  p_description         text default null,
  p_reference           text default null,
  p_meta                jsonb default null,
  p_request_id          uuid default null
)
returns json
language plpgsql
security definer
as \$\$
declare
  v_wallet               wallets%rowtype;
  v_new_total            numeric(15,2);
  v_new_withdrawable     numeric(15,2);
  v_is_held              boolean;
  v_transaction          transactions%rowtype;
  v_credit_service_types text[] := array['wallet_funding','cashback','referral_bonus','contest_payout','refund','deposit','reward'];
  v_held_service_types   text[] := array['cashback','referral_bonus','contest_payout','reward'];
begin
  -- Lock the wallet row exclusively for the duration of the transaction
  select * into v_wallet
  from wallets
  where id = p_wallet_id
  for update;

  if not found then
    raise exception 'Wallet not found: %', p_wallet_id;
  end if;

  -- Determine if this is a credit or held service
  v_is_held := p_service_type = any(v_held_service_types);

  -- Calculate new balances
  if p_direction = 'credit' then
    v_new_total := v_wallet.balance_total + p_amount;
    if v_is_held then
      v_new_withdrawable := v_wallet.balance_withdrawable;
    else
      v_new_withdrawable := v_wallet.balance_withdrawable + p_amount;
    end if;
  else
    if v_wallet.balance_total < p_amount then
      raise exception 'Insufficient total balance: have %, need %', v_wallet.balance_total, p_amount;
    end if;
    if v_wallet.balance_withdrawable < p_amount then
      raise exception 'Insufficient withdrawable balance: have %, need %', v_wallet.balance_withdrawable, p_amount;
    end if;
    v_new_total := v_wallet.balance_total - p_amount;
    v_new_withdrawable := v_wallet.balance_withdrawable - p_amount;
  end if;

  -- Check for duplicate request_id (idempotency)
  if p_request_id is not null then
    select * into v_transaction
    from transactions
    where request_id = p_request_id;

    if found then
      return json_build_object(
        'transaction', row_to_json(v_transaction),
        'balance_total', v_wallet.balance_total,
        'balance_withdrawable', v_wallet.balance_withdrawable,
        'idempotent', true
      );
    end if;
  end if;

  -- Insert transaction row
  insert into transactions (wallet_id, service_type, amount, direction, status, description, reference, meta, request_id)
  values (p_wallet_id, p_service_type, p_amount, p_direction, p_status, p_description, p_reference, p_meta, p_request_id)
  returning * into v_transaction;

  -- Update wallet balances
  update wallets
  set balance_total = v_new_total,
      balance_withdrawable = v_new_withdrawable,
      updated_at = now()
  where id = p_wallet_id;

  return json_build_object(
    'transaction', row_to_json(v_transaction),
    'balance_total', v_new_total,
    'balance_withdrawable', v_new_withdrawable,
    'idempotent', false
  );
end;
\$\$;

-- ─── 3. RLS policies for virtual_accounts ────────────────────────────────────
alter table if exists virtual_accounts enable row level security;

drop policy if exists "Users can read own virtual account" on virtual_accounts;
create policy "Users can read own virtual account"
  on virtual_accounts for select
  using (auth.uid() = user_id);

drop policy if exists "No direct client virtual account writes" on virtual_accounts;
create policy "No direct client virtual account writes"
  on virtual_accounts for all
  using (false)
  with check (false);

-- ─── 4. RLS policies for platform_settings ──────────────────────────────────
alter table if exists platform_settings enable row level security;

drop policy if exists "Anyone can read platform settings" on platform_settings;
create policy "Anyone can read platform settings"
  on platform_settings for select
  using (true);

drop policy if exists "No direct client platform_settings writes" on platform_settings;
create policy "No direct client platform_settings writes"
  on platform_settings for all
  using (false)
  with check (false);

-- ─── 5. RLS policies for data_plans ─────────────────────────────────────────
alter table if exists data_plans enable row level security;

drop policy if exists "Anyone can read data plans" on data_plans;
create policy "Anyone can read data plans"
  on data_plans for select
  using (true);

drop policy if exists "No direct client data_plans writes" on data_plans;
create policy "No direct client data_plans writes"
  on data_plans for all
  using (false)
  with check (false);

-- ─── 6. Add passcode column to profiles if missing ───────────────────────────
alter table if exists profiles
  add column if not exists passcode text;

-- ─── 7. Profile self-healing function (idempotent) ───────────────────────────
create or replace function public.ensure_profile_and_wallet(p_user_id uuid)
returns json
language plpgsql
security definer
as \$\$
declare
  v_profile profiles%rowtype;
  v_wallet  wallets%rowtype;
  v_auth_user record;
begin
  select * into v_profile from profiles where id = p_user_id;

  if not found then
    select email, raw_user_meta_data
    into v_auth_user
    from auth.users
    where id = p_user_id;

    if not found then
      raise exception 'Auth user not found';
    end if;

    insert into profiles (id, email, full_name, phone, pin)
    values (
      p_user_id,
      v_auth_user.email,
      v_auth_user.raw_user_meta_data->>'full_name',
      v_auth_user.raw_user_meta_data->>'phone',
      v_auth_user.raw_user_meta_data->>'transaction_pin'
    )
    on conflict (id) do nothing;

    select * into v_profile from profiles where id = p_user_id;
  end if;

  select * into v_wallet from wallets where user_id = p_user_id;

  if not found then
    insert into wallets (user_id)
    values (p_user_id)
    on conflict (user_id) do nothing;

    select * into v_wallet from wallets where user_id = p_user_id;
  end if;

  return json_build_object(
    'profile', row_to_json(v_profile),
    'wallet', row_to_json(v_wallet)
  );
end;
\$\$;

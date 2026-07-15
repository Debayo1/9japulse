-- =============================================================================
-- 9jaPulse Row Level Security Policies
-- Run AFTER schema.sql
-- =============================================================================

-- ─── profiles ──────────────────────────────────────────────────────────────────
alter table profiles enable row level security;

create policy "Users can read own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- ─── wallets ───────────────────────────────────────────────────────────────────
alter table wallets enable row level security;

create policy "Users can read own wallet"
  on wallets for select
  using (auth.uid() = user_id);

-- Writes go through server actions only (service_role key used server-side)
-- Deny all direct client mutations for safety
create policy "No direct client wallet writes"
  on wallets for all
  using (false)
  with check (false);

-- ─── transactions ──────────────────────────────────────────────────────────────
alter table transactions enable row level security;

create policy "Users can read own transactions"
  on transactions for select
  using (
    auth.uid() = (
      select user_id from wallets where id = transactions.wallet_id
    )
  );

-- No client writes – all inserts go through server actions with service_role
create policy "No direct client transaction writes"
  on transactions for insert
  with check (false);

-- ─── provider_keys ─────────────────────────────────────────────────────────────
alter table provider_keys enable row level security;

-- provider_keys is NEVER accessible from the client – server-side only
create policy "No client access to provider_keys"
  on provider_keys for all
  using (false);

-- ─── virtual_accounts ─────────────────────────────────────────────────────────
alter table virtual_accounts enable row level security;

create policy "Users can read own virtual account"
  on virtual_accounts for select
  using (auth.uid() = user_id);

create policy "No direct client virtual account writes"
  on virtual_accounts for all
  using (false)
  with check (false);

-- ─── platform_settings ────────────────────────────────────────────────────────
alter table platform_settings enable row level security;

create policy "Anyone can read platform settings"
  on platform_settings for select
  using (true);

create policy "No direct client platform_settings writes"
  on platform_settings for all
  using (false)
  with check (false);

-- ─── data_plans ───────────────────────────────────────────────────────────────
alter table data_plans enable row level security;

create policy "Anyone can read data plans"
  on data_plans for select
  using (true);

create policy "No direct client data_plans writes"
  on data_plans for all
  using (false)
  with check (false);

-- ─── gift_codes ───────────────────────────────────────────────────────────
alter table gift_codes enable row level security;

create policy "Users can read own gift codes"
  on gift_codes for select
  using (auth.uid() = created_by OR auth.uid() = redeemed_by);

create policy "No direct client gift_codes writes"
  on gift_codes for all
  using (false)
  with check (false);

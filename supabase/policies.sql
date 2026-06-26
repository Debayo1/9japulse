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

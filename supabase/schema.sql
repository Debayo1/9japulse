-- =============================================================================
-- 9jaPulse Supabase Schema
-- Run this in your Supabase SQL Editor (or via supabase db push)
-- =============================================================================

-- ─── Extensions ────────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── ENUM types ────────────────────────────────────────────────────────────────
do $$ begin
  create type transaction_direction as enum ('debit', 'credit');
exception when duplicate_object then null; end $$;

do $$ begin
  create type transaction_status as enum ('pending', 'success', 'failed');
exception when duplicate_object then null; end $$;

-- ─── profiles ──────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id             uuid        primary key references auth.users(id) on delete cascade,
  email          text        not null,
  full_name      text,
  phone          text,
  pin            text,
  role           text        not null default 'user',
  avatar_url     text,
  referral_code  text        unique default upper(substr(gen_random_uuid()::text, 1, 8)),
  referred_by    uuid        references profiles(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists platform_settings (
  id                  bigserial   primary key,
  app_name            text        not null default '9jaPulse',
  primary_color       text,
  secondary_color     text,
  accent_color        text,
  extra_color         text,
  transfer_fee        numeric(12,2) not null default 0,
  bank_transfer_fee   numeric(12,2) not null default 0,
  deposit_fee         numeric(12,2) not null default 50,
  referral_percentage  numeric(5,2) not null default 10,
  cashback_percentage  numeric(5,2) not null default 0,
  ncwallet_api_url    text,
  ncwallet_authorization text,
  app_maintenance     boolean     not null default false,
  theme               text        not null default 'system',
  banner_enabled      boolean     not null default true,
  banner_text         text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ─── wallets ───────────────────────────────────────────────────────────────────
create table if not exists wallets (
  id                    uuid        primary key default gen_random_uuid(),
  user_id               uuid        not null unique references profiles(id) on delete cascade,
  balance_total         numeric(15,2) not null default 0 check (balance_total >= 0),
  balance_withdrawable  numeric(15,2) not null default 0 check (balance_withdrawable >= 0),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint wallet_withdrawable_lte_total check (balance_withdrawable <= balance_total)
);

-- ─── transactions ──────────────────────────────────────────────────────────────
create table if not exists transactions (
  id            uuid                    primary key default gen_random_uuid(),
  wallet_id     uuid                    not null references wallets(id) on delete cascade,
  service_type  text                    not null,
  description   text,
  amount        numeric(15,2)           not null check (amount > 0),
  direction     transaction_direction   not null,
  status        transaction_status      not null default 'pending',
  reference     text,
  meta          jsonb,
  created_at    timestamptz             not null default now()
);

-- Index for fast history queries
create index if not exists idx_transactions_wallet_created
  on transactions (wallet_id, created_at desc);

-- ─── provider_keys ─────────────────────────────────────────────────────────────
-- API keys are stored here and fetched server-side at runtime.
-- Never expose this table to the frontend!
create table if not exists provider_keys (
  id          uuid        primary key default gen_random_uuid(),
  provider    text        not null,
  key_name    text        not null,
  key_value   text        not null,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  unique (provider, key_name)
);

create table if not exists virtual_accounts (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null unique references auth.users(id) on delete cascade,
  provider          text        not null default 'ncwallet',
  provider_reference text       unique,
  account_number    text        not null unique,
  account_name      text        not null,
  bank_code         text,
  bank_name         text,
  account_type      text,
  status            text        not null default 'active',
  webhook_url       text,
  meta              jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ─── Auto-create wallet + profile on new user signup ──────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_wallet_id uuid;
begin
  insert into public.profiles (id, email, full_name, phone, pin)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'transaction_pin'
  );

  insert into public.wallets (user_id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Updated-at trigger ────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at
  before update on profiles
  for each row execute procedure set_updated_at();

create trigger set_wallets_updated_at
  before update on wallets
  for each row execute procedure set_updated_at();

create trigger set_platform_settings_updated_at
  before update on platform_settings
  for each row execute procedure set_updated_at();

create trigger set_virtual_accounts_updated_at
  before update on virtual_accounts
  for each row execute procedure set_updated_at();

-- ─── data_plans ─────────────────────────────────────────────────────────────────
create table if not exists public.data_plans (
  id                  bigserial   primary key,
  service             text        not null,
  display_name        text,
  plan_value          text        not null,
  price               numeric(12,2) not null,
  discount            text        default '0%',
  fixed_price         boolean     not null default true,
  full_service_name   text,
  created_at          timestamptz not null default now(),
  unique (service, plan_value)
);


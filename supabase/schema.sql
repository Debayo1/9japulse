-- =============================================================================
-- 9jaPulse Supabase Schema
-- Run this in your Supabase SQL Editor (or via supabase db push)
-- =============================================================================

-- â”€â”€â”€ Extensions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create extension if not exists "pgcrypto";

-- â”€â”€â”€ ENUM types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
do $$ begin
  create type transaction_direction as enum ('debit', 'credit');
exception when duplicate_object then null; end $$;

do $$ begin
  create type transaction_status as enum ('pending', 'success', 'failed');
exception when duplicate_object then null; end $$;

-- â”€â”€â”€ profiles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€â”€ wallets â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create table if not exists wallets (
  id                    uuid        primary key default gen_random_uuid(),
  user_id               uuid        not null unique references profiles(id) on delete cascade,
  balance_total         numeric(15,2) not null default 0 check (balance_total >= 0),
  balance_withdrawable  numeric(15,2) not null default 0 check (balance_withdrawable >= 0),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint wallet_withdrawable_lte_total check (balance_withdrawable <= balance_total)
);

-- â”€â”€â”€ transactions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create table if not exists transactions (
  id            uuid                    primary key default gen_random_uuid(),
  wallet_id     uuid                    not null references wallets(id) on delete cascade,
  service_type  text                    not null,
  description   text,
  amount        numeric(15,2)           not null check (amount > 0),
  direction     transaction_direction   not null,
  status        transaction_status      not null default 'pending',
  reference     text,
  request_id    text                    unique,
  meta          jsonb,
  created_at    timestamptz             not null default now()
);

-- Index for fast history queries
create index if not exists idx_transactions_wallet_created
  on transactions (wallet_id, created_at desc);

-- â”€â”€â”€ provider_keys â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€â”€ Auto-create wallet + profile on new user signup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€â”€ Updated-at trigger â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€â”€ data_plans â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- ──── sellers (admin-approved marketplace sellers) ──────────────────────
create table if not exists public.sellers (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null unique references auth.users(id) on delete cascade,
  display_name    text        not null,
  description     text,
  phone           text,
  email           text,
  avatar_url      text,
  status          text        not null default 'pending',
  approved_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ──── seller_products ───────────────────────────────────────────────────
create table if not exists public.seller_products (
  id              uuid        primary key default gen_random_uuid(),
  seller_id       uuid        not null references public.sellers(id) on delete cascade,
  title           text        not null,
  description     text,
  price           numeric(12,2) not null,
  image_url       text,
  images          text[]      default '{}',
  category        text        not null default 'General',
  stock_quantity  integer     not null default 0,
  is_active       boolean     not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ──── seller_orders (escrow-based) ─────────────────────────────────────
create table if not exists public.seller_orders (
  id              uuid        primary key default gen_random_uuid(),
  buyer_id        uuid        not null references auth.users(id),
  seller_id       uuid        not null references public.sellers(id),
  product_id      uuid        not null references public.seller_products(id),
  product_title   text        not null,
  product_image   text,
  quantity        integer     not null default 1,
  amount          numeric(12,2) not null,
  commission      numeric(12,2) not null default 0,
  seller_payout   numeric(12,2) not null default 0,
  status          text        not null default 'pending',
  reference       text        not null unique,
  shipping_name   text        not null,
  shipping_phone  text        not null,
  shipping_address text       not null,
  confirmed_at    timestamptz,
  released_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ──── seller_wallets (escrowed funds) ──────────────────────────────────
create table if not exists public.seller_wallets (
  id                 uuid        primary key default gen_random_uuid(),
  seller_id          uuid        not null unique references public.sellers(id) on delete cascade,
  balance_available  numeric(15,2) not null default 0,
  balance_held       numeric(15,2) not null default 0,
  total_earned       numeric(15,2) not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ──── bot_subscriptions ────────────────────────────────────────────────
create table if not exists public.bot_subscriptions (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users(id) on delete cascade,
  channel         text        not null,
  plan            text        not null default 'free',
  messages_used   integer     not null default 0,
  messages_limit  integer,
  expires_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, channel)
);

-- ──── chat_conversations ───────────────────────────────────────────────
create table if not exists public.chat_conversations (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references auth.users(id) on delete cascade,
  channel           text        not null,
  channel_user_id   text        not null,
  platform_metadata jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (user_id, channel, channel_user_id)
);

-- ──── chat_messages ────────────────────────────────────────────────────
create table if not exists public.chat_messages (
  id              uuid        primary key default gen_random_uuid(),
  conversation_id uuid        not null references public.chat_conversations(id) on delete cascade,
  role            text        not null,
  content         text        not null,
  tool_calls      jsonb,
  tool_result     jsonb,
  created_at      timestamptz not null default now()
);
create index if not exists idx_chat_messages_conversation
  on public.chat_messages (conversation_id, created_at desc);

-- ──── bot/seller columns on platform_settings ─────────────────────────
alter table public.platform_settings add column if not exists bot_enabled boolean not null default false;
alter table public.platform_settings add column if not exists bot_free_messages_per_day integer not null default 3;
alter table public.platform_settings add column if not exists bot_daily_price numeric(12,2) not null default 500;
alter table public.platform_settings add column if not exists bot_weekly_price numeric(12,2) not null default 2500;
alter table public.platform_settings add column if not exists bot_monthly_price numeric(12,2) not null default 8000;
alter table public.platform_settings add column if not exists bot_welcome_message text not null default 'Welcome to 9jaPulse Bot! I can help you buy airtime, data, and more.';
alter table public.platform_settings add column if not exists seller_enabled boolean not null default false;
alter table public.platform_settings add column if not exists seller_commission_rate numeric(5,2) not null default 5;
alter table public.platform_settings add column if not exists seller_auto_release_days integer not null default 7;

-- ──── seller_id on marketplace_products ────────────────────────────────
alter table public.marketplace_products add column if not exists seller_id uuid references public.sellers(id);

-- ──── username on profiles ──────────────────────────────────────────────
alter table public.profiles add column if not exists username text unique;

-- ──── gift_codes ────────────────────────────────────────────────────────
create table if not exists public.gift_codes (
  id            uuid        primary key default gen_random_uuid(),
  code          text        not null unique,
  amount        numeric(15,2) not null check (amount > 0),
  created_by    uuid        not null references auth.users(id) on delete cascade,
  redeemed_by   uuid        references auth.users(id),
  status        text        not null default 'active' check (status in ('active', 'redeemed', 'expired', 'cancelled')),
  message       text,
  created_at    timestamptz not null default now(),
  redeemed_at   timestamptz,
  expires_at    timestamptz
);

create index if not exists idx_gift_codes_code on public.gift_codes (code);
create index if not exists idx_gift_codes_created_by on public.gift_codes (created_by);
create index if not exists idx_gift_codes_redeemed_by on public.gift_codes (redeemed_by);


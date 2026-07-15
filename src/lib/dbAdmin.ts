"use server";

import { Client } from "pg";
import fs from "fs";
import path from "path";
import { createServiceClient } from "./supabaseServer";

let isDbVerified = false;

/**
 * Automatically runs light DDL checks to ensure that required columns 
 * (like 'pin' and 'passcode' on profiles) and helper tables exist.
 * This runs at least once per server instance lifecycle when database actions are executed.
 */
export async function ensureDbColumnsExist(): Promise<void> {
  if (isDbVerified) return;

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.warn(
      "[9jaPulse] DATABASE_URL environment variable is not defined. " +
      "Skipping automatic database column/table auto-healing."
    );
    return;
  }

  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    
    // 1. Check and add profiles columns if missing
    await client.query(`
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pin text;
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS passcode text;
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';
    `);

    // 2. Ensure platform settings table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.platform_settings (
        id bigserial PRIMARY KEY,
        app_name text NOT NULL DEFAULT '9jaPulse',
        primary_color text,
        secondary_color text,
        accent_color text,
        extra_color text,
        transfer_fee numeric(12,2) NOT NULL DEFAULT 0,
        bank_transfer_fee numeric(12,2) NOT NULL DEFAULT 0,
        deposit_fee numeric(12,2) NOT NULL DEFAULT 50,
        referral_percentage numeric(5,2) NOT NULL DEFAULT 10,
        cashback_percentage numeric(5,2) NOT NULL DEFAULT 0,
        ncwallet_api_url text,
        ncwallet_authorization text,
        app_maintenance boolean NOT NULL DEFAULT false,
        theme text NOT NULL DEFAULT 'system',
        banner_enabled boolean NOT NULL DEFAULT true,
        banner_text text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await client.query(`
      INSERT INTO public.platform_settings (app_name)
      SELECT '9jaPulse'
      WHERE NOT EXISTS (SELECT 1 FROM public.platform_settings);
    `);

    // 3. Ensure provider_keys table exists so key operations don't crash
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.provider_keys (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        provider text NOT NULL,
        key_name text NOT NULL,
        key_value text NOT NULL,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (provider, key_name)
      );
    `);

    // 4. Ensure virtual_accounts table exists for deposit flows
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.virtual_accounts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
        provider text NOT NULL DEFAULT 'ncwallet',
        provider_reference text UNIQUE,
        account_number text NOT NULL UNIQUE,
        account_name text NOT NULL,
        bank_code text,
        bank_name text,
        account_type text,
        status text NOT NULL DEFAULT 'active',
        webhook_url text,
        meta jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    // 5. Ensure data_plans table exists for GSubz sync
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.data_plans (
        id bigserial PRIMARY KEY,
        service text NOT NULL,
        display_name text,
        plan_value text NOT NULL,
        price numeric(12,2) NOT NULL,
        discount text DEFAULT '0%',
        fixed_price boolean NOT NULL DEFAULT true,
        full_service_name text,
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (service, plan_value)
      );
    `);

    // 6. Ensure marketplace_products table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.marketplace_products (
        id text PRIMARY KEY,
        title text NOT NULL,
        description text,
        price numeric(12,2) NOT NULL,
        image_url text,
        category text NOT NULL DEFAULT 'General',
        rating numeric(3,2) DEFAULT 4.5,
        stock_quantity integer NOT NULL DEFAULT 100,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    // 7. Ensure marketplace_orders table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.marketplace_orders (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        product_id text NOT NULL,
        product_title text NOT NULL,
        product_image text,
        amount numeric(12,2) NOT NULL,
        reference text NOT NULL UNIQUE,
        shipping_name text NOT NULL,
        shipping_phone text NOT NULL,
        shipping_email text NOT NULL,
        shipping_address text NOT NULL,
        status text NOT NULL DEFAULT 'processing',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    // Seed initial marketplace products if empty
    // Seed initial marketplace products if empty
    await client.query(`
      INSERT INTO public.marketplace_products (id, title, description, price, image_url, category, rating, stock_quantity)
      VALUES
        ('prod-1', 'Pro Noise-Cancelling Headphones', 'Over-ear wireless headphones with active noise cancellation, 30hr battery, and Hi-Fi stereo sound.', 15000.00, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', 'Electronics', 4.8, 50),
        ('prod-2', 'Smart Fitness Watch', 'Heart rate monitoring, sleep tracking, AMOLED display and 7-day battery life.', 8500.00, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500', 'Electronics', 4.5, 30),
        ('prod-3', 'Utility Cargo Trousers', 'Streetwear loose-fit multi-pocket cargo pants with drawstring waist and durable cotton build.', 12000.00, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500', 'Fashion', 4.3, 100),
        ('prod-4', 'Slim RFID Leather Wallet', 'Ultra-thin bifold wallet with RFID blocking technology and premium carbon finish.', 4500.00, 'https://images.unsplash.com/photo-1627124765135-56c33fc36baf?w=500', 'Fashion', 4.6, 120),
        ('prod-5', 'Waterproof Bluetooth Speaker', 'IPX7-rated portable wireless speaker with 360Â° rich bass sound for outdoors.', 7500.00, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500', 'Electronics', 4.7, 45),
        ('prod-6', 'RGB LED Desk Lamp', 'Smart color-changing bedside lamp with 16 million colors and app-controlled lighting modes.', 6200.00, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500', 'Electronics', 4.4, 70),
        ('prod-7', 'Polarized Aviator Sunglasses', 'Classic gold-frame aviator shades with UV400 polarized lenses for style and eye protection.', 3500.00, 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500', 'Fashion', 4.6, 85),
        ('prod-8', 'Large Travel Backpack', '40L waterproof backpack with USB charging port, laptop sleeve and anti-theft pockets.', 11500.00, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500', 'Fashion', 4.8, 40),
        ('prod-9', 'Portable Rechargeable Fan', 'USB mini turbo fan with 3 wind speeds and 8-hour battery â€” perfect for the Nigerian heat.', 3800.00, 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=500', 'Gadgets', 4.3, 150),
        ('prod-10', 'Bluetooth GPS Key Tracker', 'Compact anti-lost tracker for keys, bags, and wallets with 90dB alarm ring.', 2500.00, 'https://images.unsplash.com/photo-1584438784894-089d6a128f3e?w=500', 'Gadgets', 4.1, 200),
        ('prod-11', '1080P Dashcam with Night Vision', 'Dual-lens dashboard recorder with loop recording, G-sensor, and clear night-time footage.', 24500.00, 'https://images.unsplash.com/photo-1508962914676-134849a727f0?w=500', 'Gadgets', 4.7, 25),
        ('prod-12', 'Ergonomic Vertical Mouse', 'Wireless vertical mouse that corrects wrist posture and reduces RSI with adjustable DPI.', 5500.00, 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500', 'Gadgets', 4.5, 60),
        ('prod-13', 'Aroma Diffuser & Humidifier', 'Ultrasonic wood-grain humidifier with 7 color LED modes and essential oil diffusing.', 5800.00, 'https://images.unsplash.com/photo-1602928321679-560bb453f190?w=500', 'Home', 4.6, 80),
        ('prod-14', 'Insulated Temperature Flask', 'Double-wall stainless steel vacuum flask that keeps drinks hot or cold for 12 hours.', 3900.00, 'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?w=500', 'Home', 4.4, 110),
        ('prod-15', 'USB Portable Blender Cup', 'Rechargeable mini smoothie blender with 6-blade stainless cutter and leak-proof lid.', 8200.00, 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=500', 'Home', 4.5, 65)
      ON CONFLICT (id) DO NOTHING;
    `);

    // Ensure images array column exists on marketplace_products
    await client.query(`
      ALTER TABLE public.marketplace_products 
      ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';
    `);

    // Seed multiple images for key demo products
    await client.query(`
      UPDATE public.marketplace_products 
      SET images = ARRAY[
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
        'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500',
        'https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=500'
      ] WHERE id = 'prod-1';

      UPDATE public.marketplace_products 
      SET images = ARRAY[
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
        'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500',
        'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500'
      ] WHERE id = 'prod-2';

      UPDATE public.marketplace_products 
      SET images = ARRAY[
        'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500',
        'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500',
        'https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=500'
      ] WHERE id = 'prod-3';
    `);

    // 8. Ensure sellers table exists (admin-approved sellers)
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.sellers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
        display_name text NOT NULL,
        description text,
        phone text,
        email text,
        avatar_url text,
        status text NOT NULL DEFAULT 'pending',
        approved_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    // 9. Ensure seller_products table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.seller_products (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
        title text NOT NULL,
        description text,
        price numeric(12,2) NOT NULL,
        image_url text,
        images text[] DEFAULT '{}',
        category text NOT NULL DEFAULT 'General',
        stock_quantity integer NOT NULL DEFAULT 0,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    // 10. Ensure seller_orders table exists (escrow-based orders)
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.seller_orders (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        buyer_id uuid NOT NULL REFERENCES auth.users(id),
        seller_id uuid NOT NULL REFERENCES public.sellers(id),
        product_id uuid NOT NULL REFERENCES public.seller_products(id),
        product_title text NOT NULL,
        product_image text,
        quantity integer NOT NULL DEFAULT 1,
        amount numeric(12,2) NOT NULL,
        commission numeric(12,2) NOT NULL DEFAULT 0,
        seller_payout numeric(12,2) NOT NULL DEFAULT 0,
        status text NOT NULL DEFAULT 'pending',
        reference text NOT NULL UNIQUE,
        shipping_name text NOT NULL,
        shipping_phone text NOT NULL,
        shipping_address text NOT NULL,
        confirmed_at timestamptz,
        released_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    // 11. Ensure seller_wallets table exists (holds escrowed funds)
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.seller_wallets (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        seller_id uuid NOT NULL UNIQUE REFERENCES public.sellers(id) ON DELETE CASCADE,
        balance_available numeric(15,2) NOT NULL DEFAULT 0,
        balance_held numeric(15,2) NOT NULL DEFAULT 0,
        total_earned numeric(15,2) NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    // 12. Ensure bot_subscriptions table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.bot_subscriptions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        channel text NOT NULL,
        plan text NOT NULL DEFAULT 'free',
        messages_used integer NOT NULL DEFAULT 0,
        messages_limit integer,
        expires_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (user_id, channel)
      );
    `);

    // 13. Ensure chat_conversations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.chat_conversations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        channel text NOT NULL,
        channel_user_id text NOT NULL,
        platform_metadata jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (user_id, channel, channel_user_id)
      );
    `);

    // 14. Ensure chat_messages table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.chat_messages (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
        role text NOT NULL,
        content text NOT NULL,
        tool_calls jsonb,
        tool_result jsonb,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation
      ON public.chat_messages (conversation_id, created_at DESC);
    `);

    // 15. Add bot/seller columns to platform_settings if missing
    await client.query(`
      ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS bot_enabled boolean NOT NULL DEFAULT false;
      ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS bot_free_messages_per_day integer NOT NULL DEFAULT 3;
      ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS bot_daily_price numeric(12,2) NOT NULL DEFAULT 500;
      ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS bot_weekly_price numeric(12,2) NOT NULL DEFAULT 2500;
      ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS bot_monthly_price numeric(12,2) NOT NULL DEFAULT 8000;
      ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS bot_welcome_message text NOT NULL DEFAULT 'Welcome to 9jaPulse Bot! I can help you buy airtime, data, and more.';
      ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS seller_enabled boolean NOT NULL DEFAULT false;
      ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS seller_commission_rate numeric(5,2) NOT NULL DEFAULT 5;
      ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS seller_auto_release_days integer NOT NULL DEFAULT 7;
    `);

    // 16. Add seller_id column to marketplace_products for seller-linked listings
    await client.query(`
      ALTER TABLE public.marketplace_products ADD COLUMN IF NOT EXISTS seller_id uuid REFERENCES public.sellers(id);
    `);

    // 17. Add passcode column to profiles if missing (for chat PIN verification)
    await client.query(`
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS passcode text;
    `);

    // 18. Add username column to profiles
    await client.query(`
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (username) WHERE username IS NOT NULL;
    `);

    // 19. Ensure gift_codes table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.gift_codes (
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
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_gift_codes_code ON public.gift_codes (code);
      CREATE INDEX IF NOT EXISTS idx_gift_codes_created_by ON public.gift_codes (created_by);
      CREATE INDEX IF NOT EXISTS idx_gift_codes_redeemed_by ON public.gift_codes (redeemed_by);
    `);

    // 18. Ensure set_updated_at function and triggers for new tables
    await client.query(`
      CREATE OR REPLACE FUNCTION public.set_updated_at()
      RETURNS trigger AS $$
      BEGIN
        new.updated_at = now();
        RETURN new;
      END;
      $$ LANGUAGE plpgsql;
    `);
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_sellers_updated_at') THEN
          CREATE TRIGGER set_sellers_updated_at BEFORE UPDATE ON public.sellers
          FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_seller_products_updated_at') THEN
          CREATE TRIGGER set_seller_products_updated_at BEFORE UPDATE ON public.seller_products
          FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_seller_orders_updated_at') THEN
          CREATE TRIGGER set_seller_orders_updated_at BEFORE UPDATE ON public.seller_orders
          FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_seller_wallets_updated_at') THEN
          CREATE TRIGGER set_seller_wallets_updated_at BEFORE UPDATE ON public.seller_wallets
          FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_bot_subscriptions_updated_at') THEN
          CREATE TRIGGER set_bot_subscriptions_updated_at BEFORE UPDATE ON public.bot_subscriptions
          FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_chat_conversations_updated_at') THEN
          CREATE TRIGGER set_chat_conversations_updated_at BEFORE UPDATE ON public.chat_conversations
          FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
        END IF;
      END $$;
    `);

    // 20. Ensure enum types exist for RPC functions
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_direction') THEN
          CREATE TYPE transaction_direction AS ENUM ('debit', 'credit');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status') THEN
          CREATE TYPE transaction_status AS ENUM ('pending', 'success', 'failed');
        END IF;
      END $$;
    `);

    // 21. Ensure atomic RPC functions exist (apply_transaction_safe, move_funds_safe, decrement_stock)
    await client.query(`
      CREATE OR REPLACE FUNCTION public.apply_transaction_safe(
        p_wallet_id uuid, p_service_type text, p_amount numeric,
        p_direction text, p_status text DEFAULT 'pending',
        p_description text DEFAULT NULL, p_reference text DEFAULT NULL,
        p_meta jsonb DEFAULT NULL, p_request_id uuid DEFAULT NULL
      ) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $body$
      DECLARE
        v_wallet wallets%ROWTYPE;
        v_new_total numeric;
        v_new_withdrawable numeric;
        v_is_held boolean;
        v_transaction transactions%ROWTYPE;
      BEGIN
        SELECT * INTO v_wallet FROM wallets WHERE id = p_wallet_id FOR UPDATE;
        IF NOT FOUND THEN RAISE EXCEPTION 'Wallet not found'; END IF;
        v_is_held := p_service_type = ANY(ARRAY['cashback','referral_bonus','contest_payout','reward']);
        IF p_direction = 'credit' THEN
          v_new_total := v_wallet.balance_total + p_amount;
          v_new_withdrawable := CASE WHEN v_is_held THEN v_wallet.balance_withdrawable ELSE v_wallet.balance_withdrawable + p_amount END;
        ELSE
          IF v_wallet.balance_total < p_amount THEN RAISE EXCEPTION 'Insufficient total balance'; END IF;
          IF v_wallet.balance_withdrawable < p_amount THEN RAISE EXCEPTION 'Insufficient withdrawable balance'; END IF;
          v_new_total := v_wallet.balance_total - p_amount;
          v_new_withdrawable := v_wallet.balance_withdrawable - p_amount;
        END IF;
        INSERT INTO transactions (wallet_id, service_type, amount, direction, status, description, reference, meta, request_id)
        VALUES (p_wallet_id, p_service_type, p_amount, p_direction::transaction_direction, p_status::transaction_status, p_description, p_reference, p_meta, p_request_id)
        RETURNING * INTO v_transaction;
        UPDATE wallets SET balance_total = v_new_total, balance_withdrawable = v_new_withdrawable WHERE id = p_wallet_id;
        RETURN JSON_BUILD_OBJECT('transaction', ROW_TO_JSON(v_transaction), 'balance_total', v_new_total, 'balance_withdrawable', v_new_withdrawable, 'idempotent', false);
      END;
      $body$;
    `);

    await client.query(`
      CREATE OR REPLACE FUNCTION public.move_funds_safe(p_wallet_id uuid, p_amount numeric, p_to_withdrawable boolean)
      RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $body$
      DECLARE v_total numeric; v_withdrawable numeric;
      BEGIN
        SELECT balance_total, balance_withdrawable INTO v_total, v_withdrawable FROM wallets WHERE id = p_wallet_id FOR UPDATE;
        IF p_to_withdrawable THEN
          IF p_amount > (v_total - v_withdrawable) THEN RAISE EXCEPTION 'Insufficient held funds'; END IF;
          v_withdrawable := v_withdrawable + p_amount;
        ELSE
          IF p_amount > v_withdrawable THEN RAISE EXCEPTION 'Insufficient withdrawable funds'; END IF;
          v_withdrawable := v_withdrawable - p_amount;
        END IF;
        UPDATE wallets SET balance_withdrawable = v_withdrawable WHERE id = p_wallet_id;
        RETURN JSON_BUILD_OBJECT('balance_total', v_total, 'balance_withdrawable', v_withdrawable);
      END;
      $body$;
    `);

    await client.query(`
      CREATE OR REPLACE FUNCTION public.decrement_stock(p_row_id text)
      RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $body$
      BEGIN
        UPDATE marketplace_products SET stock_quantity = stock_quantity - 1 WHERE id = p_row_id AND stock_quantity > 0;
        IF NOT FOUND THEN RAISE EXCEPTION 'Product out of stock or not found'; END IF;
        RETURN true;
      END;
      $body$;
    `);

    isDbVerified = true;
    console.log("[9jaPulse] Database self-healing schema checks verified successfully.");
  } catch (err: unknown) {
    console.error("[9jaPulse] Automatic database self-healing checks failed:", err instanceof Error ? err.message : err);
  } finally {
    try {
      await client.end();
    } catch {}
  }
}

/**
 * Tests direct Postgres connection.
 */
export async function testDatabaseConnection(dbUrl: string) {
  if (!dbUrl) throw new Error("Database URL is required");
  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    await client.query("SELECT 1");
    return { success: true, message: "Connected to database successfully!" };
  } catch (err: unknown) {
    throw new Error(err instanceof Error ? err.message : "Connection failed");
  } finally {
    try {
      await client.end();
    } catch {}
  }
}

/**
 * Reads and applies the full supabase/schema.sql script directly on the database.
 */
export async function runFullMigration(dbUrl: string) {
  if (!dbUrl) throw new Error("Database URL is required");

  // Read schema file
  const schemaPath = path.join(process.cwd(), "supabase", "schema.sql");
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found at ${schemaPath}`);
  }

  const sqlContent = fs.readFileSync(schemaPath, "utf8");
  const client = new Client({ connectionString: dbUrl });

  try {
    await client.connect();
    await client.query("BEGIN;");
    // Node-pg can execute multiple queries separated by semicolons in one call
    await client.query(sqlContent);
    await client.query("COMMIT;");
    
    // Mark as verified since schema is fully recreated
    isDbVerified = true;
    
    return { success: true, message: "Schema migrations applied successfully!" };
  } catch (err: unknown) {
    try {
      await client.query("ROLLBACK;");
    } catch {}
    throw new Error(err instanceof Error ? err.message : "Failed to execute database migration");
  } finally {
    try {
      await client.end();
    } catch {}
  }
}

export interface ProviderKeyRow {
  id: string;
  provider: string;
  key_name: string;
  key_value: string;
  is_active: boolean;
  created_at: string;
}

/**
 * Fetches all provider keys directly using pg.
 */
export async function getProviderKeysAdmin(dbUrl: string): Promise<ProviderKeyRow[]> {
  const client = dbUrl ? new Client({ connectionString: dbUrl }) : null;
  if (client) {
    try {
      await client.connect();
      // Auto-create table if missing before querying
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.provider_keys (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          provider text NOT NULL,
          key_name text NOT NULL,
          key_value text NOT NULL,
          is_active boolean NOT NULL DEFAULT true,
          created_at timestamptz NOT NULL DEFAULT now(),
          UNIQUE (provider, key_name)
        );
      `);
      const res = await client.query("SELECT * FROM public.provider_keys ORDER BY provider, key_name");
      return res.rows.map(row => ({
        id: row.id,
        provider: row.provider,
        key_name: row.key_name,
        key_value: "â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢",
        is_active: row.is_active,
        created_at: row.created_at ? new Date(row.created_at).toISOString() : "",
      }));
    } catch (err: unknown) {
      console.warn("[9jaPulse] PG direct connection failed in getProviderKeysAdmin, trying HTTPS API fallback:", err);
    } finally {
      try {
        await client.end();
      } catch {}
    }
  }

  // Fallback to HTTPS API client
  const svc = createServiceClient() as any;
  const { data, error } = await svc
    .from("provider_keys")
    .select("*")
    .order("provider", { ascending: true })
    .order("key_name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map((row: any) => ({
    id: row.id,
    provider: row.provider,
    key_name: row.key_name,
    key_value: "â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢",
    is_active: row.is_active,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : "",
  }));
}

/**
 * Upserts a provider key in the database.
 */
export async function saveProviderKeyAdmin(
  dbUrl: string,
  provider: string,
  keyName: string,
  keyValue: string
) {
  const provClean = provider.toLowerCase().trim();
  const keyClean = keyName.toLowerCase().trim();
  const valClean = keyValue.trim();

  if (!provClean || !keyClean || !valClean) throw new Error("All fields (provider, key name, key value) are required");

  if (dbUrl) {
    const client = new Client({ connectionString: dbUrl });
    try {
      await client.connect();
      await client.query(`
        INSERT INTO public.provider_keys (provider, key_name, key_value, is_active)
        VALUES ($1, $2, $3, true)
        ON CONFLICT (provider, key_name)
        DO UPDATE SET key_value = EXCLUDED.key_value, is_active = true;
      `, [provClean, keyClean, valClean]);
      return { success: true };
    } catch (err) {
      console.warn("[9jaPulse] PG direct connection failed in saveProviderKeyAdmin, trying HTTPS API fallback:", err);
    } finally {
      try {
        await client.end();
      } catch {}
    }
  }

  // Fallback to HTTPS API client
  const svc = createServiceClient() as any;
  const { error } = await svc
    .from("provider_keys")
    .upsert({
      provider: provClean,
      key_name: keyClean,
      key_value: valClean,
      is_active: true
    }, { onConflict: "provider, key_name" });

  if (error) throw new Error(error.message);
  return { success: true };
}

/**
 * Syncs dynamic data plans from the GSubz API and saves them to the database.
 */
export async function syncGSubzDataPlansAdmin(customDbUrl?: string): Promise<{ success: boolean; message: string }> {
  const dbUrl = customDbUrl || process.env.DATABASE_URL;

  // 1. Fetch GSubz API key using service role client
  const svc = createServiceClient() as any;
  const { data: activeKey, error: keyErr } = await svc
    .from("provider_keys")
    .select("key_value")
    .eq("provider", "gsubz")
    .eq("key_name", "api_key")
    .eq("is_active", true)
    .maybeSingle();

  const apiKey = activeKey?.key_value || process.env.GSUBZ_API_KEY;
  if (!apiKey) {
    throw new Error("GSubz api_key is missing. Please save it in Provider Keys.");
  }

  const services = [
    "mtn_sme",
    "mtn_cg_lite",
    "mtn_gifting",
    "mtn_datashare",
    "mtn_coupon",
    "mtncg",
    "airtel_gifting",
    "airtel_sme",
    "airtel_cg",
    "glo_data",
    "glo_sme",
    "etisalat_data"
  ];

  let totalSynced = 0;
  let useHttpsFallback = false;
  let client: Client | null = null;

  if (dbUrl) {
    try {
      client = new Client({ connectionString: dbUrl });
      await client.connect();
      console.log("[9jaPulse] Sync using direct PG connection");
    } catch (err) {
      console.warn("[9jaPulse] PG direct connection failed in syncGSubzDataPlansAdmin, falling back to HTTPS client:", err);
      useHttpsFallback = true;
      client = null;
    }
  } else {
    useHttpsFallback = true;
    console.log("[9jaPulse] Sync using HTTPS fallback (no DATABASE_URL)");
  }

  try {
    for (const service of services) {
      try {
        const url = `https://api.gsubz.com/api/plans/?service=${encodeURIComponent(service)}`;
        const res = await fetch(url, {
          headers: {
            "Authorization": `Bearer ${apiKey}`,
          }
        });
        if (!res.ok) continue;

        const data = await res.json();
        if (data.error || !data.plans || !Array.isArray(data.plans)) {
          console.warn(`[9jaPulse] GSubz API returned error or invalid plans for service ${service}:`, data.error || "No plans");
          continue;
        }

        const discount = data.discount || "0%";
        const fixedPrice = data.fixedPrice !== false;
        const fullName = data.service || service.replace(/_/g, " ").toUpperCase();
        const planCount = data.plans?.length ?? 0;
        console.log(`[9jaPulse] Syncing ${service}: ${planCount} plans from API`);

        const currentValues: string[] = [];

        for (const plan of data.plans) {
          if (!plan.value) continue;
          const displayName = plan.displayName || "Unknown Plan";
          const value = String(plan.value);
          const price = Number(plan.price) || 0;
          currentValues.push(value);

          if (client && !useHttpsFallback) {
            await client.query(`
              INSERT INTO public.data_plans (service, display_name, plan_value, price, discount, fixed_price, full_service_name)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
              ON CONFLICT (service, plan_value)
              DO UPDATE SET 
                display_name = EXCLUDED.display_name, 
                price = EXCLUDED.price, 
                discount = EXCLUDED.discount, 
                fixed_price = EXCLUDED.fixed_price, 
                full_service_name = EXCLUDED.full_service_name,
                created_at = now()
            `, [service, displayName, value, price, discount, fixedPrice, fullName]);
          } else {
            const { error: upsertErr } = await svc
              .from("data_plans")
              .upsert({
                service,
                display_name: displayName,
                plan_value: value,
                price,
                discount,
                fixed_price: fixedPrice,
                full_service_name: fullName
              }, { onConflict: "service, plan_value" });
            if (upsertErr) throw upsertErr;
          }

          totalSynced++;
        }

        console.log(`[9jaPulse] ${service}: upserted ${currentValues.length} plans`);

        // Delete plans that no longer exist for this service
        if (currentValues.length > 0) {
          if (client && !useHttpsFallback) {
            const placeholders = currentValues.map((_, i) => `$${i + 2}`).join(",");
            await client.query(`
              DELETE FROM public.data_plans
              WHERE service = $1 AND plan_value NOT IN (${placeholders})
            `, [service, ...currentValues]);
          } else {
            const { data: existingPlans } = await svc
              .from("data_plans")
              .select("plan_value")
              .eq("service", service);

            if (existingPlans && existingPlans.length > 0) {
              const toDelete = existingPlans
                .map((p: any) => p.plan_value)
                .filter((pv: string) => !currentValues.includes(pv));

              for (const pv of toDelete) {
                await svc
                  .from("data_plans")
                  .delete()
                  .eq("service", service)
                  .eq("plan_value", pv);
              }
            }
          }
        }
      } catch (svcErr) {
        console.error(`[9jaPulse] Failed to sync service ${service}:`, svcErr);
      }
    }

    return {
      success: true,
      message: `Successfully synchronized ${totalSynced} data plans from GSubz API!`,
    };
  } catch (err: any) {
    console.error("[9jaPulse] GSubz data plans sync failed:", err);
    throw new Error(err.message || "Failed to sync plans");
  } finally {
    if (client) {
      try {
        await client.end();
      } catch {}
    }
  }
}



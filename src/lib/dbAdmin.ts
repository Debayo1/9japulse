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
        ('prod-5', 'Waterproof Bluetooth Speaker', 'IPX7-rated portable wireless speaker with 360° rich bass sound for outdoors.', 7500.00, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500', 'Electronics', 4.7, 45),
        ('prod-6', 'RGB LED Desk Lamp', 'Smart color-changing bedside lamp with 16 million colors and app-controlled lighting modes.', 6200.00, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500', 'Electronics', 4.4, 70),
        ('prod-7', 'Polarized Aviator Sunglasses', 'Classic gold-frame aviator shades with UV400 polarized lenses for style and eye protection.', 3500.00, 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500', 'Fashion', 4.6, 85),
        ('prod-8', 'Large Travel Backpack', '40L waterproof backpack with USB charging port, laptop sleeve and anti-theft pockets.', 11500.00, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500', 'Fashion', 4.8, 40),
        ('prod-9', 'Portable Rechargeable Fan', 'USB mini turbo fan with 3 wind speeds and 8-hour battery — perfect for the Nigerian heat.', 3800.00, 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=500', 'Gadgets', 4.3, 150),
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
        key_value: "••••••••",
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
    key_value: "••••••••",
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
    } catch (err) {
      console.warn("[9jaPulse] PG direct connection failed in syncGSubzDataPlansAdmin, falling back to HTTPS client:", err);
      useHttpsFallback = true;
      client = null;
    }
  } else {
    useHttpsFallback = true;
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

        // Delete plans that no longer exist for this service
        if (currentValues.length > 0) {
          if (client && !useHttpsFallback) {
            const placeholders = currentValues.map((_, i) => `$${i + 2}`).join(",");
            await client.query(`
              DELETE FROM public.data_plans
              WHERE service = $1 AND plan_value NOT IN (${placeholders})
            `, [service, ...currentValues]);
          } else {
            // Replaced custom array exclusion with simpler Supabase API command
            await svc
              .from("data_plans")
              .delete()
              .eq("service", service)
              .not("plan_value", "in", `(${currentValues.map(v => `"${v}"`).join(",")})`);
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



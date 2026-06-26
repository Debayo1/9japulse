"use server";

import { Client } from "pg";
import fs from "fs";
import path from "path";

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
    `);

    // 2. Ensure provider_keys table exists so key operations don't crash
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

    isDbVerified = true;
    console.log("[9jaPulse] Database self-healing schema checks verified successfully.");
  } catch (err: any) {
    console.error("[9jaPulse] Automatic database self-healing checks failed:", err.message || err);
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
  } catch (err: any) {
    throw new Error(err.message || "Connection failed");
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
  } catch (err: any) {
    try {
      await client.query("ROLLBACK;");
    } catch {}
    throw new Error(err.message || "Failed to execute database migration");
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
  if (!dbUrl) throw new Error("Database URL is required");
  const client = new Client({ connectionString: dbUrl });
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
      key_value: row.key_value,
      is_active: row.is_active,
      created_at: row.created_at ? new Date(row.created_at).toISOString() : "",
    }));
  } catch (err: any) {
    throw new Error(err.message || "Failed to query provider keys");
  } finally {
    try {
      await client.end();
    } catch {}
  }
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
  if (!dbUrl) throw new Error("Database URL is required");
  if (!provider || !keyName || !keyValue) throw new Error("All fields (provider, key name, key value) are required");

  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    await client.query(`
      INSERT INTO public.provider_keys (provider, key_name, key_value, is_active)
      VALUES ($1, $2, $3, true)
      ON CONFLICT (provider, key_name)
      DO UPDATE SET key_value = EXCLUDED.key_value, is_active = true;
    `, [provider.toLowerCase().trim(), keyName.toLowerCase().trim(), keyValue.trim()]);
    
    return { success: true };
  } catch (err: any) {
    throw new Error(err.message || "Failed to update provider key");
  } finally {
    try {
      await client.end();
    } catch {}
  }
}

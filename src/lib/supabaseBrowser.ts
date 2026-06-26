import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Browser-side Supabase client.
 * Use this ONLY in "use client" components.
 * It persists the session in localStorage automatically.
 */
export const supabaseBrowser = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "9japulse-auth",
    },
  }
);

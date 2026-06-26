import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!supabaseUrl || supabaseUrl === "https://REPLACE_ME.supabase.co") {
  console.warn(
    "[9jaPulse] NEXT_PUBLIC_SUPABASE_URL is not set. " +
    "Open .env.local and add your Supabase project URL."
  );
}

export const supabase = createClient<Database>(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? supabaseAnonKey;

/**
 * Creates a Supabase client authenticated as the current request user.
 * Reads the access token from:
 *   1. Cookie "sb-<ref>-auth-token" (set by @supabase/ssr or supabase-js v2)
 *   2. Authorization: Bearer <token> header (useful for API clients)
 *
 * Returns { supabase: client, user } — user is null if not authenticated.
 */
export async function createRequestClient(req: NextRequest) {
  let accessToken: string | null = null;

  // 1. Try to read from Authorization header
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    accessToken = authHeader.slice(7);
  }

  // 2. Try to read from Supabase cookies (supabase-js v2 sets sb-*-auth-token)
  if (!accessToken) {
    // Cookie name format: sb-<project-ref>-auth-token
    for (const [name, cookie] of req.cookies) {
      if (name.startsWith("sb-") && name.endsWith("-auth-token")) {
        try {
          // Cookie value is JSON: { access_token, refresh_token, ... }
          const parsed = JSON.parse(decodeURIComponent(cookie.value));
          if (parsed?.access_token) {
            accessToken = parsed.access_token;
          }
        } catch {
          // might be a plain string token
          accessToken = cookie.value;
        }
        break;
      }
    }
  }

  // 3. Build a client. If we have a token, set it as the session.
  const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : {},
  });

  // Get the user from the token
  if (!accessToken) return { supabase: client, user: null };

  const { data, error } = await client.auth.getUser(accessToken);
  if (error || !data.user) return { supabase: client, user: null };

  return { supabase: client, user: data.user };
}

/**
 * Service-role client — bypasses RLS, use only for trusted server operations.
 */
export function createServiceClient() {
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Creates a request-scoped Supabase client that parses the auth cookie
 * from Next.js dynamic headers (next/headers cookies).
 * Use this in Server Components and Server Actions.
 */
export async function createServerClient() {
  let accessToken: string | null = null;
  let refreshToken: string | null = null;

  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    for (const cookie of allCookies) {
      if (cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token")) {
        try {
          const parsed = JSON.parse(decodeURIComponent(cookie.value));
          if (parsed?.access_token) {
            accessToken = parsed.access_token;
          }
          if (parsed?.refresh_token) {
            refreshToken = parsed.refresh_token;
          }
        } catch {
          accessToken = cookie.value;
        }
        break;
      }
    }
  } catch (e) {
    // cookies() might fail if not in a request context
    console.error("[createServerClient] Failed to read cookies:", e);
  }

  const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : {},
  });

  return { client, accessToken, refreshToken };
}

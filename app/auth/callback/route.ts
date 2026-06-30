import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/home";

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      }
    });

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.session) {
      const ref = supabaseUrl.match(/https:\/\/([^.]+)\.supabase/)?.[1] || "project";
      const cookieName = `sb-${ref}-auth-token`;
      const value = encodeURIComponent(
        JSON.stringify({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        })
      );

      const cookieStore = await cookies();
      cookieStore.set(cookieName, value, {
        path: "/",
        maxAge: data.session.expires_in,
        sameSite: "lax",
        secure: requestUrl.protocol === "https:",
        httpOnly: false
      });
    }
  }

  return NextResponse.redirect(new URL(next, req.url));
}

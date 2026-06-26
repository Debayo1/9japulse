"use client";

import { useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function AuthSync() {
  useEffect(() => {
    const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange((event, session) => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const ref = url.match(/https:\/\/([^.]+)\.supabase/)?.[1] || "project";
      const cookieName = `sb-${ref}-auth-token`;

      const secure = window.location.protocol === "https:" ? "; Secure" : "";

      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session) {
        const value = encodeURIComponent(
          JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          })
        );
        document.cookie = `${cookieName}=${value}; path=/; max-age=${session.expires_in}; SameSite=Lax${secure}`;
      } else if (event === "SIGNED_OUT") {
        document.cookie = `${cookieName}=; path=/; max-age=0; SameSite=Lax${secure}`;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
}

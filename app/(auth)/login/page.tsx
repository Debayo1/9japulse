"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Envelope, Lock, Eye, EyeSlash } from "@phosphor-icons/react";
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import IosInstallPrompt from "@/components/IosInstallPrompt";

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = fd.get("email") as string;
    const password = fd.get("password") as string;

    startTransition(async () => {
      try {
        const { data, error } = await supabaseBrowser.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);

        // Manually set cookie before redirect to ensure Next.js server sees it
        if (data?.session) {
          const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
          const ref = url.match(/https:\/\/([^.]+)\.supabase/)?.[1] || "project";
          const cookieName = `sb-${ref}-auth-token`;
          const value = encodeURIComponent(
            JSON.stringify({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            })
          );
          const secure = window.location.protocol === "https:" ? "; Secure" : "";
          document.cookie = `${cookieName}=${value}; path=/; max-age=${data.session.expires_in}; SameSite=Lax${secure}`;
        }

        toast.success("Welcome back!");
        router.replace("/home");
      } catch (err: unknown) {
        toast.error((err as Error).message ?? "Login failed");
      }
    });
  };

  return (
    <div className="auth-page">
      {/* Heading */}
      <div className="auth-heading">
        <h1>Welcome back</h1>
        <p>Sign in to your 9jaPulse account</p>
      </div>

      <form onSubmit={handleSubmit} className="animate-scale-in" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Email */}
        <div>
          <label htmlFor="login-email" style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "0.375rem" }}>
            Email Address
          </label>
          <div style={{ position: "relative" }}>
            <Envelope size={18} weight="regular" color="var(--text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input
              id="login-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="input"
              style={{ paddingLeft: "2.75rem" }}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.375rem" }}>
            <label htmlFor="login-password" style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)" }}>
              Password
            </label>
            <Link href="/reset-password" style={{ fontSize: "0.75rem", color: "var(--color-primary)", textDecoration: "none", fontWeight: 600 }}>
              Forgot?
            </Link>
          </div>
          <div style={{ position: "relative" }}>
            <Lock size={18} weight="regular" color="var(--text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input
              id="login-password"
              name="password"
              type={showPwd ? "text" : "password"}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="input"
              style={{ paddingLeft: "2.75rem", paddingRight: "2.75rem" }}
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              aria-label={showPwd ? "Hide password" : "Show password"}
              style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}
            >
              {showPwd ? <EyeSlash size={18} weight="regular" /> : <Eye size={18} weight="regular" />}
            </button>
          </div>
        </div>

        <button id="login-submit-btn" type="submit" className="btn btn-primary btn-full" style={{ height: "48px", marginTop: "0.25rem" }} disabled={isPending}>
          {isPending ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <p style={{ textAlign: "center", marginTop: "2rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
        Don&apos;t have an account?{" "}
        <Link href="/register" style={{ color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>
          Create one
        </Link>
      </p>
      <IosInstallPrompt />
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Envelope, Lock, Eye, EyeSlash } from "@phosphor-icons/react";
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

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
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "2.5rem 1.5rem", maxWidth: 420, margin: "0 auto" }}>
      {/* Logo / Brand */}
      <div style={{ textAlign: "left", marginBottom: "2.5rem" }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 0 1.25rem 0", fontSize: "1.5rem", fontWeight: 900, color: "white", boxShadow: "var(--shadow-glow)" }}>
          ₦
        </div>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>Welcome Back</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.375rem" }}>Sign in to continue to 9jaPulse</p>
      </div>

      <form onSubmit={handleSubmit} className="animate-slide-up" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Email */}
        <div>
          <label htmlFor="login-email" style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.5rem" }}>
            Email Address
          </label>
          <div style={{ position: "relative" }}>
            <Envelope size={18} weight="regular" color="var(--text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input
              id="login-email"
              name="email"
              type="email"
              placeholder="e.g. user@gmail.com"
              required
              autoComplete="email"
              className="input"
              style={{ paddingLeft: "2.75rem" }}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5rem" }}>
            <label htmlFor="login-password" style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)" }}>
              Password
            </label>
            <Link href="/reset-password" style={{ fontSize: "0.75rem", color: "var(--color-primary)", textDecoration: "none", fontWeight: 600 }}>
              Forgot password?
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

        <button id="login-submit-btn" type="submit" className="btn btn-primary btn-full" style={{ height: "48px", marginTop: "0.5rem" }} disabled={isPending}>
          {isPending ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <p style={{ textAlign: "left", marginTop: "2rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
        Don&apos;t have an account?{" "}
        <Link href="/register" style={{ color: "var(--color-primary)", fontWeight: 700, textDecoration: "none" }}>
          Create one
        </Link>
      </p>
    </div>
  );
}

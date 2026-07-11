"use client";

import { useTransition, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Envelope, ArrowLeft, Lock } from "@phosphor-icons/react";
import { toast } from "sonner";
import { resetPassword, updatePassword } from "@/lib/auth";

function ResetPasswordContent() {
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // Check if we arrived here after verifying via reset-confirm callback
    if (searchParams.get("verified") === "true") {
      setIsVerified(true);
    }
  }, [searchParams]);

  const handleSendLink = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = fd.get("email") as string;

    startTransition(async () => {
      try {
        await resetPassword(email);
        toast.success("Reset link sent! Check your inbox.");
        (e.target as HTMLFormElement).reset();
      } catch (err: unknown) {
        toast.error((err as Error).message ?? "Failed to send reset email");
      }
    });
  };

  const handleSetNewPassword = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newPassword = fd.get("new_password") as string;
    const confirmPassword = fd.get("confirm_password") as string;

    if (!newPassword || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    startTransition(async () => {
      try {
        await updatePassword(newPassword);
        toast.success("Password updated! You can now log in.");
        router.push("/login");
      } catch (err: unknown) {
        toast.error((err as Error).message ?? "Failed to update password");
      }
    });
  };

  // ── Verified: Set New Password form ──────────────────────────────
  if (isVerified) {
    return (
      <div className="auth-page">
        <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", color: "var(--text-secondary)", textDecoration: "none", marginBottom: "2rem", fontSize: "0.8125rem", fontWeight: 500 }}>
          <ArrowLeft size={16} /> Back to login
        </Link>

        <div className="auth-heading" style={{ textAlign: "left" }}>
          <h1>Set New Password</h1>
          <p>Your identity has been verified. Choose a new password.</p>
        </div>

        <form onSubmit={handleSetNewPassword} className="animate-scale-in" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label htmlFor="new-password" style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "0.375rem" }}>
              New Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={18} color="var(--text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input
                id="new-password"
                name="new_password"
                type="password"
                placeholder="Min. 8 characters"
                required
                minLength={8}
                autoComplete="new-password"
                className="input"
                style={{ paddingLeft: "2.75rem" }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="confirm-password" style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "0.375rem" }}>
              Confirm Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={18} color="var(--text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input
                id="confirm-password"
                name="confirm_password"
                type="password"
                placeholder="Re-enter password"
                required
                minLength={8}
                autoComplete="new-password"
                className="input"
                style={{ paddingLeft: "2.75rem" }}
              />
            </div>
          </div>

          <button id="reset-submit-btn" type="submit" className="btn btn-primary btn-full" style={{ height: "48px" }} disabled={isPending}>
            {isPending ? "Updating…" : "Update Password"}
          </button>
        </form>
      </div>
    );
  }

  // ── Default: Send Reset Link form ────────────────────────────────
  return (
    <div className="auth-page">
      <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", color: "var(--text-secondary)", textDecoration: "none", marginBottom: "2rem", fontSize: "0.8125rem", fontWeight: 500 }}>
        <ArrowLeft size={16} /> Back to login
      </Link>

      <div className="auth-heading" style={{ textAlign: "left" }}>
        <h1>Reset Password</h1>
        <p>Enter your email and we&apos;ll send you a reset link.</p>
      </div>

      <form onSubmit={handleSendLink} className="animate-scale-in" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label htmlFor="reset-email" style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "0.375rem" }}>
            Email Address
          </label>
          <div style={{ position: "relative" }}>
            <Envelope size={18} color="var(--text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input
              id="reset-email"
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

        <button id="reset-submit-btn" type="submit" className="btn btn-primary btn-full" style={{ height: "48px" }} disabled={isPending}>
          {isPending ? "Sending…" : "Send Reset Link"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="skeleton" style={{ width: "24px", height: "24px", borderRadius: "50%" }} />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}

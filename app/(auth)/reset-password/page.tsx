"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Envelope, ArrowLeft } from "@phosphor-icons/react";
import { toast } from "sonner";
import { resetPassword } from "@/lib/auth";

export default function ResetPasswordPage() {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
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

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "2rem 1.5rem", maxWidth: 440, margin: "0 auto" }}>
      <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", color: "var(--text-secondary)", textDecoration: "none", marginBottom: "2rem", fontSize: "0.875rem" }}>
        <ArrowLeft size={16} /> Back to login
      </Link>

      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800 }}>Reset Password</h1>
        <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>
          Enter your email and we'll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="animate-slide-up" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ position: "relative" }}>
          <Envelope size={18} color="var(--text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <input
            id="reset-email"
            name="email"
            type="email"
            placeholder="Your email address"
            required
            autoComplete="email"
            className="input"
            style={{ paddingLeft: "2.75rem" }}
          />
        </div>

        <button id="reset-submit-btn" type="submit" className="btn btn-primary btn-full" disabled={isPending}>
          {isPending ? "Sending…" : "Send Reset Link"}
        </button>
      </form>
    </div>
  );
}

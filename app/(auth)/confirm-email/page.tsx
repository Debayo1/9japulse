"use client";

import Link from "next/link";
import { Envelope, ArrowRight } from "@phosphor-icons/react";

export default function ConfirmEmailPage() {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "2.5rem 1.5rem", maxWidth: 420, margin: "0 auto" }}>
      {/* Brand Header */}
      <div style={{ textAlign: "left", marginBottom: "2rem" }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 0 1.25rem 0", fontSize: "1.5rem", fontWeight: 900, color: "white", boxShadow: "var(--shadow-glow)" }}>
          <Envelope size={26} weight="fill" />
        </div>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>Confirm Your Email</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.5rem" }}>
          We've sent a verification link to your email address.
        </p>
      </div>

      <div className="card" style={{ padding: "1.25rem", marginBottom: "2rem" }}>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
          Please check your inbox (and spam/junk folder) for the verification link. Click the link to activate your 9jaPulse account.
        </p>
      </div>

      <Link
        href="/login"
        className="btn btn-primary btn-full"
        style={{ height: "48px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", textDecoration: "none" }}
      >
        Back to Login <ArrowRight size={16} weight="bold" />
      </Link>
    </div>
  );
}

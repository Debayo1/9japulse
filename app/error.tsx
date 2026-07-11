"use client";

import { WarningCircle, ArrowCounterClockwise } from "@phosphor-icons/react/dist/ssr";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="auth-page">
      <div className="auth-heading">
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: "linear-gradient(135deg, var(--color-danger), var(--color-accent))",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 1.25rem", color: "white", boxShadow: "var(--shadow-glow)"
        }}>
          <WarningCircle size={32} weight="fill" />
        </div>
        <h1>Something went wrong</h1>
        <p>An unexpected error occurred. Please try again.</p>
      </div>
      <button
        onClick={reset}
        className="btn btn-primary btn-full"
        style={{ height: 48, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
      >
        <ArrowCounterClockwise size={16} weight="bold" />
        Try Again
      </button>
    </div>
  );
}

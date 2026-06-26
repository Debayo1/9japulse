"use client";

import { toast } from "sonner";

export default function PromoBanner() {
  return (
    <section style={{ marginBottom: "1.5rem" }}>
      <div
        style={{
          background: "linear-gradient(135deg, hsl(243 75% 35%), hsl(265 85% 25%))",
          color: "#ffffff",
          borderRadius: "20px",
          padding: "1.25rem",
          position: "relative",
          overflow: "hidden",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {/* Subtle gold badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            background: "rgba(255, 255, 255, 0.12)",
            padding: "4px 8px",
            borderRadius: "8px",
            fontSize: "0.6875rem",
            fontWeight: 700,
            color: "#FBBF24",
            marginBottom: "0.75rem",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <span>👑</span> Pulse Savings Vault
        </div>
        <h3 style={{ fontSize: "1.0625rem", fontWeight: 800, margin: "0 0 0.25rem 0", color: "#ffffff", lineHeight: 1.2 }}>
          Pulse Lock & Earn Vaults
        </h3>
        <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.75)", margin: "0 0 1rem 0", lineHeight: 1.4, maxWidth: "80%" }}>
          Save your withdrawable funds into our automated vaults to earn high-yield cashback rewards.
        </p>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => toast.info("Savings vaults feature coming soon")}
            style={{
              background: "#ffffff",
              color: "hsl(243 75% 35%)",
              border: "none",
              borderRadius: "10px",
              padding: "6px 12px",
              fontSize: "0.75rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            View Vaults
          </button>
          <button
            onClick={() => toast.info("Savings vaults feature coming soon")}
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              padding: "6px 12px",
              fontSize: "0.75rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            How it works
          </button>
        </div>
      </div>
    </section>
  );
}

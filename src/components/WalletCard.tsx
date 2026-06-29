"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bank, Eye, EyeSlash, PlusCircle } from "@phosphor-icons/react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

interface WalletCardProps {
  walletId: string;
  balanceTotal: number;
  balanceWithdrawable: number;
  userName: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(n);

function StatPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        padding: "0.8rem 0.9rem",
        borderRadius: 18,
        background: "color-mix(in srgb, var(--bg-base) 72%, transparent)",
      }}
    >
      <p style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
        {label}
      </p>
      <p style={{ fontSize: "0.92rem", fontWeight: 800, color: "var(--text-primary)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {value}
      </p>
    </div>
  );
}

export default function WalletCard({
  walletId,
  balanceTotal,
  balanceWithdrawable,
  userName,
}: WalletCardProps) {
  const router = useRouter();
  const [hidden, setHidden] = useState(false);
  const [balances, setBalances] = useState({
    total: balanceTotal,
    withdrawable: balanceWithdrawable,
  });

  useEffect(() => {
    const channel = supabaseBrowser
      .channel(`wallet-changes-${walletId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "wallets",
          filter: `id=eq.${walletId}`,
        },
        (payload) => {
          if (!payload.new) return;
          setBalances({
            total: Number(payload.new.balance_total),
            withdrawable: Number(payload.new.balance_withdrawable),
          });
        }
      )
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, [walletId]);

  const lockedBalance = Math.max(0, balances.total - balances.withdrawable);
  const firstName = userName.split(" ")[0] || "User";

  return (
    <section
      className="animate-slide-up"
      style={{
        marginBottom: "1.1rem",
        borderRadius: 28,
        padding: "1.2rem",
        background: "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 12%, var(--bg-elevated)), color-mix(in srgb, var(--bg-elevated) 90%, var(--color-accent) 10%))",
        boxShadow: "0 18px 40px -24px rgba(15, 23, 42, 0.28)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at top right, rgba(255,255,255,0.18), transparent 38%), radial-gradient(circle at left bottom, rgba(255,255,255,0.08), transparent 30%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Bank size={18} weight="duotone" color="var(--color-primary)" />
            <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              Wallet Balance
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/deposit")}
            style={{
              flexShrink: 0,
              border: "none",
              borderRadius: 999,
              padding: "0.55rem 0.85rem",
              background: "var(--color-primary)",
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              fontSize: "0.75rem",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 10px 22px -14px rgba(79, 70, 229, 0.8)",
            }}
          >
            <PlusCircle size={15} weight="fill" />
            Deposit
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginBottom: "1rem" }}>
          <p style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", margin: 0 }}>
            Total Balance
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <h1 style={{ fontSize: "2rem", lineHeight: 1.1, margin: 0, fontWeight: 900, letterSpacing: "-0.04em", color: "var(--text-primary)" }}>
              {hidden ? "••••••••" : fmt(balances.total)}
            </h1>
            <button
              type="button"
              onClick={() => setHidden((value) => !value)}
              aria-label={hidden ? "Show balance" : "Hide balance"}
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: "none",
                background: "color-mix(in srgb, var(--bg-base) 70%, transparent)",
                color: "var(--text-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0
              }}
            >
              {hidden ? <Eye size={15} weight="fill" /> : <EyeSlash size={15} weight="regular" />}
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.7rem" }}>
          <StatPill label="Withdrawable" value={hidden ? "••••••" : fmt(balances.withdrawable)} />
          <StatPill label="Locked" value={hidden ? "••••••" : fmt(lockedBalance)} />
        </div>
      </div>
    </section>
  );
}

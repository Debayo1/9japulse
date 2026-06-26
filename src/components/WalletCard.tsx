"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeSlash, ArrowCircleDown, ArrowCircleUp, Copy, ClockCounterClockwise } from "@phosphor-icons/react";
import { toast } from "sonner";
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

export default function WalletCard({
  walletId,
  balanceTotal,
  balanceWithdrawable,
  userName,
}: WalletCardProps) {
  const router = useRouter();
  const [hidden, setHidden] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const [balances, setBalances] = useState({
    total: balanceTotal,
    withdrawable: balanceWithdrawable,
  });

  useEffect(() => {
    setBalances({
      total: balanceTotal,
      withdrawable: balanceWithdrawable,
    });
  }, [balanceTotal, balanceWithdrawable]);

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
          if (payload.new) {
            setBalances({
              total: Number(payload.new.balance_total),
              withdrawable: Number(payload.new.balance_withdrawable),
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, [walletId]);

  const lockedBalance = balances.total - balances.withdrawable;

  const toggleHidden = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHidden((h) => !h);
  };

  const copyAccount = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText("9070578999");
    toast.success("Virtual account number copied!");
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const scrollLeft = container.scrollLeft;
    const active = Math.round(scrollLeft / width);
    if (active !== activeSlide && active >= 0 && active <= 2) {
      setActiveSlide(active);
    }
  };

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      {/* ─── Swiping Cards ViewPager ────────────────────────────────────── */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="viewpager-container"
        style={{
          paddingBottom: "1.25rem",
        }}
      >
        {/* Slide 1: Total Balance Card */}
        <div
          className="viewpager-slide wallet-slide-total"
          style={{
            padding: "1.25rem",
            position: "relative",
            minHeight: "115px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderRadius: "20px",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, opacity: 0.9 }}>
                Hi, {userName.split(" ")[0]}
              </span>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                <div
                  onClick={copyAccount}
                  className="bank-pill"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "rgba(0, 0, 0, 0.05)",
                    padding: "3px 8px",
                    borderRadius: "10px",
                    fontSize: "0.625rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all var(--duration-fast)",
                    border: "1px solid rgba(0, 0, 0, 0.04)",
                    color: "inherit",
                  }}
                >
                  <span>9jaPulse MFB • 9070578999</span>
                  <Copy size={11} weight="regular" />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.info("Funding virtual accounts created in dashboard");
                  }}
                  style={{
                    background: "var(--color-primary)",
                    color: "#ffffff",
                    border: "none",
                    padding: "3px 8px",
                    borderRadius: "8px",
                    fontSize: "0.625rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "3px",
                    boxShadow: "0 2px 6px hsl(243 75% 58% / 0.15)",
                  }}
                >
                  <ArrowCircleDown size={12} weight="fill" />
                  Add Money
                </button>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1rem" }}>
              <p style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.02em", color: "inherit", margin: 0, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                {hidden ? "₦ ••••••" : fmt(balances.total)}
              </p>
              <button
                onClick={toggleHidden}
                style={{ padding: "4px", background: "transparent", border: "none", color: "inherit", cursor: "pointer", opacity: 0.8, display: "flex", alignItems: "center", justifyContent: "center" }}
                aria-label={hidden ? "Show balance" : "Hide balance"}
              >
                {hidden ? <Eye size={20} weight="fill" /> : <EyeSlash size={20} weight="regular" />}
              </button>
            </div>
          </div>
        </div>

        {/* Slide 2: Withdrawable Cash Card */}
        <div
          className="viewpager-slide wallet-slide-withdrawable"
          style={{
            padding: "1.25rem",
            position: "relative",
            minHeight: "115px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderRadius: "20px",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, opacity: 0.9 }}>
                Hi, {userName.split(" ")[0]}
              </span>
              <span style={{ fontSize: "0.6875rem", fontWeight: 700, opacity: 0.75, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Withdrawable Cash
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", marginTop: "1rem" }}>
              <p style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.02em", color: "inherit", margin: 0, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                {hidden ? "₦ ••••••" : fmt(balances.withdrawable)}
              </p>
            </div>
          </div>
        </div>

        {/* Slide 3: Locked Funds Card */}
        <div
          className="viewpager-slide wallet-slide-locked"
          style={{
            padding: "1.25rem",
            position: "relative",
            minHeight: "115px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderRadius: "20px",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, opacity: 0.9 }}>
                Hi, {userName.split(" ")[0]}
              </span>
              <span style={{ fontSize: "0.6875rem", fontWeight: 700, opacity: 0.75, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Locked Funds
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", marginTop: "1rem" }}>
              <p style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.02em", color: "inherit", margin: 0, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                {hidden ? "₦ ••••••" : fmt(lockedBalance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Pagination Dots ────────────────────────────────────────────── */}
      <div className="dots-container" style={{ marginBottom: "1.25rem" }}>
        {[0, 1, 2].map((idx) => (
          <div
            key={idx}
            className={`dot${activeSlide === idx ? " active" : ""}`}
          />
        ))}
      </div>

      {/* ─── Contextual Action Buttons ──────────────────────────────────── */}
      <div style={{ minHeight: "44px" }}>
        {(activeSlide === 0 || activeSlide === 1) && (
          <div style={{ display: "flex", gap: "0.75rem" }} className="animate-fade-in">
            <button
              className="btn btn-wallet-action"
              style={{
                flex: 1,
                fontSize: "0.875rem",
                height: "44px",
                borderRadius: "22px",
              }}
              onClick={() => toast.info("Transfers feature coming soon")}
            >
              <ArrowCircleUp size={18} weight="fill" />
              Transfer
            </button>
            <button
              className="btn btn-wallet-action"
              style={{
                flex: 1,
                fontSize: "0.875rem",
                height: "44px",
                borderRadius: "22px",
              }}
              onClick={() => router.push("/history")}
            >
              <ClockCounterClockwise size={18} weight="fill" />
              History
            </button>
          </div>
        )}

        {activeSlide === 2 && (
          <div className="animate-fade-in" style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", textAlign: "center", padding: "10px 1rem", border: "1.5px solid var(--border)", borderRadius: "14px", background: "var(--bg-surface)", opacity: 0.85 }}>
            Locked funds are managed by the system for pending transactions and admin holds.
          </div>
        )}
      </div>
    </div>
  );
}


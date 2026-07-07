"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Smartphone, World, CloudLightning, Airplay, Book, CoinStack, Certificate } from "@duo-icons/react";
import WalletCard from "@/components/WalletCard";
import { HistoryList } from "@/components/HistoryList";
import { SkeletonWallet, SkeletonList, SkeletonServices } from "@/components/SkeletonLoader";
import Header from "@/components/Header";
import PromoBanner from "@/components/PromoBanner";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

const SERVICES = [
  { label: "Airtime",     Icon: Smartphone,     href: "/services/airtime",      color: "#EF4444" },
  { label: "Data",        Icon: World,          href: "/services/data",         color: "#7C3AED" },
  { label: "Electricity", Icon: CloudLightning, href: "/services/electricity",  color: "#F59E0B" },
  { label: "Cable TV",    Icon: Airplay,        href: "/services/cable",        color: "#10B981" },
  { label: "Education",   Icon: Book,           href: "/services/education",    color: "#3B82F6" },
  { label: "Betting",     Icon: CoinStack,      href: "/services/betting",      color: "#06B6D4" },
  { label: "Exam PIN",    Icon: Certificate,    href: "/services/exam",         color: "#F97316" },
] as const;

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("Restoring...");

  // Dashboard state variables
  const [wallet, setWallet] = useState<{ id: string; balance_total: number; balance_withdrawable: number } | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [fullName, setFullName] = useState("User");

  useEffect(() => {
    // 1. Instantly load values from cache to present dashboard immediately
    const cachedWallet = localStorage.getItem("vtu_wallet_cache");
    const cachedTransactions = localStorage.getItem("vtu_transactions_cache");
    const cachedProfile = localStorage.getItem("vtu_profile_cache");

    if (cachedWallet) setWallet(JSON.parse(cachedWallet));
    if (cachedTransactions) setTransactions(JSON.parse(cachedTransactions));
    if (cachedProfile) setFullName(JSON.parse(cachedProfile).fullName);

    // If cache is ready, we turn off the loader skeleton instantly
    if (cachedWallet && cachedTransactions) {
      setLoading(false);
    }

    // 2. Perform background sync in the background
    async function performBackgroundSync() {
      setSyncing(true);
      setSyncMessage("Syncing...");
      try {
        const { data: sessionData } = await supabaseBrowser.auth.getSession();
        const user = sessionData?.session?.user;
        if (!user) {
          router.replace("/login");
          return;
        }

        const name = (user.user_metadata?.full_name as string) ?? user.email ?? "User";
        setFullName(name);
        localStorage.setItem("vtu_profile_cache", JSON.stringify({ fullName: name }));

        // Get wallet
        const { data: walletData, error: walletErr } = await (supabaseBrowser
          .from("wallets")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle() as any);

        if (walletErr) throw walletErr;
        if (walletData) {
          const wObj = {
            id: walletData.id,
            balance_total: Number(walletData.balance_total),
            balance_withdrawable: Number(walletData.balance_withdrawable),
          };
          setWallet(wObj);
          localStorage.setItem("vtu_wallet_cache", JSON.stringify(wObj));

          // Get transactions
          const { data: txnsData, error: txnsErr } = await (supabaseBrowser
            .from("transactions")
            .select("*")
            .eq("wallet_id", walletData.id)
            .order("created_at", { ascending: false })
            .limit(2) as any);

          if (txnsErr) throw txnsErr;
          if (txnsData) {
            setTransactions(txnsData);
            localStorage.setItem("vtu_transactions_cache", JSON.stringify(txnsData));
          }

          // Pre-create virtual account in background if not exists
          fetch("/api/wallets/virtual-account", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${sessionData?.session?.access_token}`,
            }
          }).catch(e => console.warn("Background virtual account creation failed:", e));
        }

        setSyncMessage("Synced");
        setTimeout(() => setSyncing(false), 2000);
      } catch (err) {
        console.error("SWR Sync failed:", err);
        setSyncMessage("Sync failed");
        setTimeout(() => setSyncing(false), 3000);
      } finally {
        setLoading(false);
      }
    }

    performBackgroundSync();

    // Subscribe to Postgres changes on the wallets table in real-time
    let isMounted = true;
    let subChannel: any = null;
    async function setupRealtime() {
      const { data } = await supabaseBrowser.auth.getSession();
      const user = data.session?.user;
      if (!user || !isMounted) return;

      subChannel = supabaseBrowser
        .channel(`wallet-realtime-home-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "wallets",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newW = payload.new as any;
            const wObj = {
              id: newW.id,
              balance_total: Number(newW.balance_total),
              balance_withdrawable: Number(newW.balance_withdrawable),
            };
            setWallet(wObj);
            localStorage.setItem("vtu_wallet_cache", JSON.stringify(wObj));
          }
        )
        .subscribe();
    }
    setupRealtime();

    return () => {
      isMounted = false;
      if (subChannel) supabaseBrowser.removeChannel(subChannel);
    };
  }, [router]);

  if (loading) {
    return (
      <div className="page">
        <SkeletonWallet />
        <SkeletonServices />
        <SkeletonList />
      </div>
    );
  }

  return (
    <div className="page" style={{ position: "relative" }}>
      {/* Premium Floating Sync Status Pill */}
      {syncing && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "0.3rem 0.8rem",
          backgroundColor: "var(--bg-elevated)",
          borderRadius: "99px",
          fontSize: "0.6875rem",
          fontWeight: 700,
          color: "var(--text-secondary)",
          position: "fixed",
          top: "12px",
          right: "12px",
          zIndex: 101,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          border: "1.5px solid var(--border)",
          pointerEvents: "none"
        }}>
          <div
            className="pulse-dot"
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: syncMessage === "Synced" ? "var(--color-success)" : syncMessage === "Sync failed" ? "var(--color-danger)" : "var(--color-warning)"
            }}
          />
          {syncMessage}
        </div>
      )}

      {/* Top Header */}
      <Header type="dashboard" userName={fullName} />

      {/* Wallet Card */}
      {wallet && (
        <WalletCard
          walletId={wallet.id}
          balanceTotal={wallet.balance_total}
          balanceWithdrawable={wallet.balance_withdrawable}
          userName={fullName}
        />
      )}

      {/* Recent Transactions (Brought up under balance card) */}
      <section style={{ marginBottom: "1.25rem" }}>
        <div className="card" style={{ padding: "0.75rem 1rem" }}>
          {wallet && <HistoryList transactions={transactions} walletId={wallet.id} />}
          {transactions.length > 0 && (
            <div style={{ display: "flex", justifyContent: "center", borderTop: "1.5px solid var(--border)", paddingTop: "0.75rem", marginTop: "0.5rem" }}>
              <Link
                href="/history"
                style={{ fontSize: "0.78rem", color: "var(--color-primary)", fontWeight: 700, textDecoration: "none" }}
              >
                See all history →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Quick Services */}
      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Quick Services
        </h2>
        <div className="card" style={{ padding: "1.25rem 1rem" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "1.25rem 1rem",
            }}
          >
            {SERVICES.map(({ label, Icon, href, color }) => (
              <Link
                key={href}
                href={href}
                style={{ textDecoration: "none" }}
                className="service-shortcut"
              >
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 16,
                    backgroundColor: "var(--bg-elevated)",
                    boxShadow: `0 6px 18px -4px color-mix(in srgb, ${color} 35%, transparent)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "0.4rem",
                    color: color,
                    transition: "all var(--duration-fast) var(--ease-smooth)",
                  }}
                  className="shortcut-icon-wrapper"
                >
                  <Icon size={20} />
                </div>
                <span
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    textAlign: "center",
                    display: "block",
                    transition: "color var(--duration-fast) var(--ease-smooth)",
                  }}
                  className="shortcut-label"
                >
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Promo Wealth Banner */}
      <PromoBanner />

      <style>{`
        .service-shortcut {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .service-shortcut:hover .shortcut-icon-wrapper {
          transform: translateY(-2px);
          filter: brightness(1.05);
          box-shadow: 0 8px 16px -4px currentColor;
        }
        .service-shortcut:active .shortcut-icon-wrapper {
          transform: scale(0.95);
          filter: brightness(1.15);
        }
        .service-shortcut:hover .shortcut-label {
          color: var(--text-primary);
        }
        @keyframes pulse {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
        .pulse-dot {
          animation: pulse 1.2s infinite ease-in-out;
        }
      `}</style>

    </div>
  );
}

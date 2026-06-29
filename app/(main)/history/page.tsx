"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import HistoryClient from "@/components/HistoryClient";
import { SkeletonList } from "@/components/SkeletonLoader";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function HistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("Restoring...");

  const [transactions, setTransactions] = useState<any[]>([]);
  const [walletId, setWalletId] = useState("");

  useEffect(() => {
    // 1. Restore from cache immediately
    const cachedTxns = localStorage.getItem("vtu_history_cache");
    const cachedWallet = localStorage.getItem("vtu_wallet_cache");

    if (cachedTxns) setTransactions(JSON.parse(cachedTxns));
    if (cachedWallet) setWalletId(JSON.parse(cachedWallet).id);

    if (cachedTxns && cachedWallet) {
      setLoading(false);
    }

    // 2. Sync from database
    async function syncTransactions() {
      setSyncing(true);
      setSyncMessage("Syncing...");
      try {
        const { data: sessionData } = await supabaseBrowser.auth.getSession();
        const user = sessionData?.session?.user;
        if (!user) {
          router.replace("/login");
          return;
        }

        // Get wallet
        const { data: wallet, error: wErr } = await (supabaseBrowser
          .from("wallets")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle() as any);

        if (wErr) throw wErr;
        if (wallet) {
          setWalletId(wallet.id);

          // Get transactions
          const { data: txns, error: txnsErr } = await (supabaseBrowser
            .from("transactions")
            .select("*")
            .eq("wallet_id", wallet.id)
            .order("created_at", { ascending: false })
            .limit(100) as any);

          if (txnsErr) throw txnsErr;
          if (txns) {
            setTransactions(txns);
            localStorage.setItem("vtu_history_cache", JSON.stringify(txns));
            
            // Also update home cache to align transaction records
            localStorage.setItem("vtu_transactions_cache", JSON.stringify(txns.slice(0, 2)));
          }
        }

        setSyncMessage("Synced");
        setTimeout(() => setSyncing(false), 2000);
      } catch (err) {
        console.error("History sync failed:", err);
        setSyncMessage("Sync failed");
        setTimeout(() => setSyncing(false), 3000);
      } finally {
        setLoading(false);
      }
    }

    syncTransactions();
  }, [router]);

  if (loading) {
    return (
      <div className="page">
        <SkeletonList rows={8} />
      </div>
    );
  }

  return (
    <div className="page" style={{ position: "relative" }}>
      {/* Floating Sync status badge */}
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

      <HistoryClient initialTransactions={transactions} totalCount={transactions.length} walletId={walletId} />

      <style>{`
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

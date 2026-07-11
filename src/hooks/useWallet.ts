"use client";
import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

interface WalletState {
  wId: string | null;
  withdrawable: number;
  totalBalance: number;
}

export function useWallet(userId?: string) {
  const [wallet, setWallet] = useState<WalletState>({ wId: null, withdrawable: 0, totalBalance: 0 });

  useEffect(() => {
    let cancelled = false;
    let sub: any = null;

    async function start() {
      let uid = userId;
      if (!uid) {
        const { data } = await supabaseBrowser.auth.getSession();
        uid = data.session?.user?.id;
      }
      if (!uid) return;

      const cached = localStorage.getItem("vtu_wallet_cache");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (!cancelled) {
            setWallet({
              wId: parsed.id ?? parsed.wId ?? null,
              withdrawable: Number(parsed.balance_withdrawable ?? parsed.withdrawable ?? 0),
              totalBalance: Number(parsed.balance_total ?? parsed.totalBalance ?? 0),
            });
          }
        } catch {}
      }

      const { data } = await (supabaseBrowser
        .from("wallets")
        .select("id, balance_withdrawable, balance_total")
        .eq("user_id", uid)
        .maybeSingle() as any);

      if (data && !cancelled) {
        const w: WalletState = {
          wId: data.id,
          withdrawable: Number(data.balance_withdrawable),
          totalBalance: Number(data.balance_total),
        };
        setWallet(w);
        localStorage.setItem("vtu_wallet_cache", JSON.stringify(w));
      }

      if (cancelled) return;

      sub = supabaseBrowser
        .channel("wallet-sync")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "wallets", filter: `user_id=eq.${uid}` },
          async () => {
            const { data: fresh } = await (supabaseBrowser
              .from("wallets")
              .select("id, balance_withdrawable, balance_total")
              .eq("user_id", uid)
              .maybeSingle() as any);
            if (fresh && !cancelled) {
              const w: WalletState = {
                wId: fresh.id,
                withdrawable: Number(fresh.balance_withdrawable),
                totalBalance: Number(fresh.balance_total),
              };
              setWallet(w);
              localStorage.setItem("vtu_wallet_cache", JSON.stringify(w));
            }
          }
        )
        .subscribe();
    }

    start();

    return () => {
      cancelled = true;
      if (sub) supabaseBrowser.removeChannel(sub);
    };
  }, [userId]);

  return wallet;
}

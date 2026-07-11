"use client";

import { GameController } from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import Header from "@/components/Header";

export default function BettingPage() {
  const router = useRouter();

  const handleSubmit = () => {
    toast.success("Betting funding coming soon!");
  };

  return (
    <div className="page">
      <Header title="Betting" showBack />
      <div style={{ marginTop: "1rem" }}>
        <div className="card" style={{ padding: "1.5rem", textAlign: "center", marginBottom: "1.5rem" }}>
          <GameController size={32} weight="duotone" color="var(--color-accent)" />
          <h3 style={{ marginTop: "0.75rem" }}>Fund Your Betting Account</h3>
          <p style={{ fontSize: "0.8125rem", marginTop: "0.25rem" }}>
            Deposit to Bet9ja, SportyBet, 1xBet, and more.
          </p>
        </div>
        <button className="btn btn-primary btn-full" onClick={handleSubmit} style={{ height: 48 }}>
          Fund Account
        </button>
      </div>
    </div>
  );
}

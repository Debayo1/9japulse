"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Header from "./Header";
import Image from "next/image";
import { DeviceMobile } from "@phosphor-icons/react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

interface AirtimeFormProps {
  walletId: string;
  initialWithdrawable: number;
}

const NETWORKS = [
  { id: "mtn", label: "MTN", color: "#FFCC00", textColor: "#000000" },
  { id: "airtel", label: "Airtel", color: "#E30A17", textColor: "#FFFFFF" },
  { id: "glo", label: "Glo", color: "#4E9C23", textColor: "#FFFFFF" },
  { id: "9mobile", label: "9mobile", color: "#005F53", textColor: "#FFFFFF" },
];

const PRESETS = [100, 200, 500, 1000, 2000, 5000];

export default function AirtimeForm({ walletId, initialWithdrawable }: AirtimeFormProps) {
  const router = useRouter();
  const [network, setNetwork] = useState("mtn");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only numeric inputs
    setPhone(e.target.value.replace(/[^0-9]/g, ""));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value.replace(/[^0-9]/g, ""));
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPin(e.target.value.slice(0, 4).replace(/[^0-9]/g, ""));
  };

  const initiatePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 11) {
      toast.error("Please enter a valid 11-digit phone number");
      return;
    }
    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum < 50) {
      toast.error("Minimum purchase amount is ₦50");
      return;
    }
    if (amtNum > initialWithdrawable) {
      toast.error("Insufficient withdrawable balance");
      return;
    }
    setPin("");
    setShowConfirm(true);
  };

  const executePurchase = () => {
    if (pin.length < 4) {
      toast.error("Please enter your 4-digit security PIN");
      return;
    }

    startTransition(async () => {
      try {
        // Get the current session token to authenticate the API request
        const { data: sessionData } = await supabaseBrowser.auth.getSession();
        const accessToken = sessionData?.session?.access_token;
        if (!accessToken) {
          toast.error("Session expired. Please log in again.");
          return;
        }

        const res = await fetch("/api/purchases/airtime", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            walletId,
            network,
            phone,
            amount: parseFloat(amount),
            pin,
          }),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Purchase failed");

        toast.success(`₦${amount} Airtime sent successfully to ${phone}!`);
        setShowConfirm(false);
        setPhone("");
        setAmount("");
        setPin("");
        
        router.push(`/services/success?type=airtime&amount=${amount}&phone=${phone}&network=${network}&ref=${json.reference || ""}`);
      } catch (err: unknown) {
        toast.error((err as Error).message ?? "Purchase failed");
      }
    });
  };

  return (
    <div className="page" style={{ paddingBottom: "1.5rem" }}>
      <Header title="Buy Airtime" />

      {/* ─── Balance Banner ─────────────────────────────────────────────── */}
      <div
        className="glass-sm"
        style={{
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          border: "1.5px solid var(--border)",
        }}
      >
        <div>
          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 500 }}>
            Available Cash
          </p>
          <p style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--color-success)" }}>
            ₦{initialWithdrawable.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <DeviceMobile size={28} weight="duotone" style={{ color: "var(--color-primary)", opacity: 0.8 }} />
      </div>

      {/* ─── Airtime Purchase Form ──────────────────────────────────────── */}
      <form onSubmit={initiatePurchase} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Network Selector */}
        <div>
          <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.625rem" }}>
            Select Network Provider
          </span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.625rem" }}>
            {NETWORKS.map((net) => {
              const active = network === net.id;
              return (
                <button
                  key={net.id}
                  type="button"
                  onClick={() => setNetwork(net.id)}
                  style={{
                    backgroundColor: active ? "var(--bg-elevated)" : "var(--bg-surface)",
                    color: "var(--text-primary)",
                    border: active ? `2px solid var(--color-primary)` : "1.5px solid var(--border)",
                    height: "72px",
                    borderRadius: "16px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    cursor: "pointer",
                    transition: "all var(--duration-fast) var(--ease-smooth)",
                    boxShadow: active ? `0 6px 16px rgba(0, 0, 0, 0.04)` : "none",
                  }}
                  className="squishy"
                >
                  <Image
                    src={`/networks/${net.id}.png`}
                    alt={net.label}
                    width={28}
                    height={28}
                    style={{ borderRadius: "50%", objectFit: "cover" }}
                  />
                  <span style={{ fontSize: "0.6875rem", fontWeight: 700 }}>
                    {net.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Phone Number Input */}
        <div>
          <label
            htmlFor="airtime-phone"
            style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.5rem" }}
          >
            Phone Number
          </label>
          <div className="input-wrapper">
            <input
              id="airtime-phone"
              type="tel"
              placeholder="e.g. 09070578999"
              value={phone}
              onChange={handlePhoneChange}
              maxLength={11}
              required
              className="input"
            />
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label
            htmlFor="airtime-amount"
            style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.5rem" }}
          >
            Amount (₦)
          </label>
          <div className="input-wrapper" style={{ marginBottom: "0.75rem" }}>
            <input
              id="airtime-amount"
              type="tel"
              placeholder="Min ₦50 - Max ₦50,000"
              value={amount}
              onChange={handleAmountChange}
              required
              className="input"
            />
          </div>

          {/* Preset Buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "0.375rem" }}>
            {PRESETS.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setAmount(val.toString())}
                style={{
                  backgroundColor: amount === val.toString() ? "var(--color-primary)" : "var(--bg-elevated)",
                  color: amount === val.toString() ? "#ffffff" : "var(--text-secondary)",
                  border: "1.5px solid var(--border)",
                  borderRadius: "10px",
                  padding: "6px 2px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ₦{val}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="btn btn-primary btn-full"
          style={{ marginTop: "1rem", height: "48px" }}
        >
          Proceed to Confirm
        </button>
      </form>

      {/* ─── Transaction Confirmation Modal Sheet ───────────────────────── */}
      {showConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            zIndex: 100,
          }}
          onClick={() => !isPending && setShowConfirm(false)}
        >
          <div
            className="glass animate-slide-up"
            style={{
              width: "100%",
              maxWidth: "480px",
              backgroundColor: "var(--bg-elevated)",
              borderTopLeftRadius: "28px",
              borderTopRightRadius: "28px",
              border: "1.5px solid var(--border)",
              borderBottom: "none",
              padding: "1.75rem 1.5rem",
              boxShadow: "0 -8px 32px rgba(0,0,0,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "1.5rem" }}>
              <div
                style={{
                  width: "48px",
                  height: "4px",
                  backgroundColor: "var(--text-muted)",
                  borderRadius: "2px",
                  opacity: 0.3,
                  marginBottom: "1rem",
                }}
              />
              <h2 style={{ fontSize: "1.125rem", fontWeight: 800 }}>Confirm Transaction</h2>
            </div>

            {/* Details Panel */}
            <div
              className="glass-sm"
              style={{
                padding: "1rem",
                border: "1.5px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                marginBottom: "1.5rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Service</span>
                <span style={{ fontSize: "0.8125rem", fontWeight: 700 }}>Airtime Purchase</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Provider</span>
                <span style={{ fontSize: "0.8125rem", fontWeight: 700, textTransform: "uppercase" }}>{network}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Recipient</span>
                <span style={{ fontSize: "0.8125rem", fontWeight: 700 }}>{phone}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1.5px solid var(--border)", paddingTop: "0.75rem" }}>
                <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", fontWeight: 600 }}>Amount Due</span>
                <span style={{ fontSize: "0.9375rem", fontWeight: 900, color: "var(--color-primary)" }}>₦{parseFloat(amount).toLocaleString()}</span>
              </div>
            </div>

            {/* Security PIN Field */}
            <div style={{ marginBottom: "1.75rem" }}>
              <label
                htmlFor="airtime-pin"
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  display: "block",
                  textAlign: "center",
                  marginBottom: "0.625rem",
                }}
              >
                Enter 4-Digit Transaction PIN
              </label>
              <input
                id="airtime-pin"
                type="password"
                placeholder="••••"
                value={pin}
                onChange={handlePinChange}
                maxLength={4}
                style={{
                  textAlign: "center",
                  fontSize: "1.5rem",
                  letterSpacing: "1em",
                  paddingLeft: "1em",
                  height: "50px",
                }}
                className="input"
                autoComplete="off"
                disabled={isPending}
              />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, height: "48px" }}
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 2, height: "48px" }}
                onClick={executePurchase}
                disabled={isPending || pin.length < 4}
              >
                {isPending ? "Sending..." : "Confirm & Pay"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

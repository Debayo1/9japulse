"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Header from "./Header";
import Image from "next/image";
import { DeviceMobile, Backspace, Warning } from "@phosphor-icons/react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { detectNetworkPrefix } from "@/lib/network";

interface AirtimeFormProps {
  walletId?: string;
  initialWithdrawable?: number;
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
  const [showPinPad, setShowPinPad] = useState(false);
  const [mismatchWarning, setMismatchWarning] = useState<{ expected: string; detected: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Balance cache state & Realtime updates
  const [wId, setWId] = useState(walletId || "");
  const [withdrawable, setWithdrawable] = useState(initialWithdrawable ?? 0);

  useEffect(() => {
    // Restores cache instantly
    const cached = localStorage.getItem("vtu_wallet_cache");
    if (cached) {
      const wObj = JSON.parse(cached);
      if (!wId) setWId(wObj.id);
      if (initialWithdrawable === undefined) setWithdrawable(wObj.balance_withdrawable);
    }

    async function syncBalance() {
      try {
        const { data: session } = await supabaseBrowser.auth.getSession();
        const user = session?.session?.user;
        if (!user) return;
        const { data: wallet } = await (supabaseBrowser
          .from("wallets")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle() as any);
        if (wallet) {
          const wObj = {
            id: wallet.id,
            balance_total: Number(wallet.balance_total),
            balance_withdrawable: Number(wallet.balance_withdrawable)
          };
          setWId(wObj.id);
          setWithdrawable(wObj.balance_withdrawable);
          localStorage.setItem("vtu_wallet_cache", JSON.stringify(wObj));
        }
      } catch (err) {
        console.error("Failed to sync wallet in AirtimeForm:", err);
      }
    }
    syncBalance();

    // Subscribe to Postgres balance changes for real-time DB changes
    let isMounted = true;
    let sub: any = null;
    async function setupRealtime() {
      const { data } = await supabaseBrowser.auth.getSession();
      const user = data.session?.user;
      if (!user || !isMounted) return;

      sub = supabaseBrowser
        .channel(`wallet-realtime-airtime-${user.id}`)
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
            setWithdrawable(Number(newW.balance_withdrawable));
            const wObj = {
              id: newW.id,
              balance_total: Number(newW.balance_total),
              balance_withdrawable: Number(newW.balance_withdrawable)
            };
            localStorage.setItem("vtu_wallet_cache", JSON.stringify(wObj));
          }
        )
        .subscribe();
    }
    setupRealtime();

    return () => {
      isMounted = false;
      if (sub) supabaseBrowser.removeChannel(sub);
    };
  }, [wId, initialWithdrawable]);

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

  const proceedToConfirmation = (targetNetwork: string) => {
    setPin("");
    setShowConfirm(true);
  };

  const initiatePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 11) {
      toast.error("Please enter a valid 11-digit phone number");
      return;
    }
    const amtNum = parseFloat(amount);
    const minAmount = network === "mtn" ? 100 : 50;
    if (isNaN(amtNum) || amtNum < minAmount) {
      toast.error(`Minimum purchase amount for MTN is ₦100, and ₦50 for other networks`);
      return;
    }
    if (amtNum > withdrawable) {
      toast.error("Insufficient withdrawable balance");
      return;
    }

    // Network prefix check
    const detected = detectNetworkPrefix(phone);
    if (detected && detected !== network) {
      setMismatchWarning({ expected: network, detected });
      return;
    }

    proceedToConfirmation(network);
  };

  const triggerExecutePurchase = (targetPin: string) => {
    startTransition(async () => {
      try {
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
            walletId: wId,
            network,
            phone,
            amount: parseFloat(amount),
            pin: targetPin,
          }),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Purchase failed");

        toast.success(`₦${amount} Airtime sent successfully to ${phone}!`);
        setShowPinPad(false);
        setShowConfirm(false);
        setPhone("");
        setAmount("");
        setPin("");
        
        router.push(`/services/success?type=airtime&amount=${amount}&phone=${phone}&network=${network}&ref=${json.reference || ""}`);
      } catch (err: unknown) {
        toast.error((err as Error).message ?? "Purchase failed");
        setPin("");
      }
    });
  };

  return (
    <div className="page" style={{ paddingBottom: "1.5rem" }}>
      <Header title="Buy Airtime" />

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
                    border: "none",
                    height: "72px",
                    borderRadius: "16px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    cursor: "pointer",
                    transition: "all var(--duration-fast) var(--ease-smooth)",
                    boxShadow: active ? `0 8px 20px -4px color-mix(in srgb, ${net.color} 40%, transparent)` : "none",
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5rem" }}>
            <label
              htmlFor="airtime-amount"
              style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)" }}
            >
              Amount (₦)
            </label>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>
              Balance: ₦{withdrawable.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="input-wrapper" style={{ marginBottom: "0.75rem" }}>
            <input
              id="airtime-amount"
              type="tel"
              placeholder={network === "mtn" ? "Min ₦100 - Max ₦50,000" : "Min ₦50 - Max ₦50,000"}
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
                onClick={() => setShowPinPad(true)}
                disabled={isPending}
              >
                Confirm & Pay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Dedicated Transaction PIN Keypad Overlay ─── */}
      {showPinPad && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "var(--bg-base)",
          zIndex: 110,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem"
        }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-secondary)" }}>
              SECURITY VERIFICATION
            </span>
            <h2 style={{ fontSize: "1.375rem", fontWeight: 800, margin: "0.25rem 0 0.5rem 0" }}>Enter Transaction PIN</h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", margin: 0 }}>
              Paying <strong style={{ color: "var(--text-primary)" }}>₦{parseFloat(amount).toLocaleString()}</strong> to {phone}
            </p>
          </div>

          {/* Dots */}
          <div style={{ display: "flex", gap: "1rem", marginBottom: "3rem" }}>
            {[0, 1, 2, 3].map(idx => (
              <div
                key={idx}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  border: "2px solid var(--border)",
                  backgroundColor: pin.length > idx ? "var(--color-primary)" : "transparent",
                  transform: pin.length > idx ? "scale(1.15)" : "scale(1)",
                  transition: "all var(--duration-fast) var(--ease-smooth)",
                  boxShadow: pin.length > idx ? "0 0 8px var(--color-primary)" : "none"
                }}
              />
            ))}
          </div>

          {/* Keypad */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1.25rem 1.5rem",
            maxWidth: 260,
            width: "100%",
            marginBottom: "2rem"
          }}>
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => {
                  if (pin.length < 4) {
                    const newPin = pin + num;
                    setPin(newPin);
                    if (newPin.length === 4) {
                      triggerExecutePurchase(newPin);
                    }
                  }
                }}
                className="squishy"
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  border: "1.5px solid var(--border)",
                  background: "var(--bg-elevated)",
                  color: "var(--text-primary)",
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                disabled={isPending}
              >
                {num}
              </button>
            ))}

            <button
              type="button"
              onClick={() => {
                setPin("");
                setShowPinPad(false);
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-secondary)",
                fontSize: "0.8125rem",
                fontWeight: 700,
                cursor: "pointer"
              }}
              disabled={isPending}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => {
                if (pin.length < 4) {
                  const newPin = pin + "0";
                  setPin(newPin);
                  if (newPin.length === 4) {
                    triggerExecutePurchase(newPin);
                  }
                }
              }}
              className="squishy"
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                border: "1.5px solid var(--border)",
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
                fontSize: "1.25rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              disabled={isPending}
            >
              0
            </button>

            <button
              type="button"
              onClick={() => setPin(prev => prev.slice(0, -1))}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer"
              }}
              disabled={isPending}
            >
              <Backspace size={22} weight="duotone" />
            </button>
          </div>
          
          {isPending && (
            <div style={{ color: "var(--text-secondary)", fontSize: "0.8125rem", display: "flex", alignItems: "center", gap: "6px" }}>
              <div className="spinner" style={{ width: "16px", height: "16px" }} />
              Verifying PIN & Processing...
            </div>
          )}
        </div>
      )}

      {/* ─── Network Mismatch Warning Modal ─────────────────────────── */}
      {mismatchWarning && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 110,
            padding: "1.5rem"
          }}
          onClick={() => setMismatchWarning(null)}
        >
          <div
            className="glass animate-scale-up"
            style={{
              width: "100%",
              maxWidth: "400px",
              backgroundColor: "var(--bg-elevated)",
              borderRadius: "24px",
              border: "1.5px solid var(--border)",
              padding: "1.75rem",
              boxShadow: "var(--shadow-lg)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--color-warning)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <Warning size={20} weight="duotone" /> Network Mismatch
            </h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 1.5rem 0" }}>
              The phone number you entered appears to belong to <strong>{mismatchWarning.detected.toUpperCase()}</strong>, but you have selected <strong>{mismatchWarning.expected.toUpperCase()}</strong>.
              <br /><br />
              Are you sure you want to proceed with <strong>{mismatchWarning.expected.toUpperCase()}</strong>?
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={() => setMismatchWarning(null)}
                className="btn btn-secondary"
                style={{ flex: 1, height: "42px", fontSize: "0.875rem" }}
              >
                No, Close
              </button>
              <button
                onClick={() => {
                  const targetNetwork = mismatchWarning.expected;
                  setMismatchWarning(null);
                  proceedToConfirmation(targetNetwork);
                }}
                className="btn btn-primary"
                style={{ flex: 1, height: "42px", fontSize: "0.875rem", backgroundColor: "var(--color-warning)", borderColor: "var(--color-warning)" }}
              >
                Yes, Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

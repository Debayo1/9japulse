"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Header from "./Header";
import NetworkSelector from "./NetworkSelector";
import PinKeypad from "./PinKeypad";
import ConfirmationModal from "./ConfirmationModal";
import { Warning } from "@phosphor-icons/react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { detectNetworkPrefix } from "@/lib/network";
import { useWallet } from "@/hooks/useWallet";

interface AirtimeFormProps {
  walletId?: string;
  initialWithdrawable?: number;
}

const PRESETS = [100, 200, 500, 1000, 2000, 5000];

export default function AirtimeForm({ walletId, initialWithdrawable }: AirtimeFormProps) {
  const router = useRouter();
  const [network, setNetwork] = useState("mtn");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPinPad, setShowPinPad] = useState(false);
  const [mismatchWarning, setMismatchWarning] = useState<{ expected: string; detected: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const { wId, withdrawable } = useWallet();

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only numeric inputs
    setPhone(e.target.value.replace(/[^0-9]/g, ""));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value.replace(/[^0-9]/g, ""));
  };

  const proceedToConfirmation = (targetNetwork: string) => {
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
        
        router.push(`/services/success?type=airtime&amount=${amount}&phone=${phone}&network=${network}&ref=${json.reference || ""}`);
      } catch (err: unknown) {
        toast.error((err as Error).message ?? "Purchase failed");
      }
    });
  };

  return (
    <div className="page" style={{ paddingBottom: "1.5rem" }}>
      <Header title="Buy Airtime" />

      {/* â”€â”€â”€ Airtime Purchase Form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <form onSubmit={initiatePurchase} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Network Selector */}
        <div>
          <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.625rem" }}>
            Select Network Provider
          </span>
          <NetworkSelector selected={network} onChange={setNetwork} />
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
                aria-label={`₦${val}`}
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

      <ConfirmationModal
        show={showConfirm}
        total={parseFloat(amount).toLocaleString()}
        loading={isPending}
        onConfirm={() => setShowPinPad(true)}
        onClose={() => setShowConfirm(false)}
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
      </ConfirmationModal>

      <PinKeypad
        show={showPinPad}
        onPinComplete={triggerExecutePurchase}
        onClose={() => setShowPinPad(false)}
        loading={isPending}
      >
        Paying <strong style={{ color: "var(--text-primary)" }}>₦{parseFloat(amount).toLocaleString()}</strong> to {phone}
      </PinKeypad>

      {/* â”€â”€â”€ Network Mismatch Warning Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

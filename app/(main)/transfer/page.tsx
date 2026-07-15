"use client";

import { useState, useTransition } from "react";
import Header from "@/components/Header";
import PinKeypad from "@/components/PinKeypad";
import ConfirmationModal from "@/components/ConfirmationModal";
import { SkeletonList } from "@/components/SkeletonLoader";
import { toast } from "sonner";
import { lookupUser, transferFunds } from "@/lib/transfers";
import { User, CheckCircle } from "@phosphor-icons/react";

export default function TransferPage() {
  const [username, setUsername] = useState("");
  const [recipient, setRecipient] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPinPad, setShowPinPad] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleLookup = () => {
    if (!username.trim()) return toast.error("Enter a username");
    startTransition(async () => {
      try {
        const data = await lookupUser(username.trim());
        setRecipient(data);
        setStep(2);
      } catch (e: any) {
        toast.error(e.message);
      }
    });
  };

  const handleConfirm = () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 100) return toast.error("Minimum transfer is ₦100");
    setShowConfirm(false);
    setShowPinPad(true);
  };

  const handlePinComplete = (pin: string) => {
    startTransition(async () => {
      try {
        await transferFunds(recipient.username, parseFloat(amount), pin);
        setShowPinPad(false);
        setSuccess(true);
        toast.success("Transfer successful!");
      } catch (e: any) {
        toast.error(e.message);
      }
    });
  };

  if (success) {
    return (
      <div className="page">
        <div className="animate-fade-in" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1.5rem", textAlign: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "color-mix(in srgb, var(--color-success) 12%, transparent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle size={36} weight="fill" style={{ color: "var(--color-success)" }} />
          </div>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "0.25rem" }}>Transfer Complete</h2>
            <p style={{ fontSize: "0.875rem" }}>₦{parseFloat(amount).toLocaleString()} sent to @{recipient?.username}</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setSuccess(false); setStep(1); setUsername(""); setAmount(""); setRecipient(null); }}>
            Send Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <Header title="Transfer Funds" />

      {isPending && step !== 3 && <SkeletonList rows={3} />}

      {!isPending && (
        <>
          {/* Step 1: Lookup */}
          {step === 1 && (
            <section className="card animate-fade-in" style={{ marginBottom: "1rem" }}>
              <label className="input-label">Recipient&apos;s Username</label>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <input
                  className="input"
                  placeholder="@username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                />
                <button className="btn btn-primary" onClick={handleLookup} disabled={!username.trim()}>
                  <User size={16} />
                  Find
                </button>
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
                Enter the recipient&apos;s unique 9jaPulse username
              </p>
            </section>
          )}

          {/* Step 2: Amount */}
          {step === 2 && recipient && (
            <section className="animate-fade-in">
              <div className="glass-sm" style={{ padding: "1rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "color-mix(in srgb, var(--color-primary) 12%, transparent)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)", fontWeight: 700, fontSize: "1rem" }}>
                  {recipient.full_name?.charAt(0) ?? "?"}
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.9375rem", margin: 0 }}>{recipient.full_name ?? "User"}</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0 }}>@{recipient.username}</p>
                </div>
              </div>

              <div className="card" style={{ marginBottom: "1rem" }}>
                <label className="input-label">Amount (₦)</label>
                <input
                  className="input"
                  type="number"
                  placeholder="100"
                  min={100}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
                />
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.375rem", margin: 0 }}>
                  No fee on 9jaPulse transfers
                </p>
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setStep(1); setRecipient(null); }}>
                  Back
                </button>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => {
                  const amt = parseFloat(amount);
                  if (isNaN(amt) || amt < 100) return toast.error("Minimum transfer is ₦100");
                  setShowConfirm(true);
                }}>
                  Continue
                </button>
              </div>
            </section>
          )}

          {/* Step 3: Confirm */}
          <ConfirmationModal show={showConfirm} title="Review Transfer" total={amount} onConfirm={handleConfirm} onClose={() => setShowConfirm(false)} loading={isPending}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>To</span>
              <span style={{ fontSize: "0.8125rem", fontWeight: 700 }}>{recipient?.full_name ?? "User"} (@{recipient?.username})</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Fee</span>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-success)" }}>Free</span>
            </div>
          </ConfirmationModal>

          <PinKeypad
            show={showPinPad}
            title="Enter PIN"
            onPinComplete={handlePinComplete}
            onClose={() => setShowPinPad(false)}
            loading={isPending}
            loadingTitle="Processing Transfer"
            loadingSubtitle={`Sending ₦${parseFloat(amount || "0").toLocaleString()}`}
          />
        </>
      )}
    </div>
  );
}

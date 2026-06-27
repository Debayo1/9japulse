"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "@phosphor-icons/react";
import { toast } from "sonner";
import Header from "@/components/Header";
import { updateTransactionPin } from "@/lib/auth";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function SecurityPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const [hasPin, setHasPin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  useEffect(() => {
    async function checkPinStatus() {
      try {
        const { data: sessionData } = await supabaseBrowser.auth.getSession();
        const user = sessionData?.session?.user;
        if (!user) {
          router.push("/login");
          return;
        }

        const { data: profile } = await (supabaseBrowser
          .from("profiles")
          .select("pin")
          .eq("id", user.id)
          .single() as any);

        const storedPin = profile?.pin || user.user_metadata?.transaction_pin;
        setHasPin(!!storedPin);
      } catch (err) {
        console.error("Failed to check PIN status:", err);
      } finally {
        setLoading(false);
      }
    }
    checkPinStatus();
  }, [router]);

  const handleNumericChange = (val: string, setter: (v: string) => void) => {
    setter(val.slice(0, 4).replace(/[^0-9]/g, ""));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (hasPin && currentPin.length !== 4) {
      toast.error("Please enter your current 4-digit PIN");
      return;
    }
    if (newPin.length !== 4) {
      toast.error("New PIN must be exactly 4 digits");
      return;
    }
    if (newPin !== confirmPin) {
      toast.error("New PINs do not match");
      return;
    }

    startTransition(async () => {
      try {
        const { data: sessionData } = await supabaseBrowser.auth.getSession();
        const session = sessionData?.session;
        if (!session?.access_token || !session.refresh_token) {
          throw new Error("Auth session missing");
        }

        await updateTransactionPin(
          hasPin ? currentPin : null,
          newPin,
          session.access_token,
          session.refresh_token
        );
        toast.success(hasPin ? "Transaction PIN updated successfully!" : "Transaction PIN set successfully!");
        router.push("/me");
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to update PIN");
      }
    });
  };

  if (loading) {
    return (
      <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
        <p style={{ color: "var(--text-secondary)" }}>Loading security settings…</p>
      </div>
    );
  }

  return (
    <div className="page">
      <Header title="Security & Privacy" />

      {/* Intro info banner */}
      <div
        className="glass-sm"
        style={{
          padding: "1.25rem",
          marginBottom: "1.75rem",
          border: "1.5px solid var(--border)",
          display: "flex",
          gap: "10px",
          alignItems: "flex-start",
        }}
      >
        <ShieldCheck size={24} weight="duotone" style={{ color: "var(--color-primary)", flexShrink: 0, marginTop: "2px" }} />
        <div>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, margin: 0 }}>Transaction Security PIN</h2>
          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "4px", lineHeight: 1.4 }}>
            Your transaction PIN protects your funds. You will need to enter this 4-digit security code for every purchase, transfer, or withdrawal.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        
        {/* Current PIN (Conditional) */}
        {hasPin && (
          <div>
            <label
              htmlFor="current-pin"
              style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.5rem" }}
            >
              Current Transaction PIN
            </label>
            <div className="input-wrapper">
              <input
                id="current-pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
                placeholder="••••"
                value={currentPin}
                onChange={(e) => handleNumericChange(e.target.value, setCurrentPin)}
                className="input"
                style={{ textAlign: "center", fontSize: "1.25rem", letterSpacing: "0.5em" }}
                required
                autoComplete="off"
              />
            </div>
          </div>
        )}

        {/* New PIN */}
        <div>
          <label
            htmlFor="new-pin"
            style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.5rem" }}
          >
            {hasPin ? "New Transaction PIN" : "Choose 4-Digit PIN"}
          </label>
          <div className="input-wrapper">
            <input
              id="new-pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              placeholder="••••"
              value={newPin}
              onChange={(e) => handleNumericChange(e.target.value, setNewPin)}
              className="input"
              style={{ textAlign: "center", fontSize: "1.25rem", letterSpacing: "0.5em" }}
              required
              autoComplete="off"
            />
          </div>
        </div>

        {/* Confirm New PIN */}
        <div>
          <label
            htmlFor="confirm-pin"
            style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.5rem" }}
          >
            Confirm New PIN
          </label>
          <div className="input-wrapper">
            <input
              id="confirm-pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              placeholder="••••"
              value={confirmPin}
              onChange={(e) => handleNumericChange(e.target.value, setConfirmPin)}
              className="input"
              style={{ textAlign: "center", fontSize: "1.25rem", letterSpacing: "0.5em" }}
              required
              autoComplete="off"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn btn-primary btn-full"
          style={{ height: "48px", marginTop: "1rem" }}
          disabled={isPending}
        >
          {isPending ? "Updating PIN…" : hasPin ? "Change Security PIN" : "Set Security PIN"}
        </button>
      </form>
    </div>
  );
}

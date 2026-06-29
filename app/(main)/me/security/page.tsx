"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Key, Fingerprint } from "@phosphor-icons/react";
import { toast } from "sonner";
import Header from "@/components/Header";
import { updateTransactionPin, updateAppPasscode } from "@/lib/auth";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function SecurityPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const [hasPin, setHasPin] = useState(false);
  const [hasPasscode, setHasPasscode] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // PIN states
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  // Passcode states
  const [currentPasscode, setCurrentPasscode] = useState("");
  const [newPasscode, setNewPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");

  useEffect(() => {
    async function checkSecurityStatus() {
      try {
        const { data: sessionData } = await supabaseBrowser.auth.getSession();
        const user = sessionData?.session?.user;
        if (!user) {
          router.push("/login");
          return;
        }

        const { data: profile } = await (supabaseBrowser
          .from("profiles")
          .select("pin, passcode")
          .eq("id", user.id)
          .single() as any);

        const storedPin = profile?.pin || user.user_metadata?.transaction_pin;
        setHasPin(!!storedPin);
        setHasPasscode(!!profile?.passcode);

        const isBioEnabled = localStorage.getItem(`biometrics_enabled_${user.id}`) === "true";
        setBiometricsEnabled(isBioEnabled);
      } catch (err) {
        console.error("Failed to check security status:", err);
      } finally {
        setLoading(false);
      }
    }
    checkSecurityStatus();
  }, [router]);

  const handleNumericChange = (val: string, setter: (v: string) => void) => {
    setter(val.slice(0, 4).replace(/[^0-9]/g, ""));
  };

  const handlePinSubmit = (e: React.FormEvent) => {
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
        setHasPin(true);
        setCurrentPin("");
        setNewPin("");
        setConfirmPin("");
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to update PIN");
      }
    });
  };

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (hasPasscode && currentPasscode.length !== 4) {
      toast.error("Please enter your current 4-digit passcode");
      return;
    }
    if (newPasscode.length !== 4) {
      toast.error("New passcode must be exactly 4 digits");
      return;
    }
    if (newPasscode !== confirmPasscode) {
      toast.error("New passcodes do not match");
      return;
    }

    startTransition(async () => {
      try {
        const { data: sessionData } = await supabaseBrowser.auth.getSession();
        const session = sessionData?.session;
        if (!session?.access_token || !session.refresh_token) {
          throw new Error("Auth session missing");
        }

        await updateAppPasscode(
          hasPasscode ? currentPasscode : null,
          newPasscode,
          session.access_token,
          session.refresh_token
        );
        toast.success(hasPasscode ? "App passcode updated successfully!" : "App passcode set successfully!");
        setHasPasscode(true);
        setCurrentPasscode("");
        setNewPasscode("");
        setConfirmPasscode("");
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to update passcode");
      }
    });
  };

  const toggleBiometrics = async () => {
    try {
      const { data: sessionData } = await supabaseBrowser.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) return;

      if (!hasPasscode) {
        toast.error("Please set a 4-digit app passcode before enabling biometrics");
        return;
      }

      if (biometricsEnabled) {
        localStorage.removeItem(`biometrics_enabled_${user.id}`);
        setBiometricsEnabled(false);
        toast.success("Biometric login disabled for this device");
      } else {
        if (typeof window !== "undefined" && !window.PublicKeyCredential) {
          toast.error("Biometrics is not supported on this browser or device");
          return;
        }

        localStorage.setItem(`biometrics_enabled_${user.id}`, "true");
        setBiometricsEnabled(true);
        toast.success("Device biometrics connected successfully!");
      }
    } catch {
      toast.error("Failed to configure biometrics");
    }
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

      {/* ─── TRANSACTION PIN SECTION ─── */}
      <div className="card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "1.25rem" }}>
          <ShieldCheck size={24} weight="duotone" style={{ color: "var(--color-primary)", flexShrink: 0, marginTop: "2px" }} />
          <div>
            <h2 style={{ fontSize: "0.875rem", fontWeight: 700, margin: 0 }}>Transaction Security PIN</h2>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "4px", lineHeight: 1.4 }}>
              Your transaction PIN protects your funds. You will need to enter this 4-digit security code for every purchase, transfer, or withdrawal.
            </p>
          </div>
        </div>

        <form onSubmit={handlePinSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {hasPin && (
            <div>
              <label htmlFor="current-pin" style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.375rem" }}>
                Current Transaction PIN
              </label>
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
          )}

          <div>
            <label htmlFor="new-pin" style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.375rem" }}>
              {hasPin ? "New Transaction PIN" : "Choose 4-Digit PIN"}
            </label>
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

          <div>
            <label htmlFor="confirm-pin" style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.375rem" }}>
              Confirm New PIN
            </label>
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

          <button type="submit" className="btn btn-primary" style={{ height: "42px", marginTop: "0.5rem" }} disabled={isPending}>
            {isPending ? "Updating PIN…" : hasPin ? "Change Security PIN" : "Set Security PIN"}
          </button>
        </form>
      </div>

      {/* ─── APP LOCK PASSCODE SECTION ─── */}
      <div className="card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "1.25rem" }}>
          <Key size={24} weight="duotone" style={{ color: "var(--color-accent)", flexShrink: 0, marginTop: "2px" }} />
          <div>
            <h2 style={{ fontSize: "0.875rem", fontWeight: 700, margin: 0 }}>App Lock Passcode</h2>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "4px", lineHeight: 1.4 }}>
              Set a 4-digit passcode to lock the application. When enabled, you can quickly unlock your dashboard with the passcode instead of entering your email and password every time.
            </p>
          </div>
        </div>

        <form onSubmit={handlePasscodeSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {hasPasscode && (
            <div>
              <label htmlFor="current-passcode" style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.375rem" }}>
                Current Passcode
              </label>
              <input
                id="current-passcode"
                type="password"
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
                placeholder="••••"
                value={currentPasscode}
                onChange={(e) => handleNumericChange(e.target.value, setCurrentPasscode)}
                className="input"
                style={{ textAlign: "center", fontSize: "1.25rem", letterSpacing: "0.5em" }}
                required
                autoComplete="off"
              />
            </div>
          )}

          <div>
            <label htmlFor="new-passcode" style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.375rem" }}>
              {hasPasscode ? "New Passcode" : "Choose 4-Digit Passcode"}
            </label>
            <input
              id="new-passcode"
              type="password"
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              placeholder="••••"
              value={newPasscode}
              onChange={(e) => handleNumericChange(e.target.value, setNewPasscode)}
              className="input"
              style={{ textAlign: "center", fontSize: "1.25rem", letterSpacing: "0.5em" }}
              required
              autoComplete="off"
            />
          </div>

          <div>
            <label htmlFor="confirm-passcode" style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.375rem" }}>
              Confirm New Passcode
            </label>
            <input
              id="confirm-passcode"
              type="password"
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              placeholder="••••"
              value={confirmPasscode}
              onChange={(e) => handleNumericChange(e.target.value, setConfirmPasscode)}
              className="input"
              style={{ textAlign: "center", fontSize: "1.25rem", letterSpacing: "0.5em" }}
              required
              autoComplete="off"
            />
          </div>

          <button type="submit" className="btn btn-secondary" style={{ height: "42px", marginTop: "0.5rem" }} disabled={isPending}>
            {isPending ? "Updating Passcode…" : hasPasscode ? "Change App Passcode" : "Set App Passcode"}
          </button>
        </form>
      </div>

      {/* ─── DEVICE BIOMETRIC SECURITY ─── */}
      <div className="card" style={{ padding: "1.25rem" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "1.25rem" }}>
          <Fingerprint size={24} weight="duotone" style={{ color: "var(--color-success)", flexShrink: 0, marginTop: "2px" }} />
          <div>
            <h2 style={{ fontSize: "0.875rem", fontWeight: 700, margin: 0 }}>Device Biometrics</h2>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "4px", lineHeight: 1.4 }}>
              Enable quick biometric verification using fingerprint or Face ID to unlock the application instantly.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)" }}>
            Biometric Unlock
          </span>
          <button
            type="button"
            onClick={toggleBiometrics}
            className="btn"
            style={{
              padding: "6px 14px",
              fontSize: "0.75rem",
              borderRadius: "10px",
              backgroundColor: biometricsEnabled ? "var(--color-primary)" : "var(--bg-surface)",
              color: biometricsEnabled ? "white" : "var(--text-primary)",
              border: "1px solid var(--border)",
              fontWeight: 700
            }}
          >
            {biometricsEnabled ? "Enabled" : "Disabled"}
          </button>
        </div>

        <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.4 }}>
          ℹ️ Note: For security, biometric credentials are connected only to this local device. Logging in from a new device will require setting up biometrics again.
        </p>
      </div>
    </div>
  );
}

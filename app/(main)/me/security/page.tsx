"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Key, Fingerprint, Eye, EyeClosed, CheckCircle, XCircle } from "@phosphor-icons/react";
import { toast } from "sonner";
import Header from "@/components/Header";
import { updateTransactionPin, updateAppPasscode } from "@/lib/auth";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function SecurityPage() {
  const router = useRouter();
  const [pinPending, setPinPending] = useState(false);
  const [passcodePending, setPasscodePending] = useState(false);

  const [hasPin, setHasPin] = useState(false);
  const [hasPasscode, setHasPasscode] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPins, setShowPins] = useState(false);

  const [currentPasscode, setCurrentPasscode] = useState("");
  const [newPasscode, setNewPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [showPasscodes, setShowPasscodes] = useState(false);

  useEffect(() => {
    async function checkSecurityStatus() {
      try {
        const { data: sessionData } = await supabaseBrowser.auth.getSession();
        const user = sessionData?.session?.user;
        if (!user) { router.push("/login"); return; }

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

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasPin && currentPin.length !== 4) { toast.error("Enter your current 4-digit PIN"); return; }
    if (newPin.length !== 4) { toast.error("New PIN must be exactly 4 digits"); return; }
    if (newPin !== confirmPin) { toast.error("PINs do not match"); return; }

    setPinPending(true);
    try {
      const { data: sessionData } = await supabaseBrowser.auth.getSession();
      const session = sessionData?.session;
      if (!session?.access_token || !session.refresh_token) throw new Error("Auth session missing");

      await updateTransactionPin(hasPin ? currentPin : null, newPin, session.access_token, session.refresh_token);
      toast.success(hasPin ? "PIN updated successfully!" : "PIN set successfully!");
      setHasPin(true);
      setCurrentPin(""); setNewPin(""); setConfirmPin("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update PIN");
    } finally {
      setPinPending(false);
    }
  };

  const handlePasscodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasPasscode && currentPasscode.length !== 4) { toast.error("Enter your current 4-digit passcode"); return; }
    if (newPasscode.length !== 4) { toast.error("New passcode must be exactly 4 digits"); return; }
    if (newPasscode !== confirmPasscode) { toast.error("Passcodes do not match"); return; }

    setPasscodePending(true);
    try {
      const { data: sessionData } = await supabaseBrowser.auth.getSession();
      const session = sessionData?.session;
      if (!session?.access_token || !session.refresh_token) throw new Error("Auth session missing");

      await updateAppPasscode(hasPasscode ? currentPasscode : null, newPasscode, session.access_token, session.refresh_token);
      toast.success(hasPasscode ? "Passcode updated!" : "Passcode set!");
      setHasPasscode(true);
      setCurrentPasscode(""); setNewPasscode(""); setConfirmPasscode("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update passcode");
    } finally {
      setPasscodePending(false);
    }
  };

  const toggleBiometrics = async () => {
    try {
      const { data: sessionData } = await supabaseBrowser.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) return;

      if (!hasPasscode) {
        toast.error("Set an app passcode first");
        return;
      }

      if (biometricsEnabled) {
        localStorage.removeItem(`biometrics_enabled_${user.id}`);
        setBiometricsEnabled(false);
        toast.success("Biometrics disabled");
      } else {
        if (typeof window !== "undefined" && !window.PublicKeyCredential) {
          toast.error("Biometrics is not supported on this browser or device");
          return;
        }
        localStorage.setItem(`biometrics_enabled_${user.id}`, "true");
        setBiometricsEnabled(true);
        toast.success("Biometrics enabled");
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

  const statusItems = [
    { label: "Transaction PIN", active: hasPin },
    { label: "App Passcode", active: hasPasscode },
    { label: "Biometrics", active: biometricsEnabled },
  ];

  return (
    <div className="page">
      <Header title="Security & Privacy" />

      {/* ─── Security Status Summary ─── */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {statusItems.map((item) => (
          <div
            key={item.label}
            className="animate-fade-in"
            style={{
              flex: 1,
              background: item.active
                ? "linear-gradient(135deg, hsl(152 60% 42% / 0.1), hsl(152 60% 42% / 0.02))"
                : "var(--bg-surface)",
              border: "1.5px solid",
              borderColor: item.active ? "hsl(152 60% 42% / 0.2)" : "var(--border)",
              borderRadius: "14px",
              padding: "0.75rem 0.625rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.375rem",
              textAlign: "center",
            }}
          >
            {item.active
              ? <CheckCircle size={20} weight="fill" style={{ color: "var(--color-success)" }} />
              : <XCircle size={20} weight="fill" style={{ color: "var(--text-muted)", opacity: 0.5 }} />
            }
            <div>
              <p style={{ fontSize: "0.5625rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", margin: 0 }}>
                {item.label}
              </p>
              <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: item.active ? "var(--color-success)" : "var(--text-secondary)", margin: "2px 0 0 0" }}>
                {item.active ? "Active" : "Not set"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── TRANSACTION PIN ─── */}
      <div className="card" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "1rem" }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", boxShadow: "0 4px 12px hsl(227 70% 55% / 0.2)",
          }}>
            <ShieldCheck size={20} weight="duotone" />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2 style={{ fontSize: "0.875rem", fontWeight: 700, margin: 0 }}>Transaction PIN</h2>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "4px", lineHeight: 1.5 }}>
              Required for every purchase, transfer, or withdrawal.
            </p>
          </div>
        </div>

        <form onSubmit={handlePinSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {hasPin && (
            <div>
              <label htmlFor="current-pin" className="input-label">Current PIN</label>
              <div className="input-wrapper">
                <input
                  id="current-pin" type={showPins ? "text" : "password"}
                  inputMode="numeric" pattern="[0-9]{4}" maxLength={4}
                  placeholder="••••" value={currentPin}
                  onChange={(e) => handleNumericChange(e.target.value, setCurrentPin)}
                  className="input" autoComplete="off" required
                  style={{ textAlign: "center", fontSize: "1.25rem", letterSpacing: "0.5em", paddingRight: "2.75rem" }}
                />
                <button type="button" onClick={() => setShowPins(!showPins)} tabIndex={-1}
                  aria-label={showPins ? "Hide PIN" : "Show PIN"}
                  style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: "4px" }}
                >
                  {showPins ? <EyeClosed size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="new-pin" className="input-label">{hasPin ? "New PIN" : "Choose 4-Digit PIN"}</label>
            <div className="input-wrapper">
              <input
                id="new-pin" type={showPins ? "text" : "password"}
                inputMode="numeric" pattern="[0-9]{4}" maxLength={4}
                placeholder="••••" value={newPin}
                onChange={(e) => handleNumericChange(e.target.value, setNewPin)}
                className="input" autoComplete="off" required
                style={{ textAlign: "center", fontSize: "1.25rem", letterSpacing: "0.5em", paddingRight: "2.75rem" }}
              />
              <button type="button" onClick={() => setShowPins(!showPins)} tabIndex={-1}
                aria-label={showPins ? "Hide PIN" : "Show PIN"}
                style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: "4px" }}
              >
                {showPins ? <EyeClosed size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirm-pin" className="input-label">Confirm New PIN</label>
            <div className="input-wrapper">
              <input
                id="confirm-pin" type={showPins ? "text" : "password"}
                inputMode="numeric" pattern="[0-9]{4}" maxLength={4}
                placeholder="••••" value={confirmPin}
                onChange={(e) => handleNumericChange(e.target.value, setConfirmPin)}
                className="input" autoComplete="off" required
                style={{ textAlign: "center", fontSize: "1.25rem", letterSpacing: "0.5em", paddingRight: "2.75rem" }}
              />
              <button type="button" onClick={() => setShowPins(!showPins)} tabIndex={-1}
                aria-label={showPins ? "Hide PIN" : "Show PIN"}
                style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: "4px" }}
              >
                {showPins ? <EyeClosed size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full" style={{ height: "46px", marginTop: "0.25rem" }} disabled={pinPending}>
            {pinPending ? "Updating…" : hasPin ? "Change Transaction PIN" : "Set Transaction PIN"}
          </button>
        </form>

        {pinPending && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 120,
            backgroundColor: "var(--bg-base)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: "1rem",
          }}>
            <div style={{
              width: 48, height: 48,
              border: "4px solid var(--border)",
              borderTopColor: "var(--color-primary)",
              borderRadius: "50%",
              animation: "sec-spin 0.7s linear infinite",
            }} />
            <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              Verifying your identity...
            </p>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", margin: 0 }}>
              Please wait while we update your security settings
            </p>
          </div>
        )}
      </div>

      {/* ─── APP LOCK PASSCODE ─── */}
      <div className="card" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "1rem" }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: "linear-gradient(135deg, var(--color-accent), hsl(14 88% 50%))",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", boxShadow: "0 4px 12px hsl(14 88% 58% / 0.2)",
          }}>
            <Key size={20} weight="duotone" />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2 style={{ fontSize: "0.875rem", fontWeight: 700, margin: 0 }}>App Lock Passcode</h2>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "4px", lineHeight: 1.5 }}>
              Quick unlock instead of email &amp; password every time.
            </p>
          </div>
        </div>

        <form onSubmit={handlePasscodeSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {hasPasscode && (
            <div>
              <label htmlFor="current-passcode" className="input-label">Current Passcode</label>
              <div className="input-wrapper">
                <input
                  id="current-passcode" type={showPasscodes ? "text" : "password"}
                  inputMode="numeric" pattern="[0-9]{4}" maxLength={4}
                  placeholder="••••" value={currentPasscode}
                  onChange={(e) => handleNumericChange(e.target.value, setCurrentPasscode)}
                  className="input" autoComplete="off" required
                  style={{ textAlign: "center", fontSize: "1.25rem", letterSpacing: "0.5em", paddingRight: "2.75rem" }}
                />
                <button type="button" onClick={() => setShowPasscodes(!showPasscodes)} tabIndex={-1}
                  aria-label={showPasscodes ? "Hide passcode" : "Show passcode"}
                  style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: "4px" }}
                >
                  {showPasscodes ? <EyeClosed size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="new-passcode" className="input-label">{hasPasscode ? "New Passcode" : "Choose 4-Digit Passcode"}</label>
            <div className="input-wrapper">
              <input
                id="new-passcode" type={showPasscodes ? "text" : "password"}
                inputMode="numeric" pattern="[0-9]{4}" maxLength={4}
                placeholder="••••" value={newPasscode}
                onChange={(e) => handleNumericChange(e.target.value, setNewPasscode)}
                className="input" autoComplete="off" required
                style={{ textAlign: "center", fontSize: "1.25rem", letterSpacing: "0.5em", paddingRight: "2.75rem" }}
              />
              <button type="button" onClick={() => setShowPasscodes(!showPasscodes)} tabIndex={-1}
                aria-label={showPasscodes ? "Hide passcode" : "Show passcode"}
                style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: "4px" }}
              >
                {showPasscodes ? <EyeClosed size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirm-passcode" className="input-label">Confirm New Passcode</label>
            <div className="input-wrapper">
              <input
                id="confirm-passcode" type={showPasscodes ? "text" : "password"}
                inputMode="numeric" pattern="[0-9]{4}" maxLength={4}
                placeholder="••••" value={confirmPasscode}
                onChange={(e) => handleNumericChange(e.target.value, setConfirmPasscode)}
                className="input" autoComplete="off" required
                style={{ textAlign: "center", fontSize: "1.25rem", letterSpacing: "0.5em", paddingRight: "2.75rem" }}
              />
              <button type="button" onClick={() => setShowPasscodes(!showPasscodes)} tabIndex={-1}
                aria-label={showPasscodes ? "Hide passcode" : "Show passcode"}
                style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: "4px" }}
              >
                {showPasscodes ? <EyeClosed size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-secondary btn-full" style={{ height: "46px", marginTop: "0.25rem" }} disabled={passcodePending}>
            {passcodePending ? "Updating…" : hasPasscode ? "Change App Passcode" : "Set App Passcode"}
          </button>
        </form>

        {passcodePending && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 120,
            backgroundColor: "var(--bg-base)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: "1rem",
          }}>
            <div style={{
              width: 48, height: 48,
              border: "4px solid var(--border)",
              borderTopColor: "var(--color-accent)",
              borderRadius: "50%",
              animation: "sec-spin 0.7s linear infinite",
            }} />
            <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              Verifying your identity...
            </p>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", margin: 0 }}>
              Please wait while we update your security settings
            </p>
          </div>
        )}
      </div>

      {/* ─── DEVICE BIOMETRICS ─── */}
      <div className="card" style={{ padding: "1.25rem" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "1rem" }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: "linear-gradient(135deg, var(--color-success), hsl(152 60% 36%))",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", boxShadow: "0 4px 12px hsl(152 60% 42% / 0.2)",
          }}>
            <Fingerprint size={20} weight="duotone" />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2 style={{ fontSize: "0.875rem", fontWeight: 700, margin: 0 }}>Device Biometrics</h2>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "4px", lineHeight: 1.5 }}>
              Fingerprint or Face ID for instant app unlock.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", background: "var(--bg-surface)", borderRadius: "12px" }}>
          <div>
            <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Biometric Unlock</p>
            <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
              {biometricsEnabled ? "Active on this device" : "Not configured"}
            </p>
          </div>
          <button
            type="button" onClick={toggleBiometrics}
            className="btn"
            style={{
              height: "32px", padding: "0 14px", fontSize: "0.75rem", borderRadius: "10px",
              backgroundColor: biometricsEnabled ? "var(--color-primary)" : "var(--bg-elevated)",
              color: biometricsEnabled ? "#fff" : "var(--text-primary)",
              border: "1.5px solid",
              borderColor: biometricsEnabled ? "var(--color-primary)" : "var(--border)",
              fontWeight: 700, minWidth: "80px",
            }}
          >
            {biometricsEnabled ? "Enabled" : "Disabled"}
          </button>
        </div>

        <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.75rem", lineHeight: 1.5, padding: "0.5rem 0.75rem", background: "var(--bg-surface)", borderRadius: "10px" }}>
          ℹ️ Biometrics are device-specific. Re-enable when switching devices.
        </p>
      </div>

      <style>{`
        @keyframes sec-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

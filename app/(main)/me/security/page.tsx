"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Key, Fingerprint, CheckCircle, XCircle } from "@phosphor-icons/react";
import { toast } from "sonner";
import Header from "@/components/Header";
import PinKeypad from "@/components/PinKeypad";
import { updateTransactionPin, updateAppPasscode } from "@/lib/auth";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

const glassCard: React.CSSProperties = {
  flex: 1, padding: "0.75rem 0.5rem", borderRadius: "14px",
  display: "flex", flexDirection: "column", alignItems: "center", gap: "0.375rem",
  textAlign: "center",
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const iconBox: React.CSSProperties = {
  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
  display: "flex", alignItems: "center", justifyContent: "center",
  color: "#fff",
};

const summaryRow: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  padding: "0.75rem", background: "var(--bg-surface)", borderRadius: "12px",
};

const statusDot = (active: boolean): React.CSSProperties => ({
  width: 8, height: 8, borderRadius: "50%",
  backgroundColor: active ? "var(--color-success)" : "var(--text-muted)",
  animation: active ? "pulse-dot 2s ease-in-out infinite" : "none",
});

const pillBtn: React.CSSProperties = {
  height: "32px", padding: "0 14px", fontSize: "0.75rem", borderRadius: "10px",
  fontWeight: 700, minWidth: "90px", cursor: "pointer",
  border: "none",
};

export default function SecurityPage() {
  const router = useRouter();
  const [pageLoading, setPageLoading] = useState(true);
  const [hasPin, setHasPin] = useState(false);
  const [hasPasscode, setHasPasscode] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);

  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinStep, setPinStep] = useState<"current" | "new" | "confirm">("new");
  const [pinBuffer, setPinBuffer] = useState({ current: "", new: "" });
  const [pinPending, setPinPending] = useState(false);
  const [pinError, setPinError] = useState("");

  const [passcodeModalOpen, setPasscodeModalOpen] = useState(false);
  const [passcodeStep, setPasscodeStep] = useState<"current" | "new" | "confirm">("new");
  const [passcodeBuffer, setPasscodeBuffer] = useState({ current: "", new: "" });
  const [passcodePending, setPasscodePending] = useState(false);
  const [passcodeError, setPasscodeError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data: sd } = await supabaseBrowser.auth.getSession();
        const user = sd?.session?.user;
        if (!user) { router.push("/login"); return; }

        const { data: profile } = await (supabaseBrowser
          .from("profiles")
          .select("pin, passcode")
          .eq("id", user.id)
          .single() as any);

        const storedPin = profile?.pin || user.user_metadata?.transaction_pin;
        setHasPin(!!storedPin);
        setHasPasscode(!!profile?.passcode);

        const bio = localStorage.getItem(`biometrics_enabled_${user.id}`) === "true";
        setBiometricsEnabled(bio);
      } catch (err) {
        console.error("Failed to check security status:", err);
      } finally {
        setPageLoading(false);
      }
    })();
  }, [router]);

  useEffect(() => {
    setPinStep(hasPin ? "current" : "new");
  }, [hasPin]);

  useEffect(() => {
    setPasscodeStep(hasPasscode ? "current" : "new");
  }, [hasPasscode]);

  // ─── PIN ───

  function openPinModal() {
    setPinBuffer({ current: "", new: "" });
    setPinStep(hasPin ? "current" : "new");
    setPinError("");
    setPinModalOpen(true);
  }

  function handlePinStep(pin: string) {
    setPinError("");
    if (pinStep === "current") {
      setPinBuffer((p) => ({ ...p, current: pin }));
      setPinStep("new");
    } else if (pinStep === "new") {
      setPinBuffer((p) => ({ ...p, new: pin }));
      setPinStep("confirm");
    } else {
      if (pin !== pinBuffer.new) {
        setPinError("PINs don't match. Try again.");
        setPinStep("new");
        return;
      }
      setPinPending(true);
      executePinUpdate().finally(() => setPinPending(false));
    }
  }

  async function executePinUpdate() {
    try {
      const { data: sd } = await supabaseBrowser.auth.getSession();
      const s = sd?.session;
      if (!s?.access_token || !s.refresh_token) throw new Error("Auth session missing");
      await updateTransactionPin(hasPin ? pinBuffer.current : null, pinBuffer.new, s.access_token, s.refresh_token);
      toast.success(hasPin ? "PIN updated!" : "PIN set!");
      setHasPin(true);
      setPinModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update PIN";
      setPinError(msg);
      setPinStep(hasPin ? "current" : "new");
    }
  }

  // ─── Passcode ───

  function openPasscodeModal() {
    setPasscodeBuffer({ current: "", new: "" });
    setPasscodeStep(hasPasscode ? "current" : "new");
    setPasscodeError("");
    setPasscodeModalOpen(true);
  }

  function handlePasscodeStep(pin: string) {
    setPasscodeError("");
    if (passcodeStep === "current") {
      setPasscodeBuffer((p) => ({ ...p, current: pin }));
      setPasscodeStep("new");
    } else if (passcodeStep === "new") {
      setPasscodeBuffer((p) => ({ ...p, new: pin }));
      setPasscodeStep("confirm");
    } else {
      if (pin !== passcodeBuffer.new) {
        setPasscodeError("Passcodes don't match. Try again.");
        setPasscodeStep("new");
        return;
      }
      setPasscodePending(true);
      executePasscodeUpdate().finally(() => setPasscodePending(false));
    }
  }

  async function executePasscodeUpdate() {
    try {
      const { data: sd } = await supabaseBrowser.auth.getSession();
      const s = sd?.session;
      if (!s?.access_token || !s.refresh_token) throw new Error("Auth session missing");
      await updateAppPasscode(hasPasscode ? passcodeBuffer.current : null, passcodeBuffer.new, s.access_token, s.refresh_token);
      toast.success(hasPasscode ? "Passcode updated!" : "Passcode set!");
      setHasPasscode(true);
      setPasscodeModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update passcode";
      setPasscodeError(msg);
      setPasscodeStep(hasPasscode ? "current" : "new");
    }
  }

  // ─── Biometrics ───

  const toggleBiometrics = async () => {
    try {
      const { data: sd } = await supabaseBrowser.auth.getSession();
      const user = sd?.session?.user;
      if (!user) return;
      if (!hasPasscode) { toast.error("Set an app passcode first"); return; }

      if (biometricsEnabled) {
        localStorage.removeItem(`biometrics_enabled_${user.id}`);
        setBiometricsEnabled(false);
        toast.success("Biometrics disabled");
      } else {
        if (typeof window !== "undefined" && !window.PublicKeyCredential) {
          toast.error("Biometrics not supported on this device");
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

  // ─── Render ───

  if (pageLoading) {
    return (
      <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
        <p style={{ color: "var(--text-secondary)" }}>Loading security settings…</p>
      </div>
    );
  }

  return (
    <div className="page">
      <Header title="Security & Privacy" />

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {[
          { label: "PIN", active: hasPin },
          { label: "PASSCODE", active: hasPasscode },
          { label: "BIO", active: biometricsEnabled },
        ].map((item) => (
          <div key={item.label} style={glassCard}>
            {item.active
              ? <CheckCircle size={20} weight="fill" style={{ color: "var(--color-success)" }} />
              : <XCircle size={20} weight="fill" style={{ color: "var(--text-muted)", opacity: 0.4 }} />
            }
            <div>
              <p style={{ fontSize: "0.5625rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", margin: 0 }}>
                {item.label}
              </p>
              <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: item.active ? "var(--color-success)" : "var(--text-secondary)", margin: "2px 0 0 0" }}>
                {item.active ? "Active" : item.label === "BIO" ? "Off" : "Not set"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Transaction PIN ─── */}
      <div className="card animate-fade-in" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "0.75rem" }}>
          <div style={{ ...iconBox, background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))", boxShadow: "0 4px 16px hsl(227 70% 55% / 0.25)" }}>
            <ShieldCheck size={20} weight="duotone" />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2 style={{ fontSize: "0.875rem", fontWeight: 700, margin: 0 }}>Transaction PIN</h2>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "4px", lineHeight: 1.5 }}>
              Required for every purchase, transfer, or withdrawal.
            </p>
          </div>
        </div>

        <div style={summaryRow}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={statusDot(hasPin)} />
            <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              {hasPin ? "Active" : "Not set"}
            </p>
          </div>
          <button type="button" onClick={openPinModal} className="squishy btn-primary"
            style={{ ...pillBtn, backgroundColor: "var(--color-primary)", color: "#fff" }}>
            {hasPin ? "Change PIN" : "Set PIN"}
          </button>
        </div>
      </div>

      {/* ─── App Lock Passcode ─── */}
      <div className="card animate-fade-in" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "0.75rem" }}>
          <div style={{ ...iconBox, background: "linear-gradient(135deg, var(--color-accent), hsl(14 88% 50%))", boxShadow: "0 4px 16px hsl(14 88% 58% / 0.25)" }}>
            <Key size={20} weight="duotone" />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2 style={{ fontSize: "0.875rem", fontWeight: 700, margin: 0 }}>App Lock Passcode</h2>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "4px", lineHeight: 1.5 }}>
              Quick unlock instead of email & password every time.
            </p>
          </div>
        </div>

        <div style={summaryRow}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={statusDot(hasPasscode)} />
            <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              {hasPasscode ? "Active" : "Not set"}
            </p>
          </div>
          <button type="button" onClick={openPasscodeModal} className="squishy"
            style={{ ...pillBtn, backgroundColor: "var(--color-accent)", color: "#fff" }}>
            {hasPasscode ? "Change" : "Set Passcode"}
          </button>
        </div>
      </div>

      {/* ─── Device Biometrics ─── */}
      <div className="card animate-fade-in" style={{ padding: "1.25rem" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "0.75rem" }}>
          <div style={{ ...iconBox, background: "linear-gradient(135deg, var(--color-success), hsl(152 60% 36%))", boxShadow: "0 4px 16px hsl(152 60% 42% / 0.25)" }}>
            <Fingerprint size={20} weight="duotone" />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2 style={{ fontSize: "0.875rem", fontWeight: 700, margin: 0 }}>Device Biometrics</h2>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "4px", lineHeight: 1.5 }}>
              Fingerprint or Face ID for instant app unlock.
            </p>
          </div>
        </div>

        <div style={summaryRow}>
          <div>
            <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Biometric Unlock</p>
            <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
              {biometricsEnabled ? "Active on this device" : "Not configured"}
            </p>
          </div>
          <button type="button" onClick={toggleBiometrics} className="squishy"
            style={{
              ...pillBtn,
              backgroundColor: biometricsEnabled ? "var(--color-primary)" : "var(--bg-elevated)",
              color: biometricsEnabled ? "#fff" : "var(--text-primary)",
              border: biometricsEnabled ? "none" : "1.5px solid var(--border)",
            }}>
            {biometricsEnabled ? "Enabled" : "Disabled"}
          </button>
        </div>

        <p style={{
          fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.75rem", lineHeight: 1.5,
          padding: "0.5rem 0.75rem", background: "var(--bg-surface)", borderRadius: "10px",
        }}>
          i Biometrics are device-specific. Re-enable when switching devices.
        </p>
      </div>

      {/* ─── PIN Modal (multi-step) ─── */}
      <PinKeypad
        key={`pin-${pinStep}`}
        show={pinModalOpen}
        title={pinStep === "current" ? "Current PIN" : pinStep === "new" ? "New PIN" : "Confirm New PIN"}
        onPinComplete={handlePinStep}
        onClose={() => { setPinModalOpen(false); setPinError(""); }}
        loading={pinPending}
        error={pinError}
        loadingTitle="Updating PIN..."
        loadingSubtitle="Please wait while we save your changes"
      >
        {pinStep === "current"
          ? "Enter your existing 4-digit PIN"
          : pinStep === "new"
          ? "Choose a new 4-digit PIN"
          : "Enter the new PIN again to confirm"}
      </PinKeypad>

      {/* ─── Passcode Modal (multi-step) ─── */}
      <PinKeypad
        key={`passcode-${passcodeStep}`}
        show={passcodeModalOpen}
        title={passcodeStep === "current" ? "Current Passcode" : passcodeStep === "new" ? "New Passcode" : "Confirm New Passcode"}
        onPinComplete={handlePasscodeStep}
        onClose={() => { setPasscodeModalOpen(false); setPasscodeError(""); }}
        loading={passcodePending}
        error={passcodeError}
        loadingTitle="Updating Passcode..."
        loadingSubtitle="Please wait while we save your changes"
      >
        {passcodeStep === "current"
          ? "Enter your existing passcode"
          : passcodeStep === "new"
          ? "Choose a new 4-digit passcode"
          : "Enter the new passcode again to confirm"}
      </PinKeypad>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

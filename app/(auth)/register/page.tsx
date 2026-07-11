"use client";

import { useState, useTransition, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Envelope, Lock, Eye, EyeSlash, User, Phone, ArrowLeft, ArrowRight, Backspace } from "@phosphor-icons/react";
import { toast } from "sonner";
import { signUp } from "@/lib/auth";

/* ── PIN Keypad Component ────────────────────────────────────────── */
function PinKeypad({
  value,
  maxLength = 4,
  onChange,
  error,
}: {
  value: string;
  maxLength?: number;
  onChange: (val: string) => void;
  error?: boolean;
}) {
  const handleKey = useCallback(
    (digit: string) => {
      if (value.length < maxLength) {
        onChange(value + digit);
      }
    },
    [value, maxLength, onChange]
  );

  const handleDelete = useCallback(() => {
    onChange(value.slice(0, -1));
  }, [value, onChange]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* PIN dots */}
      <div className="pin-dots">
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            className={`pin-dot ${i < value.length ? "filled" : ""} ${error && i < value.length ? "error" : ""}`}
          />
        ))}
      </div>

      {/* Keypad grid */}
      <div className="pin-keypad">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button key={d} type="button" className="pin-key" onClick={() => handleKey(d)}>
            {d}
          </button>
        ))}
        <div className="pin-key pin-key-empty" />
        <button type="button" className="pin-key" onClick={() => handleKey("0")}>
          0
        </button>
        <button type="button" className="pin-key pin-key-action" onClick={handleDelete} aria-label="Delete">
          <Backspace size={22} weight="regular" />
        </button>
      </div>
    </div>
  );
}

/* ── Register Page ───────────────────────────────────────────────── */
export default function RegisterPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  // Stepper state
  const [step, setStep] = useState(1);

  // Form states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinPhase, setPinPhase] = useState<"set" | "confirm">("set");

  const nextStep1 = () => {
    if (!fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (phone.length !== 11 || !/^\d+$/.test(phone)) {
      toast.error("Phone number must be exactly 11 digits");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    setStep(2);
  };

  const nextStep2 = () => {
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setStep(3);
    setPinPhase("set");
    setPin("");
    setConfirmPin("");
  };

  // PIN auto-advance logic
  const handlePinChange = (val: string) => {
    if (pinPhase === "set") {
      setPin(val);
      if (val.length === 4) {
        // Small delay then move to confirm
        setTimeout(() => {
          setPinPhase("confirm");
        }, 300);
      }
    } else {
      setConfirmPin(val);
      if (val.length === 4) {
        // Auto-submit after a short delay
        setTimeout(() => {
          if (val !== pin) {
            toast.error("PINs do not match");
            setConfirmPin("");
          } else {
            // Submit registration
            handleFinalSubmit();
          }
        }, 300);
      }
    }
  };

  const handleFinalSubmit = () => {
    startTransition(async () => {
      try {
        await signUp(email, password, fullName, phone, pin);
        toast.success("Account created! You can now log in.");
        router.push("/login");
      } catch (err: unknown) {
        toast.error((err as Error).message ?? "Registration failed");
      }
    });
  };

  const stepLabels = ["Personal Info", "Password", "Transaction PIN"];

  return (
    <div className="auth-page">
      {/* Heading */}
      <div className="auth-heading">
        <h1>Create Account</h1>
        <p>
          {step === 1 && "Enter your personal details"}
          {step === 2 && "Set up your account password"}
          {step === 3 && pinPhase === "set" && "Choose a 4-digit PIN"}
          {step === 3 && pinPhase === "confirm" && "Confirm your PIN"}
        </p>
      </div>

      {/* Step Progress */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          <span>Step {step} of 3</span>
          <span>{stepLabels[step - 1]}</span>
        </div>
        <div style={{ height: "3px", width: "100%", backgroundColor: "var(--border)", borderRadius: "99px", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: step === 1 ? "33%" : step === 2 ? "66%" : "100%",
              backgroundColor: "var(--color-primary)",
              borderRadius: "99px",
              transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </div>
      </div>

      {/* ── STEP 1: Personal Details ──────────────────────────────────── */}
      {step === 1 && (
        <div className="animate-scale-in" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label htmlFor="reg-name" style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "0.375rem" }}>
              Full Name
            </label>
            <div style={{ position: "relative" }}>
              <User size={18} weight="regular" color="var(--text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input
                id="reg-name"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="input"
                style={{ paddingLeft: "2.75rem" }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="reg-phone" style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "0.375rem" }}>
              Phone Number
            </label>
            <div style={{ position: "relative" }}>
              <Phone size={18} weight="regular" color="var(--text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input
                id="reg-phone"
                type="tel"
                placeholder="e.g. 08012345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 11))}
                required
                className="input"
                style={{ paddingLeft: "2.75rem" }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="reg-email" style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "0.375rem" }}>
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <Envelope size={18} weight="regular" color="var(--text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input
                id="reg-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input"
                style={{ paddingLeft: "2.75rem" }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={nextStep1}
            className="btn btn-primary btn-full"
            style={{ height: "48px", marginTop: "0.25rem" }}
          >
            Continue <ArrowRight size={16} weight="bold" />
          </button>
        </div>
      )}

      {/* ── STEP 2: Password ─────────────────────────────────────────── */}
      {step === 2 && (
        <div className="animate-scale-in" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label htmlFor="reg-password" style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "0.375rem" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={18} weight="regular" color="var(--text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input
                id="reg-password"
                type={showPwd ? "text" : "password"}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input"
                style={{ paddingLeft: "2.75rem", paddingRight: "2.75rem" }}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}
              >
                {showPwd ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="reg-confirm-password" style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "0.375rem" }}>
              Confirm Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={18} weight="regular" color="var(--text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input
                id="reg-confirm-password"
                type={showConfirmPwd ? "text" : "password"}
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="input"
                style={{ paddingLeft: "2.75rem", paddingRight: "2.75rem" }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPwd((v) => !v)}
                style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}
              >
                {showConfirmPwd ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem" }}>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn btn-secondary"
              style={{ flex: 1, height: "48px" }}
            >
              <ArrowLeft size={16} weight="bold" /> Back
            </button>
            <button
              type="button"
              onClick={nextStep2}
              className="btn btn-primary"
              style={{ flex: 2, height: "48px" }}
            >
              Continue <ArrowRight size={16} weight="bold" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: PIN Keypad ───────────────────────────────────────── */}
      {step === 3 && (
        <div className="animate-scale-in" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <PinKeypad
            value={pinPhase === "set" ? pin : confirmPin}
            onChange={handlePinChange}
          />

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", width: "100%", maxWidth: "280px" }}>
            <button
              type="button"
              onClick={() => {
                if (pinPhase === "confirm") {
                  setPinPhase("set");
                  setPin("");
                  setConfirmPin("");
                } else {
                  setStep(2);
                }
              }}
              className="btn btn-secondary btn-full"
              style={{ height: "44px", fontSize: "0.8125rem" }}
              disabled={isPending}
            >
              <ArrowLeft size={14} weight="bold" /> Back
            </button>
          </div>

          {isPending && (
            <p style={{ marginTop: "1rem", fontSize: "0.8125rem", color: "var(--text-muted)", textAlign: "center" }}>
              Creating your account…
            </p>
          )}
        </div>
      )}

      <p style={{ textAlign: "center", marginTop: "2rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
        Already have an account?{" "}
        <Link href="/login" style={{ color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}

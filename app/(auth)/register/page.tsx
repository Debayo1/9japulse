"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Envelope, Lock, Eye, EyeSlash, User, Phone, Key, ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { toast } from "sonner";
import { signUp } from "@/lib/auth";

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
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
      toast.error("Transaction PIN must be a 4-digit number");
      return;
    }
    if (pin !== confirmPin) {
      toast.error("Transaction PINs do not match");
      return;
    }

    startTransition(async () => {
      try {
        await signUp(email, password, fullName, phone, pin);
        toast.success("Account created successfully! You can now log in.");
        router.push("/login");
      } catch (err: unknown) {
        toast.error((err as Error).message ?? "Registration failed");
      }
    });
  };

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "2.5rem 1.5rem", maxWidth: 420, margin: "0 auto" }}>
      {/* Brand Header */}
      <div style={{ textAlign: "left", marginBottom: "2rem" }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 0 1.25rem 0", fontSize: "1.5rem", fontWeight: 900, color: "white", boxShadow: "var(--shadow-glow)" }}>
          ₦
        </div>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>Create Account</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.375rem" }}>
          {step === 1 && "Enter your basic contact details"}
          {step === 2 && "Configure your account password"}
          {step === 3 && "Secure your transactions with a PIN"}
        </p>
      </div>

      {/* Stepper Progress Bar */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.5rem" }}>
          <span>STEP {step} OF 3</span>
          <span>{step === 1 ? "Personal Info" : step === 2 ? "Security Code" : "Transaction PIN"}</span>
        </div>
        <div style={{ height: "4px", width: "100%", backgroundColor: "var(--border)", borderRadius: "99px", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: step === 1 ? "33%" : step === 2 ? "66%" : "100%",
              backgroundColor: "var(--color-primary)",
              borderRadius: "99px",
              transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            }}
          />
        </div>
      </div>

      {/* Forms stepper wrapper */}
      <div className="animate-slide-up">
        {/* STEP 1: Personal Details */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label htmlFor="reg-name" style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.5rem" }}>
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
              <label htmlFor="reg-phone" style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.5rem" }}>
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
              <label htmlFor="reg-email" style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.5rem" }}>
                Email Address
              </label>
              <div style={{ position: "relative" }}>
                <Envelope size={18} weight="regular" color="var(--text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  id="reg-email"
                  type="email"
                  placeholder="e.g. name@gmail.com"
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
              style={{ height: "48px", marginTop: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
            >
              Continue <ArrowRight size={16} weight="bold" />
            </button>
          </div>
        )}

        {/* STEP 2: Password configurations */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label htmlFor="reg-password" style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.5rem" }}>
                Account Password
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
                  {showPwd ? <EyeSlash size={18} weight="regular" /> : <Eye size={18} weight="regular" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="reg-confirm-password" style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.5rem" }}>
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
                  {showConfirmPwd ? <EyeSlash size={18} weight="regular" /> : <Eye size={18} weight="regular" />}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn btn-secondary"
                style={{ flex: 1, height: "48px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <ArrowLeft size={16} weight="bold" /> Back
              </button>
              <button
                type="button"
                onClick={nextStep2}
                className="btn btn-primary"
                style={{ flex: 2, height: "48px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                Continue <ArrowRight size={16} weight="bold" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Transaction PIN setups */}
        {step === 3 && (
          <form onSubmit={handleRegisterSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label htmlFor="reg-pin" style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.5rem" }}>
                Choose Transaction PIN
              </label>
              <div style={{ position: "relative" }}>
                <Key size={18} weight="regular" color="var(--text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  id="reg-pin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  maxLength={4}
                  placeholder="Set 4-Digit Security PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
                  required
                  className="input"
                  style={{ paddingLeft: "2.75rem", textAlign: "center", fontSize: "1.125rem", letterSpacing: "0.5em" }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-confirm-pin" style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.5rem" }}>
                Confirm Transaction PIN
              </label>
              <div style={{ position: "relative" }}>
                <Key size={18} weight="regular" color="var(--text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  id="reg-confirm-pin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  maxLength={4}
                  placeholder="Confirm 4-Digit PIN"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
                  required
                  className="input"
                  style={{ paddingLeft: "2.75rem", textAlign: "center", fontSize: "1.125rem", letterSpacing: "0.5em" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn btn-secondary"
                style={{ flex: 1, height: "48px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                disabled={isPending}
              >
                <ArrowLeft size={16} weight="bold" /> Back
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 2, height: "48px", display: "flex", alignItems: "center", justifyContent: "center" }}
                disabled={isPending}
              >
                {isPending ? "Creating account…" : "Create Account"}
              </button>
            </div>
          </form>
        )}
      </div>

      <p style={{ textAlign: "left", marginTop: "2.5rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
        Already have an account?{" "}
        <Link href="/login" style={{ color: "var(--color-primary)", fontWeight: 700, textDecoration: "none" }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}

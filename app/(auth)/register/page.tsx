"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Envelope, Lock, Eye, EyeSlash, User, Phone, Key } from "@phosphor-icons/react";
import { toast } from "sonner";
import { signUp } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email    = fd.get("email")     as string;
    const password = fd.get("password")  as string;
    const fullName = fd.get("fullName")  as string;
    const phone    = fd.get("phone")     as string;
    const pin      = fd.get("transactionPin") as string;

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
      toast.error("Transaction PIN must be a 4-digit number");
      return;
    }

    startTransition(async () => {
      try {
        await signUp(email, password, fullName, phone, pin);
        toast.success("Account created! Check your email to verify.");
        router.push("/login");
      } catch (err: unknown) {
        toast.error((err as Error).message ?? "Registration failed");
      }
    });
  };

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "2rem 1.5rem", maxWidth: 440, margin: "0 auto" }}>
      {/* Brand */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", fontSize: "1.75rem", boxShadow: "var(--shadow-glow)" }}>
          ₦
        </div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800 }}>Create Account</h1>
        <p style={{ color: "var(--text-secondary)", marginTop: "0.375rem" }}>Join millions of Nigerians</p>
      </div>

      <form onSubmit={handleSubmit} className="animate-slide-up" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Full name */}
        <div style={{ position: "relative" }}>
          <User size={18} weight="regular" color="var(--text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <input id="reg-name" name="fullName" type="text" placeholder="Full name" required autoComplete="name" className="input" style={{ paddingLeft: "2.75rem" }} />
        </div>

        {/* Phone */}
        <div style={{ position: "relative" }}>
          <Phone size={18} weight="regular" color="var(--text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <input id="reg-phone" name="phone" type="tel" placeholder="Phone number (e.g. 08012345678)" required autoComplete="tel" className="input" style={{ paddingLeft: "2.75rem" }} />
        </div>

        {/* Email */}
        <div style={{ position: "relative" }}>
          <Envelope size={18} weight="regular" color="var(--text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <input id="reg-email" name="email" type="email" placeholder="Email address" required autoComplete="email" className="input" style={{ paddingLeft: "2.75rem" }} />
        </div>

        {/* Password */}
        <div style={{ position: "relative" }}>
          <Lock size={18} weight="regular" color="var(--text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <input id="reg-password" name="password" type={showPwd ? "text" : "password"} placeholder="Login Password / Passcode (min 8 chars)" required autoComplete="new-password" className="input" style={{ paddingLeft: "2.75rem", paddingRight: "2.75rem" }} />
          <button type="button" onClick={() => setShowPwd((v) => !v)} aria-label={showPwd ? "Hide" : "Show"} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}>
            {showPwd ? <EyeSlash size={18} weight="regular" /> : <Eye size={18} weight="regular" />}
          </button>
        </div>

        {/* Transaction PIN */}
        <div style={{ position: "relative" }}>
          <Key size={18} weight="regular" color="var(--text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <input
            id="reg-pin"
            name="transactionPin"
            type="password"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            placeholder="Set 4-Digit Transaction PIN"
            required
            className="input"
            style={{ paddingLeft: "2.75rem" }}
            onChange={(e) => {
              e.target.value = e.target.value.replace(/[^0-9]/g, "");
            }}
          />
        </div>

        <button id="reg-submit-btn" type="submit" className="btn btn-primary btn-full" disabled={isPending}>
          {isPending ? "Creating account…" : "Create Account"}
        </button>
      </form>

      <p style={{ textAlign: "center", marginTop: "1.75rem", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
        Already have an account?{" "}
        <Link href="/login" style={{ color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}

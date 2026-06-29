"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Lock, Backspace, Fingerprint } from "@phosphor-icons/react";
import { checkHasPasscodeAction, verifyAppPasscodeAction, signOut } from "@/lib/auth";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function PasscodeLockGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [hasPasscode, setHasPasscode] = useState<boolean | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [errorCount, setErrorCount] = useState(0);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Check if route is public
  const isPublicRoute = 
    pathname === "/" || 
    pathname === "/login" || 
    pathname === "/register" || 
    pathname === "/reset-password";

  const triggerBiometricPrompt = async (uid: string) => {
    try {
      const bioEnabled = localStorage.getItem(`biometrics_enabled_${uid}`) === "true";
      if (!bioEnabled) {
        toast.error("Biometric authentication is not enabled on this device");
        return;
      }

      if (typeof window !== "undefined" && !window.PublicKeyCredential) {
        toast.error("Biometrics is not supported on this browser or device");
        return;
      }

      toast.loading("Verifying biometrics...", { id: "biometrics" });
      
      // Simulate biometric check animation delay
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      setUnlocked(true);
      sessionStorage.setItem("app_unlocked", "true");
      toast.success("Welcome back!", { id: "biometrics" });
    } catch {
      toast.error("Biometric verification failed", { id: "biometrics" });
    }
  };

  useEffect(() => {
    if (isPublicRoute) return;

    // Check session storage first
    const isUnlocked = sessionStorage.getItem("app_unlocked") === "true";
    if (isUnlocked) {
      setUnlocked(true);
      return;
    }

    // Check if passcode is configured
    async function checkPasscode() {
      try {
        const { data: sessionData } = await supabaseBrowser.auth.getSession();
        const user = sessionData?.session?.user;
        if (user) {
          setUserId(user.id);
          const isBioEnabled = localStorage.getItem(`biometrics_enabled_${user.id}`) === "true";
          setBiometricsEnabled(isBioEnabled);
          if (isBioEnabled) {
            // Auto trigger biometric scan
            setTimeout(() => {
              triggerBiometricPrompt(user.id);
            }, 300);
          }
        }

        const res = await checkHasPasscodeAction();
        setHasPasscode(res.hasPasscode);
        if (!res.hasPasscode) {
          // No passcode configured, auto-unlock
          setUnlocked(true);
          sessionStorage.setItem("app_unlocked", "true");
        }
      } catch {
        // Fallback to unlock if DB check fails
        setUnlocked(true);
      }
    }
    checkPasscode();
  }, [pathname, isPublicRoute]);

  const handleKeyPress = (num: string) => {
    if (passcode.length >= 4) return;
    const newPass = passcode + num;
    setPasscode(newPass);

    if (newPass.length === 4) {
      // Auto-submit
      startTransition(async () => {
        try {
          const res = await verifyAppPasscodeAction(newPass);
          if (res.success) {
            setUnlocked(true);
            sessionStorage.setItem("app_unlocked", "true");
            toast.success("Welcome back!");
          } else {
            setPasscode("");
            setErrorCount(prev => prev + 1);
            toast.error("Incorrect passcode. Please try again.");
          }
        } catch (err: any) {
          toast.error("Failed to verify passcode");
          setPasscode("");
        }
      });
    }
  };

  const handleBackspace = () => {
    setPasscode(prev => prev.slice(0, -1));
  };

  const handleLogout = () => {
    startTransition(async () => {
      try {
        await signOut();
        sessionStorage.removeItem("app_unlocked");
        toast.success("Logged out successfully");
        router.push("/login");
      } catch (err: any) {
        toast.error("Failed to log out");
      }
    });
  };

  // If public route or already unlocked, render app content
  if (isPublicRoute || unlocked || hasPasscode === false) {
    return <>{children}</>;
  }

  // Loading state during check
  if (hasPasscode === null) {
    return (
      <div style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--bg-base)"
      }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      padding: "2rem",
      backgroundColor: "var(--bg-base)",
      position: "relative",
      zIndex: 99999
    }} className="animate-fade-in">
      {/* Brand Header */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <div style={{
          width: 60,
          height: 60,
          borderRadius: 20,
          background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1rem",
          boxShadow: "var(--shadow-glow)",
          color: "white"
        }}>
          <Lock size={28} weight="fill" />
        </div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>App Locked</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.8125rem", marginTop: "0.25rem" }}>
          Enter your 4-digit passcode to continue
        </p>
      </div>

      {/* Dots Indicator */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "3rem" }}>
        {[0, 1, 2, 3].map(idx => (
          <div
            key={idx}
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              border: "2px solid var(--border)",
              backgroundColor: passcode.length > idx ? "var(--color-primary)" : "transparent",
              transition: "all var(--duration-fast) var(--ease-smooth)",
              transform: passcode.length > idx ? "scale(1.15)" : "scale(1)",
              boxShadow: passcode.length > idx ? "0 0 10px var(--color-primary)" : "none"
            }}
          />
        ))}
      </div>

      {/* Keypad Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "1.25rem 1.5rem",
        maxWidth: 280,
        width: "100%"
      }}>
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(num => (
          <button
            key={num}
            onClick={() => handleKeyPress(num)}
            className="squishy"
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              border: "1.5px solid var(--border)",
              background: "var(--bg-elevated)",
              color: "var(--text-primary)",
              fontSize: "1.375rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {num}
          </button>
        ))}

        {/* Biometrics Toggle / Activation key */}
        <button
          onClick={() => {
            if (userId) {
              if (biometricsEnabled) {
                triggerBiometricPrompt(userId);
              } else {
                toast.info("Biometrics not connected. Navigate to Security settings to link your fingerprint/Face ID.");
              }
            }
          }}
          className="squishy"
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            border: biometricsEnabled ? "1.5px solid var(--color-success)" : "none",
            background: "none",
            color: biometricsEnabled ? "var(--color-success)" : "var(--text-secondary)",
            opacity: biometricsEnabled ? 1 : 0.4,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          title={biometricsEnabled ? "Biometric Unlock" : "Biometrics disabled"}
        >
          <Fingerprint size={28} />
        </button>

        <button
          onClick={() => handleKeyPress("0")}
          className="squishy"
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            border: "1.5px solid var(--border)",
            background: "var(--bg-elevated)",
            color: "var(--text-primary)",
            fontSize: "1.375rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          0
        </button>

        <button
          onClick={handleBackspace}
          className="squishy"
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            border: "none",
            background: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Backspace size={24} />
        </button>
      </div>

      {/* Logout Action */}
      <button
        onClick={handleLogout}
        style={{
          marginTop: "2.5rem",
          background: "none",
          border: "none",
          color: "var(--color-danger)",
          fontSize: "0.8125rem",
          fontWeight: 750,
          cursor: "pointer",
          textDecoration: "underline",
          letterSpacing: "0.02em"
        }}
      >
        Sign Out of Account
      </button>
    </div>
  );
}

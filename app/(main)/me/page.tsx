"use client";

import { useEffect, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  UserCircle,
  CaretRight,
  SignOut,
  Gear,
  Question,
  ShieldCheck,
  Bell,
  ShareNetwork,
  Wrench
} from "@phosphor-icons/react";
import { signOut } from "@/lib/auth";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import Link from "next/link";

export default function MePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("Restoring...");

  useEffect(() => {
    // 1. Instantly load from cache
    const cachedProfile = localStorage.getItem("vtu_profile_details_cache");
    if (cachedProfile) {
      const parsed = JSON.parse(cachedProfile);
      setUser(parsed.user);
      setProfile(parsed.profile);
      setLoading(false);
    }

    async function loadProfile() {
      setSyncing(true);
      setSyncMessage("Syncing...");
      try {
        const { data: sessionData } = await supabaseBrowser.auth.getSession();
        const sessionUser = sessionData?.session?.user;
        if (!sessionUser) {
          router.push("/login");
          return;
        }
        setUser(sessionUser);

        // Fetch profile to check role
        const { data: userProfile } = await (supabaseBrowser
          .from("profiles")
          .select("*")
          .eq("id", sessionUser.id)
          .maybeSingle() as any);
        
        setProfile(userProfile);

        // Save to cache
        localStorage.setItem("vtu_profile_details_cache", JSON.stringify({
          user: sessionUser,
          profile: userProfile
        }));

        setSyncMessage("Synced");
        setTimeout(() => setSyncing(false), 2000);
      } catch (err) {
        console.error("Failed to load user profile:", err);
        setSyncMessage("Sync failed");
        setTimeout(() => setSyncing(false), 3000);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [router]);

  const handleSignOut = () => {
    startTransition(async () => {
      try {
        await signOut();
        sessionStorage.removeItem("app_unlocked");
        
        // Clean all local storage cached data to avoid cross-profile leakage
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith("vtu_")) {
            localStorage.removeItem(key);
          }
        });

        toast.success("Signed out successfully");
        router.push("/login");
      } catch (err: any) {
        toast.error("Failed to sign out. Please try again.");
      }
    });
  };

  if (loading) {
    return (
      <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
        <p style={{ color: "var(--text-secondary)" }}>Loading profile details…</p>
      </div>
    );
  }

  const name = profile?.full_name || user?.user_metadata?.full_name || user?.email || "User";
  const initials = name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isAdmin = profile?.role === "admin";

  return (
    <div className="page" style={{ position: "relative" }}>
      {/* Floating Sync status badge */}
      {syncing && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "0.3rem 0.8rem",
          backgroundColor: "var(--bg-elevated)",
          borderRadius: "99px",
          fontSize: "0.6875rem",
          fontWeight: 700,
          color: "var(--text-secondary)",
          position: "fixed",
          top: "12px",
          right: "12px",
          zIndex: 101,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          border: "1.5px solid var(--border)",
          pointerEvents: "none"
        }}>
          <div
            className="pulse-dot"
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: syncMessage === "Synced" ? "var(--color-success)" : syncMessage === "Sync failed" ? "var(--color-danger)" : "var(--color-warning)"
            }}
          />
          {syncMessage}
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <UserCircle size={24} weight="duotone" color="var(--color-primary)" />
        <h1 style={{ fontSize: "1.375rem", fontWeight: 700 }}>My Profile</h1>
      </div>

      {/* Avatar + Name */}
      <div className="card animate-fade-in" style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <div
          style={{
            width: 58,
            height: 58,
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "#fff",
            flexShrink: 0,
            boxShadow: "var(--shadow-glow)"
          }}
        >
          {initials}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: "1.0625rem", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "2px 0 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</p>
          <div style={{ marginTop: "4px" }}>
            <span className="badge badge-success" style={{ fontSize: "0.625rem" }}>Verified</span>
          </div>
        </div>
      </div>

      {/* Referral Code Box */}
      <div className="glass-sm" style={{ padding: "0.875rem 1.125rem", marginBottom: "1.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
            Referral Code
          </p>
          <p style={{ fontWeight: 800, fontSize: "1.0625rem", letterSpacing: "0.08em", color: "var(--color-primary)", margin: "2px 0 0 0" }}>
            9JP–{user?.id?.slice(0, 6).toUpperCase()}
          </p>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(`9JP–${user?.id?.slice(0, 6).toUpperCase()}`);
            toast.success("Referral code copied to clipboard!");
          }}
          className="btn"
          style={{ fontSize: "0.6875rem", padding: "4px 10px", height: "26px", borderRadius: "8px", background: "var(--bg-base)" }}
        >
          Copy
        </button>
      </div>

      {/* ─── GROUP 1: ACCOUNT & SECURITY ─── */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
          Account & Security
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Link
            href="/me/settings"
            style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1rem", textDecoration: "none" }}
            className="card"
          >
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "color-mix(in srgb, var(--color-primary) 10%, transparent)", display: "flex", alignItems: "center", color: "var(--color-primary)", justifyContent: "center" }}>
              <Gear size={18} weight="fill" />
            </div>
            <span style={{ flex: 1, fontWeight: 600, fontSize: "0.8125rem", color: "var(--text-primary)" }}>Account Settings</span>
            <CaretRight size={14} weight="bold" color="var(--text-muted)" />
          </Link>

          <Link
            href="/me/security"
            style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1rem", textDecoration: "none" }}
            className="card"
          >
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "color-mix(in srgb, var(--color-success) 10%, transparent)", display: "flex", alignItems: "center", color: "var(--color-success)", justifyContent: "center" }}>
              <ShieldCheck size={18} weight="fill" />
            </div>
            <span style={{ flex: 1, fontWeight: 600, fontSize: "0.8125rem", color: "var(--text-primary)" }}>Security PIN & Passcode</span>
            <CaretRight size={14} weight="bold" color="var(--text-muted)" />
          </Link>

          <Link
            href="/me/notifs"
            style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1rem", textDecoration: "none" }}
            className="card"
          >
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "color-mix(in srgb, var(--color-warning) 10%, transparent)", display: "flex", alignItems: "center", color: "var(--color-warning)", justifyContent: "center" }}>
              <Bell size={18} weight="fill" />
            </div>
            <span style={{ flex: 1, fontWeight: 600, fontSize: "0.8125rem", color: "var(--text-primary)" }}>Notifications</span>
            <CaretRight size={14} weight="bold" color="var(--text-muted)" />
          </Link>
        </div>
      </div>

      {/* ─── GROUP 2: UTILITIES & TOOLS ─── */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
          Utilities & Earnings
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Link
            href="/me/referral"
            style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1rem", textDecoration: "none" }}
            className="card"
          >
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "color-mix(in srgb, var(--color-accent) 10%, transparent)", display: "flex", alignItems: "center", color: "var(--color-accent)", justifyContent: "center" }}>
              <ShareNetwork size={18} weight="fill" />
            </div>
            <span style={{ flex: 1, fontWeight: 600, fontSize: "0.8125rem", color: "var(--text-primary)" }}>Refer & Earn Program</span>
            <CaretRight size={14} weight="bold" color="var(--text-muted)" />
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1rem", textDecoration: "none" }}
              className="card"
            >
              <div style={{ width: 32, height: 32, borderRadius: 10, background: "color-mix(in srgb, var(--color-primary) 10%, transparent)", display: "flex", alignItems: "center", color: "var(--color-primary)", justifyContent: "center" }}>
                <Wrench size={18} weight="fill" />
              </div>
              <span style={{ flex: 1, fontWeight: 600, fontSize: "0.8125rem", color: "var(--text-primary)" }}>Admin Panel Dashboard</span>
              <CaretRight size={14} weight="bold" color="var(--text-muted)" />
            </Link>
          )}
        </div>
      </div>

      {/* ─── GROUP 3: SUPPORT ─── */}
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
          Help & Feedback
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Link
            href="/me/support"
            style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1rem", textDecoration: "none" }}
            className="card"
          >
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "color-mix(in srgb, var(--color-info) 10%, transparent)", display: "flex", alignItems: "center", color: "var(--color-info)", justifyContent: "center" }}>
              <Question size={18} weight="fill" />
            </div>
            <span style={{ flex: 1, fontWeight: 600, fontSize: "0.8125rem", color: "var(--text-primary)" }}>Help & Support Center</span>
            <CaretRight size={14} weight="bold" color="var(--text-muted)" />
          </Link>
        </div>
      </div>
      {/* Sign Out Button */}
      <button
        onClick={handleSignOut}
        className="btn btn-secondary btn-full"
        style={{ color: "var(--color-danger)", borderColor: "hsl(0 72% 51% / 0.2)", height: "46px" }}
      >
        <SignOut size={18} />
        Sign Out
      </button>

      <style>{`
        @keyframes pulse {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
        .pulse-dot {
          animation: pulse 1.2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}

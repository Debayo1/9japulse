"use client";

import { useEffect, useState, useRef } from "react";
import Header from "@/components/Header";
import ThemeSettingsCard from "@/components/ThemeSettingsCard";
import { SkeletonList } from "@/components/SkeletonLoader";
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { CheckCircle, XCircle } from "@phosphor-icons/react";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const { data: s } = await supabaseBrowser.auth.getSession();
        const u = s?.session?.user;
        if (!u) return;
        setUser(u);

        const { data: p } = await (supabaseBrowser as any)
          .from("profiles")
          .select("*")
          .eq("id", u.id)
          .maybeSingle();

        setProfile(p);
        const uname = p?.username ?? "";
        setUsername(uname);
        setOriginalUsername(uname);
      } catch {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const checkUsername = (val: string) => {
    if (timer.current) clearTimeout(timer.current);
    if (abortRef.current) abortRef.current.abort();

    if (!val || val.length < 3 || val === originalUsername) {
      setAvailable(null);
      return;
    }

    setChecking(true);
    timer.current = setTimeout(async () => {
      const ac = new AbortController();
      abortRef.current = ac;

      try {
        const { data, error } = await (supabaseBrowser as any)
          .from("profiles")
          .select("id")
          .eq("username", val)
          .maybeSingle();

        if (ac.signal.aborted) return;
        setAvailable(error ? null : !data);
      } catch {
        if (!ac.signal.aborted) setAvailable(null);
      } finally {
        if (!ac.signal.aborted) setChecking(false);
      }
    }, 400);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
    setUsername(val);
    checkUsername(val);
  };

  const handleSaveUsername = async () => {
    if (username.length < 3 || username.length > 20) return toast.error("Username must be 3-20 characters");
    if (!/^[a-z0-9_]+$/.test(username)) return toast.error("Only lowercase letters, numbers, and underscores");
    if (available === false) return toast.error("Username already taken");

    setSaving(true);
    try {
      const { error } = await (supabaseBrowser as any)
        .from("profiles")
        .update({ username })
        .eq("id", user.id);

      if (error) throw new Error(error.message);
      setOriginalUsername(username);
      setAvailable(null);
      localStorage.setItem("vtu_profile_cache", JSON.stringify({ fullName: profile?.full_name ?? user?.user_metadata?.full_name ?? "User", username }));
      toast.success("Username saved!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <Header title="Account Settings" />
        <SkeletonList rows={4} />
      </div>
    );
  }

  const name = profile?.full_name ?? user?.user_metadata?.full_name ?? user?.email ?? "User";

  return (
    <div className="page">
      <Header title="Account Settings" />

      <section className="glass-sm animate-fade-in" style={{ padding: "1rem", marginBottom: "1rem" }}>
        <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
          Signed in as
        </p>
        <h1 style={{ fontSize: "1.25rem", marginTop: "0.25rem" }}>{name}</h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>{user?.email}</p>
      </section>

      <div className="card animate-fade-in" style={{ marginBottom: "1rem" }}>
        <h3 style={{ marginBottom: "0.75rem" }}>Username</h3>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
          Your unique @handle — others use this to send you money
        </p>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontWeight: 600, fontSize: "0.875rem", pointerEvents: "none" }}>@</span>
            <input
              className="input"
              style={{ paddingLeft: "2rem" }}
              placeholder="username"
              maxLength={20}
              value={username}
              onChange={handleUsernameChange}
            />
          </div>
          <button className="btn btn-primary" onClick={handleSaveUsername} disabled={!username || username === originalUsername || saving || available === false} style={{ whiteSpace: "nowrap" }}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
        {username !== originalUsername && username.length >= 3 && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem" }}>
            {checking ? (
              <span style={{ color: "var(--text-muted)" }}>Checking...</span>
            ) : available === true ? (
              <><CheckCircle size={14} style={{ color: "var(--color-success)" }} /><span style={{ color: "var(--color-success)", fontWeight: 600 }}>Available</span></>
            ) : available === false ? (
              <><XCircle size={14} style={{ color: "var(--color-danger)" }} /><span style={{ color: "var(--color-danger)", fontWeight: 600 }}>Taken</span></>
            ) : null}
          </div>
        )}
      </div>

      <ThemeSettingsCard />
    </div>
  );
}

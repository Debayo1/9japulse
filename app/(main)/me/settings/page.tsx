"use client";

import { useState, useEffect } from "react";
import { UserCircle, CheckCircle, XCircle } from "@phosphor-icons/react";
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import Header from "@/components/Header";
import ThemeSettingsCard from "@/components/ThemeSettingsCard";

export default function SettingsPage() {
  const [username, setUsername] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] = useState<"idle" | "available" | "taken" | "invalid">("idle");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabaseBrowser.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      setEmail(user.email ?? "");
      setName((user.user_metadata?.full_name as string) ?? user.email ?? "User");
      const { data } = await (supabaseBrowser as any)
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();
      if (data) {
        setUsername(data.username ?? "");
        setOriginalUsername(data.username ?? "");
      }
      setLoading(false);
    })();
  }, []);

  const validate = (val: string) => {
    if (val.length < 3 || val.length > 20) return false;
    return /^[a-z0-9_]+$/.test(val);
  };

  const checkUsername = async (val: string) => {
    if (!validate(val)) { setAvailability("invalid"); return; }
    if (val === originalUsername) { setAvailability("idle"); return; }
    setChecking(true);
    try {
      const { data, error } = await supabaseBrowser
        .from("profiles")
        .select("id")
        .eq("username", val)
        .maybeSingle();
      if (error) throw error;
      setAvailability(data ? "taken" : "available");
    } catch {
      setAvailability("idle");
    } finally {
      setChecking(false);
    }
  };

  const handleChange = (val: string) => {
    const cleaned = val.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(cleaned);
    setAvailability("idle");
    if (cleaned.length >= 3) {
      checkUsername(cleaned);
    }
  };

  const handleSave = async () => {
    if (!validate(username)) { toast.error("Username must be 3-20 lowercase chars"); return; }
    if (availability === "taken") { toast.error("Username is already taken"); return; }
    setSaving(true);
    try {
      const { error } = await (supabaseBrowser as any)
        .from("profiles")
        .update({ username })
        .eq("id", userId);
      if (error) throw error;
      setOriginalUsername(username);
      setAvailability("idle");
      toast.success("Username saved!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const changed = username !== originalUsername;
  const canSave = changed && validate(username) && availability === "available";

  if (loading) {
    return (
      <div className="page bg-zinc-950">
        <Header title="Account Settings" />
        <div className="bg-white/5 rounded-2xl p-8 text-center text-zinc-500 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="page bg-zinc-950">
      <Header title="Account Settings" />

      <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 mb-4">
        <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Signed in as</p>
        <h1 className="text-white text-xl font-bold">{name}</h1>
        <p className="text-zinc-400 text-sm mt-0.5">{email}</p>
      </section>

      <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <UserCircle size={20} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-white font-semibold">Username</p>
            <p className="text-zinc-400 text-xs">Choose a unique @username</p>
          </div>
        </div>

        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-mono">@</span>
          <input
            className="input pl-8"
            placeholder="username"
            value={username}
            onChange={(e) => handleChange(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 mt-2 min-h-5">
          {checking && <span className="text-zinc-500 text-xs">Checking...</span>}
          {!checking && availability === "available" && (
            <span className="flex items-center gap-1 text-emerald-400 text-xs">
              <CheckCircle size={12} weight="fill" /> Available
            </span>
          )}
          {!checking && availability === "taken" && (
            <span className="flex items-center gap-1 text-red-400 text-xs">
              <XCircle size={12} weight="fill" /> Already taken
            </span>
          )}
          {!checking && availability === "invalid" && (
            <span className="text-zinc-500 text-xs">3-20 lowercase alphanumeric characters</span>
          )}
        </div>

        <button
          className="btn btn-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold mt-4"
          onClick={handleSave}
          disabled={!canSave || saving}
        >
          {saving ? "Saving..." : "Save Username"}
        </button>
      </section>

      <ThemeSettingsCard />
    </div>
  );
}

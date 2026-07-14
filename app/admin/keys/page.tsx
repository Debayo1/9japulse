"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Wrench, Database, Key, CheckCircle, ArrowsClockwise, Robot, Storefront } from "@phosphor-icons/react";
import { toast } from "sonner";
import Header from "@/components/Header";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import {
  testDatabaseConnection,
  runFullMigration,
  getProviderKeysAdmin,
  saveProviderKeyAdmin,
  ProviderKeyRow,
  syncGSubzDataPlansAdmin,
} from "@/lib/dbAdmin";

export default function AdminKeysPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dbUrl, setDbUrl] = useState("");
  const [keys, setKeys] = useState<ProviderKeyRow[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);

  // Form states for adding/updating keys
  const [provider, setProvider] = useState("gsubz");
  const [keyName, setKeyName] = useState("api_key");
  const [keyValue, setKeyValue] = useState("");

  // Bot settings state
  const [botSettings, setBotSettings] = useState<any>(null);
  const [sellers, setSellers] = useState<any[]>([]);

  // Load provider keys from database
  const loadKeys = async (silent = false) => {
    if (!silent) setLoadingKeys(true);
    try {
      // It will use process.env.DATABASE_URL or prompt for it
      // Let's pass the input dbUrl if typed, otherwise it uses server env
      const data = await getProviderKeysAdmin(dbUrl);
      setKeys(data);
    } catch (err: any) {
      if (!silent) {
        console.error("Failed to load keys:", err.message);
      }
    } finally {
      setLoadingKeys(false);
    }
  };

  useEffect(() => {
    async function checkAccess() {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }

      const { checkAdminStatus } = await import("@/lib/admin");
      const isAdmin = await checkAdminStatus();
      if (!isAdmin) {
        toast.error("Access denied: Admin role required.");
        router.replace("/home");
        return;
      }

      loadKeys(true);
    }
    checkAccess();
    loadBotSettings();
    loadSellers();
  }, [router]);

  const loadBotSettings = async () => {
    try {
      const res = await fetch("/api/admin/bot-settings");
      if (res.ok) {
        const data = await res.json();
        if (data && !data.error) setBotSettings(data);
      }
    } catch {}
  };

  const loadSellers = async () => {
    try {
      const res = await fetch("/api/admin/sellers");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setSellers(data);
      }
    } catch {}
  };

  const updateBotSetting = async (field: string, value: any) => {
    try {
      const res = await fetch("/api/admin/bot-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, value }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setBotSettings((prev: any) => ({ ...prev, [field]: value }));
      toast.success(`${field} updated`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    }
  };

  const registerTelegramWebhook = async () => {
    startTransition(async () => {
      try {
        const token = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
        const res = await fetch("/api/telegram/set-webhook", { method: "POST" });
        const data = await res.json();
        if (data.success) toast.success("Telegram webhook registered!");
        else throw new Error(data.error || "Failed");
      } catch (err: any) {
        toast.error(err.message || "Failed to register webhook");
      }
    });
  };

  const approveSeller = async (sellerId: string) => {
    try {
      const { approveSeller } = await import("@/lib/seller");
      const result = await approveSeller(sellerId);
      if (result.success) {
        toast.success("Seller approved!");
        loadSellers();
      } else {
        toast.error("Failed to approve seller");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to approve seller");
    }
  };

  const handleTestConnection = () => {
    startTransition(async () => {
      try {
        const res = await testDatabaseConnection(dbUrl);
        toast.success(res.message);
        loadKeys();
      } catch (err: any) {
        toast.error(err.message || "Failed to connect to database");
      }
    });
  };

  const handleRunMigrations = () => {
    if (!confirm("Are you sure you want to run the database schema migrations? This will recreate missing tables/columns.")) {
      return;
    }
    startTransition(async () => {
      try {
        const res = await runFullMigration(dbUrl);
        toast.success(res.message);
        loadKeys();
      } catch (err: any) {
        toast.error(err.message || "Migration failed");
      }
    });
  };

  const handleSyncDataPlans = () => {
    startTransition(async () => {
      try {
        toast.loading("Synchronizing plans with GSubz API...", { id: "sync-plans" });
        const res = await syncGSubzDataPlansAdmin(dbUrl);
        toast.success(res.message, { id: "sync-plans" });
      } catch (err: any) {
        toast.error(err.message || "Failed to sync plans", { id: "sync-plans" });
      }
    });
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyValue) {
      toast.error("Please enter a key value");
      return;
    }

    startTransition(async () => {
      try {
        await saveProviderKeyAdmin(dbUrl, provider, keyName, keyValue);
        toast.success(`Key for ${provider} (${keyName}) saved successfully!`);
        setKeyValue("");
        loadKeys();
      } catch (err: any) {
        toast.error(err.message || "Failed to save provider key");
      }
    });
  };

  return (
    <div className="page">
      <Header title="Admin Panel" />

      {/* Main Admin Card */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
          <Database size={24} weight="duotone" color="var(--color-primary)" />
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, margin: 0 }}>Database Setup</h2>
        </div>
        
        <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "1.25rem", lineHeight: 1.4 }}>
          Connect to your PostgreSQL database directly to perform maintenance and apply schema updates. By default, the server environment variables will be used.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div>
            <label htmlFor="db-url" style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.375rem" }}>
              Database Connection URL (Optional Override)
            </label>
            <input
              id="db-url"
              type="password"
              placeholder="postgresql://postgres:[password]@db..."
              value={dbUrl}
              onChange={(e) => setDbUrl(e.target.value)}
              className="input"
              style={{ fontSize: "0.8125rem", padding: "0.75rem 1rem" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%" }}>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={handleTestConnection}
                className="btn btn-secondary"
                style={{ flex: 1, fontSize: "0.8125rem", height: "42px" }}
                disabled={isPending}
              >
                Test Connection
              </button>
              <button
                onClick={handleRunMigrations}
                className="btn btn-primary"
                style={{ flex: 1, fontSize: "0.8125rem", height: "42px" }}
                disabled={isPending}
              >
                Run Migrations
              </button>
            </div>
            <button
              onClick={handleSyncDataPlans}
              className="btn btn-secondary"
              style={{ width: "100%", fontSize: "0.8125rem", height: "42px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              disabled={isPending}
            >
              <ArrowsClockwise size={16} />
              Sync GSubz Data Plans
            </button>
          </div>
        </div>
      </div>

      {/* Keys Admin Form */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
          <Key size={24} weight="duotone" color="var(--color-accent)" />
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, margin: 0 }}>Manage Provider Keys</h2>
        </div>

        <form onSubmit={handleSaveKey} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label htmlFor="provider-select" style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.375rem" }}>
                Provider
              </label>
              <select
                id="provider-select"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="input"
                style={{ fontSize: "0.8125rem", padding: "0.75rem 1rem", height: "42px" }}
              >
                <option value="gsubz">GSubz</option>
                <option value="ncwallet">NCWallet</option>
                <option value="telegram">Telegram</option>
                <option value="google">Google</option>
              </select>
            </div>
            <div>
              <label htmlFor="key-name-input" style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.375rem" }}>
                Key Name
              </label>
              <input
                id="key-name-input"
                type="text"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="api_key"
                className="input"
                style={{ fontSize: "0.8125rem", padding: "0.75rem 1rem", height: "42px" }}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="key-value-input" style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.375rem" }}>
              Key Value / Auth Token
            </label>
            <input
              id="key-value-input"
              type="text"
              value={keyValue}
              onChange={(e) => setKeyValue(e.target.value)}
              placeholder="Enter provider key value"
              className="input"
              style={{ fontSize: "0.8125rem", padding: "0.75rem 1rem" }}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            style={{ fontSize: "0.8125rem", height: "42px" }}
            disabled={isPending}
          >
            Save/Update Key
          </button>
        </form>
      </div>

      {/* Active Keys List */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ fontSize: "0.9375rem", fontWeight: 700 }}>Registered Provider Keys</h3>
          <button
            onClick={() => loadKeys()}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-secondary)", display: "flex", alignItems: "center" }}
            disabled={loadingKeys}
            aria-label="Refresh keys list"
          >
            <ArrowsClockwise size={16} className={loadingKeys ? "animate-spin" : ""} />
          </button>
        </div>

        {keys.length === 0 ? (
          <div style={{ textAlign: "center", padding: "1.5rem 0", color: "var(--text-muted)", fontSize: "0.8125rem" }}>
            {loadingKeys ? "Loading keys..." : "No keys found. Configure one above."}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {keys.map((k) => (
              <div
                key={k.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.75rem 0.875rem",
                  borderRadius: "12px",
                  border: "1px solid var(--border)",
                  background: "var(--bg-surface)",
                }}
              >
                <div>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 700, margin: 0, textTransform: "uppercase" }}>
                    {k.provider}
                  </p>
                  <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", margin: 0 }}>
                    Name: {k.key_name} • Value: {k.key_value.slice(0, 8)}...{k.key_value.slice(-4)}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <CheckCircle size={16} weight="fill" color="var(--color-success)" />
                  <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--color-success)" }}>Active</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bot Configuration */}
      {botSettings && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
            <Robot size={24} weight="duotone" color="#10b981" />
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, margin: 0 }}>Bot Configuration</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", borderRadius: 12, background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: "0.875rem", margin: 0, color: "var(--text-primary)" }}>Enable Bot</p>
                <p style={{ fontSize: "0.75rem", margin: "2px 0 0 0", color: "var(--text-muted)" }}>Allow users to chat with Pulse AI</p>
              </div>
              <button
                onClick={() => updateBotSetting("bot_enabled", !botSettings.bot_enabled)}
                style={{
                  width: 48, height: 28, borderRadius: 14, border: "none", cursor: "pointer", position: "relative",
                  background: botSettings.bot_enabled ? "linear-gradient(135deg, #10b981, #14b8a6)" : "var(--border)",
                  transition: "background 0.2s",
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: "50%", background: "#fff", position: "absolute", top: 3,
                  left: botSettings.bot_enabled ? 24 : 3, transition: "left 0.2s",
                }} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              {[
                { label: "Free Msgs/Day", field: "bot_free_messages_per_day", type: "number" },
                { label: "Daily Price (₦)", field: "bot_daily_price", type: "number" },
                { label: "Weekly Price (₦)", field: "bot_weekly_price", type: "number" },
                { label: "Monthly Price (₦)", field: "bot_monthly_price", type: "number" },
                { label: "Seller Commission %", field: "seller_commission_rate", type: "number" },
                { label: "Auto-Release Days", field: "seller_auto_release_days", type: "number" },
              ].map(({ label, field, type }) => (
                <div key={field}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.25rem" }}>{label}</label>
                  <input
                    type={type}
                    value={(botSettings as any)[field] ?? ""}
                    onChange={(e) => updateBotSetting(field, type === "number" ? Number(e.target.value) : e.target.value)}
                    className="input"
                    style={{ fontSize: "0.8125rem", padding: "0.6rem 0.75rem", height: "38px" }}
                  />
                </div>
              ))}
            </div>

            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.25rem" }}>Welcome Message</label>
              <textarea
                value={botSettings.bot_welcome_message ?? ""}
                onChange={(e) => updateBotSetting("bot_welcome_message", e.target.value)}
                className="input"
                style={{ fontSize: "0.8125rem", padding: "0.6rem 0.75rem", width: "100%", minHeight: "60px", resize: "vertical" }}
              />
            </div>

            <button
              onClick={registerTelegramWebhook}
              className="btn btn-secondary"
              style={{ fontSize: "0.8125rem", height: "42px", width: "100%" }}
              disabled={isPending}
            >
              Register Telegram Webhook
            </button>
          </div>
        </div>
      )}

      {/* Seller Management */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
          <Storefront size={24} weight="duotone" color="#f59e0b" />
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, margin: 0 }}>Seller Management</h2>
        </div>

        {sellers.length === 0 ? (
          <p style={{ textAlign: "center", padding: "1rem", color: "var(--text-muted)", fontSize: "0.8125rem" }}>No seller applications yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {sellers.map((s: any) => (
              <div key={s.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0.75rem 0.875rem", borderRadius: 12,
                border: "1px solid var(--border)", background: "var(--bg-surface)",
              }}>
                <div>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 700, margin: 0 }}>{s.display_name}</p>
                  <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", margin: 0 }}>
                    {s.email || s.phone || "No contact"} • {s.description?.slice(0, 60) || "No description"}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{
                    fontSize: "0.625rem", fontWeight: 700, padding: "2px 8px", borderRadius: 6, textTransform: "uppercase",
                    background: s.status === "approved" ? "rgba(16,185,129,0.12)" : s.status === "pending" ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)",
                    color: s.status === "approved" ? "#10b981" : s.status === "pending" ? "#f59e0b" : "#ef4444",
                  }}>
                    {s.status}
                  </span>
                  {s.status === "pending" && (
                    <button
                      onClick={() => approveSeller(s.id)}
                      className="btn btn-primary"
                      style={{ fontSize: "0.6875rem", height: "30px", padding: "0 12px" }}
                    >
                      Approve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

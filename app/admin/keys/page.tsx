"use client";

import { useState, useEffect, useTransition } from "react";
import { Wrench, Database, Key, CheckCircle, Warning, ArrowsClockwise } from "@phosphor-icons/react";
import { toast } from "sonner";
import Header from "@/components/Header";
import {
  testDatabaseConnection,
  runFullMigration,
  getProviderKeysAdmin,
  saveProviderKeyAdmin,
  ProviderKeyRow,
} from "@/lib/dbAdmin";

export default function AdminKeysPage() {
  const [isPending, startTransition] = useTransition();
  const [dbUrl, setDbUrl] = useState("");
  const [keys, setKeys] = useState<ProviderKeyRow[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);

  // Form states for adding/updating keys
  const [provider, setProvider] = useState("gsubz");
  const [keyName, setKeyName] = useState("api_key");
  const [keyValue, setKeyValue] = useState("");

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
    // Attempt load keys on mount (using server environment variables)
    loadKeys(true);
  }, []);

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
              Run Migrations (SQL)
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
    </div>
  );
}

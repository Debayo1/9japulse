"use client";

import { ArrowsClockwise } from "@phosphor-icons/react/dist/ssr";

interface KeysTabProps {
  keys: any[];
  dbUrl: string;
  setDbUrl: React.Dispatch<React.SetStateAction<string>>;
  selectedProvider: string;
  setSelectedProvider: React.Dispatch<React.SetStateAction<string>>;
  keyName: string;
  setKeyName: React.Dispatch<React.SetStateAction<string>>;
  keyValue: string;
  setKeyValue: React.Dispatch<React.SetStateAction<string>>;
  isPending: boolean;
  handleSaveProviderKey: (e: React.FormEvent) => void;
  handleTestDatabase: () => void;
  handleRunDbMigrations: () => void;
  handleSyncPlans: () => void;
}

export default function KeysTab({
  keys,
  dbUrl,
  setDbUrl,
  selectedProvider,
  setSelectedProvider,
  keyName,
  setKeyName,
  keyValue,
  setKeyValue,
  isPending,
  handleSaveProviderKey,
  handleTestDatabase,
  handleRunDbMigrations,
  handleSyncPlans,
}: KeysTabProps) {
  return (
    <div role="tabpanel" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="card" style={{ padding: "1.25rem" }}>
        <h3 style={{ fontSize: "0.9375rem", fontWeight: 800, marginBottom: "0.875rem" }}>Database Connection Settings</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div>
            <label htmlFor="db-url-c" style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.375rem" }}>
              Database Connection URL (Optional Override)
            </label>
            <input
              id="db-url-c"
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
                onClick={handleTestDatabase}
                className="btn btn-secondary"
                style={{ flex: 1, fontSize: "0.8125rem", height: "42px" }}
                disabled={isPending}
              >
                Test Connection
              </button>
              <button
                onClick={handleRunDbMigrations}
                className="btn btn-primary"
                style={{ flex: 1, fontSize: "0.8125rem", height: "42px" }}
                disabled={isPending}
              >
                Run Migrations
              </button>
            </div>
            <button
              onClick={handleSyncPlans}
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

      <div className="card" style={{ padding: "1.25rem" }}>
        <h3 style={{ fontSize: "0.9375rem", fontWeight: 800, marginBottom: "0.875rem" }}>Update Provider Credentials</h3>
        <form onSubmit={handleSaveProviderKey} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label htmlFor="p-select" style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.375rem" }}>
                Provider
              </label>
              <select
                id="p-select"
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="input"
                style={{ height: "42px", fontSize: "0.8125rem", padding: "0 0.875rem" }}
              >
                <option value="gsubz">GSubz</option>
                <option value="ncwallet">NCWallet</option>
              </select>
            </div>

            <div>
              <label htmlFor="k-name" style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.375rem" }}>
                Key Name
              </label>
              <select
                id="k-name"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                className="input"
                style={{ height: "42px", fontSize: "0.8125rem", padding: "0 0.875rem" }}
              >
                <option value="api_key">API Key</option>
                <option value="auth_token">Auth Token</option>
                <option value="pin">PIN Code</option>
                <option value="passcode">Passcode</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="k-val" style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.375rem" }}>
              Key Value
            </label>
            <input
              id="k-val"
              type="password"
              placeholder="Enter credential value"
              value={keyValue}
              onChange={(e) => setKeyValue(e.target.value)}
              className="input"
              style={{ fontSize: "0.8125rem", padding: "0.75rem 1rem" }}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%", fontSize: "0.8125rem", height: "42px" }} disabled={isPending}>
            Save Key
          </button>
        </form>
      </div>

      <div className="card" style={{ padding: "1.25rem" }}>
        <h3 style={{ fontSize: "0.9375rem", fontWeight: 800, marginBottom: "0.75rem" }}>Configured Keys Status</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {keys.map((k, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
              <div>
                <span style={{ fontSize: "0.8125rem", fontWeight: 700 }}>{k.provider?.toUpperCase()}</span>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0 }}>{k.key_name}</p>
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--color-success)" }}>Active</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

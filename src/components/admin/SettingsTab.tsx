"use client";

interface SettingsTabProps {
  settings: any;
  setSettings: React.Dispatch<React.SetStateAction<any>>;
  isPending: boolean;
  handleUpdateSettings: (e: React.FormEvent) => void;
}

export default function SettingsTab({
  settings,
  setSettings,
  isPending,
  handleUpdateSettings,
}: SettingsTabProps) {
  return (
    <div role="tabpanel" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="card" style={{ padding: "1.25rem" }}>
        <h3 style={{ fontSize: "0.9375rem", fontWeight: 800, marginBottom: "0.875rem" }}>Configure Fees & Options</h3>
        <form onSubmit={handleUpdateSettings} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div>
            <label htmlFor="app-name-in" style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.375rem" }}>
              Application Name
            </label>
            <input
              id="app-name-in"
              type="text"
              value={settings.app_name}
              onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
              className="input"
              style={{ fontSize: "0.8125rem", padding: "0.75rem 1rem" }}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label htmlFor="dep-fee" style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.375rem" }}>
                Deposit Fee (₦)
              </label>
              <input
                id="dep-fee"
                type="number"
                value={settings.deposit_fee}
                onChange={(e) => setSettings({ ...settings, deposit_fee: Number(e.target.value) })}
                className="input"
                style={{ fontSize: "0.8125rem", padding: "0.75rem 1rem" }}
                required
              />
            </div>

            <div>
              <label htmlFor="trf-fee" style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.375rem" }}>
                P2P Transfer Fee (₦)
              </label>
              <input
                id="trf-fee"
                type="number"
                value={settings.transfer_fee}
                onChange={(e) => setSettings({ ...settings, transfer_fee: Number(e.target.value) })}
                className="input"
                style={{ fontSize: "0.8125rem", padding: "0.75rem 1rem" }}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="bt-fee" style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.375rem" }}>
              Bank Cashout Fee (₦)
            </label>
            <input
              id="bt-fee"
              type="number"
              value={settings.bank_transfer_fee}
              onChange={(e) => setSettings({ ...settings, bank_transfer_fee: Number(e.target.value) })}
              className="input"
              style={{ fontSize: "0.8125rem", padding: "0.75rem 1rem" }}
              required
            />
          </div>

          <div>
            <label htmlFor="b-text" style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.375rem" }}>
              Home Dashboard Banner Announcement Text
            </label>
            <textarea
              id="b-text"
              value={settings.banner_text || ""}
              onChange={(e) => setSettings({ ...settings, banner_text: e.target.value })}
              className="input"
              style={{ fontSize: "0.8125rem", padding: "0.75rem 1rem", minHeight: "60px", resize: "vertical" }}
              placeholder="e.g. System upgrade completed successfully!"
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "4px" }}>
            <input
              id="maintenance-toggle"
              type="checkbox"
              checked={settings.app_maintenance}
              onChange={(e) => setSettings({ ...settings, app_maintenance: e.target.checked })}
              style={{ width: "18px", height: "18px", cursor: "pointer" }}
            />
            <label htmlFor="maintenance-toggle" style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-primary)", cursor: "pointer" }}>
              Enable App Maintenance Mode (Blocks non-admin access)
            </label>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%", fontSize: "0.8125rem", height: "42px", marginTop: "0.5rem" }} disabled={isPending}>
            Update Settings
          </button>
        </form>
      </div>
    </div>
  );
}

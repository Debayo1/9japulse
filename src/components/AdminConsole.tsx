"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Users,
  Receipt,
  Key,
  Gear,
  ChartBar,
  ArrowsClockwise,
  UserCheck,
  Coins,
  ShieldCheck,
  Database,
  ArrowRight,
} from "@phosphor-icons/react";
import Image from "next/image";
import {
  updatePlatformSettingsAdminAction,
  updateUserBalanceAdminAction,
  updateTransactionStatusAdminAction,
  promoteUserToAdmin,
} from "@/lib/admin";
import {
  syncGSubzDataPlansAdmin,
  testDatabaseConnection,
  runFullMigration,
  saveProviderKeyAdmin,
} from "@/lib/dbAdmin";

interface AdminConsoleProps {
  initialUsers: any[];
  initialTransactions: any[];
  initialSettings: any;
  initialKeys: any[];
}

export default function AdminConsole({
  initialUsers,
  initialTransactions,
  initialSettings,
  initialKeys,
}: AdminConsoleProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "txns" | "keys" | "settings">("overview");
  const [isPending, startTransition] = useTransition();

  // Local lists
  const [users, setUsers] = useState(initialUsers);
  const [txns, setTxns] = useState(initialTransactions);
  const [settings, setSettings] = useState(initialSettings || {
    app_name: "9jaPulse",
    deposit_fee: 50,
    transfer_fee: 0,
    bank_transfer_fee: 0,
    app_maintenance: false,
    banner_text: "",
  });
  const [keys, setKeys] = useState(initialKeys);

  // Search filters
  const [userSearch, setUserSearch] = useState("");
  const [txnSearch, setTxnSearch] = useState("");

  // Editing state for users
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserBalance, setEditingUserBalance] = useState("");
  
  // Promoted emails form state
  const [promotedEmail, setPromotedEmail] = useState("");

  // Keys forms states
  const [dbUrl, setDbUrl] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("gsubz");
  const [keyName, setKeyName] = useState("api_key");
  const [keyValue, setKeyValue] = useState("");

  // Stats computed from arrays
  const totalWithdrawable = users.reduce((acc, curr) => acc + Number(curr.wallets?.[0]?.balance_withdrawable || 0), 0);
  const successfulTxns = txns.filter(t => t.status === "success");
  const totalVolume = successfulTxns.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  // Handlers
  const handleUpdateBalance = (userId: string, currentBalance: number) => {
    setEditingUserId(userId);
    setEditingUserBalance(String(currentBalance));
  };

  const saveUserBalance = (userId: string) => {
    const amt = parseFloat(editingUserBalance);
    if (isNaN(amt) || amt < 0) {
      toast.error("Please enter a valid balance amount");
      return;
    }

    startTransition(async () => {
      try {
        const res = await updateUserBalanceAdminAction(userId, amt);
        if (!res.success) throw new Error(res.message);
        
        // Update local state
        setUsers(prev => prev.map(u => {
          if (u.id === userId) {
            const updatedWallets = [...(u.wallets || [])];
            if (updatedWallets[0]) {
              updatedWallets[0] = { ...updatedWallets[0], balance_withdrawable: amt };
            }
            return { ...u, wallets: updatedWallets };
          }
          return u;
        }));

        toast.success("User balance updated successfully!");
        setEditingUserId(null);
      } catch (err: any) {
        toast.error(err.message || "Failed to update balance");
      }
    });
  };

  const handlePromoteUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promotedEmail) return;

    startTransition(async () => {
      try {
        const res = await promoteUserToAdmin(promotedEmail);
        if (!res.success) throw new Error(res.message);
        
        toast.success(res.message);
        setPromotedEmail("");
        // Reload users list or update roles in local list
        setUsers(prev => prev.map(u => 
          u.email.toLowerCase().trim() === promotedEmail.toLowerCase().trim()
            ? { ...u, role: "admin" }
            : u
        ));
      } catch (err: any) {
        toast.error(err.message || "Failed to promote user");
      }
    });
  };

  const handleUpdateTxnStatus = (txnId: string, newStatus: string) => {
    startTransition(async () => {
      try {
        const res = await updateTransactionStatusAdminAction(txnId, newStatus);
        if (!res.success) throw new Error(res.message);

        setTxns(prev => prev.map(t => t.id === txnId ? { ...t, status: newStatus } : t));
        toast.success(`Transaction marked as ${newStatus}`);
      } catch (err: any) {
        toast.error(err.message || "Failed to update status");
      }
    });
  };

  const handleUpdateSettings = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await updatePlatformSettingsAdminAction(settings);
        if (!res.success) throw new Error(res.message);
        toast.success(res.message);
      } catch (err: any) {
        toast.error(err.message || "Failed to update settings");
      }
    });
  };

  const handleSaveProviderKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyValue) {
      toast.error("Please enter a key value");
      return;
    }
    startTransition(async () => {
      try {
        const res = await saveProviderKeyAdmin(dbUrl, selectedProvider, keyName, keyValue);
        if (!res.success) throw new Error("Update failed");
        toast.success(`Active key updated for ${selectedProvider}!`);
        setKeyValue("");
        // Refresh local keys list
        setKeys(prev => {
          const cleanProv = selectedProvider.toLowerCase().trim();
          const cleanName = keyName.toLowerCase().trim();
          const exists = prev.some(k => k.provider === cleanProv && k.key_name === cleanName);
          if (exists) {
            return prev.map(k => k.provider === cleanProv && k.key_name === cleanName ? { ...k, key_value: "••••••••" } : k);
          } else {
            return [...prev, { provider: cleanProv, key_name: cleanName, key_value: "••••••••", is_active: true }];
          }
        });
      } catch (err: any) {
        toast.error(err.message || "Failed to save provider key");
      }
    });
  };

  const handleTestDatabase = () => {
    startTransition(async () => {
      try {
        const res = await testDatabaseConnection(dbUrl);
        toast.success(res.message);
      } catch (err: any) {
        toast.error(err.message || "Connection failed");
      }
    });
  };

  const handleRunDbMigrations = () => {
    if (!confirm("Are you sure you want to run the database migrations? This creates/updates all tables.")) return;
    startTransition(async () => {
      try {
        const res = await runFullMigration(dbUrl);
        toast.success(res.message);
      } catch (err: any) {
        toast.error(err.message || "Migration failed");
      }
    });
  };

  const handleSyncPlans = () => {
    startTransition(async () => {
      try {
        toast.loading("Syncing data plans from GSubz...", { id: "sync-plans" });
        const res = await syncGSubzDataPlansAdmin(dbUrl);
        toast.success(res.message, { id: "sync-plans" });
      } catch (err: any) {
        toast.error(err.message || "Sync failed", { id: "sync-plans" });
      }
    });
  };

  // Filtered lists
  const filteredUsers = users.filter(u =>
    (u.email ?? "").toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.full_name ?? "").toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredTxns = txns.filter(t =>
    (t.id ?? "").toLowerCase().includes(txnSearch.toLowerCase()) ||
    (t.service_type ?? "").toLowerCase().includes(txnSearch.toLowerCase()) ||
    (t.phone ?? "").toLowerCase().includes(txnSearch.toLowerCase()) ||
    (t.reference ?? "").toLowerCase().includes(txnSearch.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* ─── Modern Tab bar ────────────────────────────────────────── */}
      <div style={{
        display: "flex",
        gap: "0.375rem",
        overflowX: "auto",
        borderBottom: "1.5px solid var(--border)",
        paddingBottom: "0.75rem",
        scrollbarWidth: "none"
      }}>
        {[
          { id: "overview", label: "Overview", Icon: ChartBar },
          { id: "users", label: "Users", Icon: Users },
          { id: "txns", label: "Transactions", Icon: Receipt },
          { id: "keys", label: "Setup Keys", Icon: Key },
          { id: "settings", label: "Settings", Icon: Gear }
        ].map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                backgroundColor: active ? "var(--color-primary)" : "var(--bg-surface)",
                color: active ? "white" : "var(--text-secondary)",
                padding: "0.5rem 0.875rem",
                borderRadius: "14px",
                fontWeight: 700,
                fontSize: "0.8125rem",
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                cursor: "pointer",
                border: active ? "1.5px solid var(--color-primary)" : "1.5px solid var(--border)",
                transition: "all var(--duration-fast) var(--ease-smooth)",
              }}
              className="squishy"
            >
              <tab.Icon size={16} weight={active ? "bold" : "regular"} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── Content Views ──────────────────────────────────────────── */}

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Card Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
            {[
              { label: "Total Registered Users", value: users.length, Icon: Users, color: "var(--color-primary)" },
              { label: "Total Balance Pool", value: `₦${totalWithdrawable.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`, Icon: Coins, color: "var(--color-success)" },
              { label: "Successful Transactions", value: successfulTxns.length, Icon: ShieldCheck, color: "var(--color-info)" },
              { label: "Total Processed Volume", value: `₦${totalVolume.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`, Icon: ChartBar, color: "var(--color-warning)" }
            ].map((card, idx) => (
              <div key={idx} className="card" style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)" }}>{card.label}</span>
                  <card.Icon size={18} weight="duotone" style={{ color: card.color }} />
                </div>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 900, margin: 0 }}>{card.value}</h3>
              </div>
            ))}
          </div>

          {/* Quick Actions Shortcuts */}
          <div className="card" style={{ padding: "1.25rem" }}>
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 800, marginBottom: "0.875rem" }}>Quick Actions Dashboard</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
              <button
                onClick={() => setActiveTab("users")}
                className="btn btn-secondary"
                style={{ fontSize: "0.8125rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <Users size={16} />
                Manage Balances
              </button>
              <button
                onClick={() => setActiveTab("keys")}
                className="btn btn-secondary"
                style={{ fontSize: "0.8125rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <Key size={16} />
                Credentials Setup
              </button>
            </div>
          </div>

          {/* Recent logs */}
          <div className="card" style={{ padding: "1.25rem" }}>
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 800, marginBottom: "0.75rem" }}>Recent Transactions Log</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {txns.slice(0, 5).map(item => (
                <div key={item.id} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid var(--border)",
                  paddingBottom: "0.5rem"
                }}>
                  <div>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 700, textTransform: "uppercase" }}>{item.service_type}</span>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0 }}>{item.phone} • {item.status}</p>
                  </div>
                  <span style={{ fontWeight: 800, fontSize: "0.875rem" }}>₦{Number(item.amount).toLocaleString()}</span>
                </div>
              ))}
              <button
                onClick={() => setActiveTab("txns")}
                className="btn btn-link"
                style={{ alignSelf: "center", fontSize: "0.8125rem", display: "flex", alignItems: "center", gap: "4px" }}
              >
                View all transactions
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === "users" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Admin Promoter Form */}
          <div className="card" style={{ padding: "1.25rem" }}>
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 800, marginBottom: "0.75rem" }}>Promote User to Admin</h3>
            <form onSubmit={handlePromoteUser} style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="email"
                placeholder="Enter user email address"
                value={promotedEmail}
                onChange={(e) => setPromotedEmail(e.target.value)}
                required
                className="input"
                style={{ flex: 1, padding: "0.625rem 0.875rem", fontSize: "0.8125rem", height: "40px" }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: "0 1rem", fontSize: "0.8125rem", height: "40px" }} disabled={isPending}>
                Promote
              </button>
            </form>
          </div>

          {/* Users List with Search */}
          <div className="card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.875rem" }}>
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 800, margin: 0 }}>Users List</h3>
              <input
                type="text"
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="input"
                style={{ width: "160px", padding: "0.5rem 0.75rem", fontSize: "0.75rem", height: "32px", borderRadius: "10px" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {filteredUsers.map(user => {
                const balance = Number(user.wallets?.[0]?.balance_withdrawable || 0);
                const isEditing = editingUserId === user.id;

                return (
                  <div key={user.id} style={{
                    border: "1px solid var(--border)",
                    borderRadius: "14px",
                    padding: "0.875rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    backgroundColor: "var(--bg-elevated)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <div>
                        <strong style={{ fontSize: "0.875rem", color: "var(--text-primary)" }}>{user.full_name || "No Name"}</strong>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0 }}>{user.email}</p>
                      </div>
                      <span style={{
                        fontSize: "0.6875rem",
                        fontWeight: 800,
                        backgroundColor: user.role === "admin" ? "var(--color-primary-light)" : "var(--border)",
                        color: user.role === "admin" ? "var(--color-primary)" : "var(--text-secondary)",
                        padding: "2px 8px",
                        borderRadius: "8px"
                      }}>
                        {user.role?.toUpperCase() || "USER"}
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                      <div>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Withdrawable:</span>
                        <strong style={{ fontSize: "0.875rem", color: "var(--color-success)", marginLeft: "4px" }}>
                          ₦{balance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                        </strong>
                      </div>

                      {!isEditing ? (
                        <button
                          onClick={() => handleUpdateBalance(user.id, balance)}
                          className="btn btn-secondary"
                          style={{ padding: "4px 10px", fontSize: "0.75rem", height: "26px", borderRadius: "8px" }}
                        >
                          Edit Balance
                        </button>
                      ) : (
                        <div style={{ display: "flex", gap: "4px" }}>
                          <input
                            type="number"
                            value={editingUserBalance}
                            onChange={(e) => setEditingUserBalance(e.target.value)}
                            className="input"
                            style={{ width: "90px", padding: "2px 6px", fontSize: "0.75rem", height: "26px", borderRadius: "8px" }}
                          />
                          <button
                            onClick={() => saveUserBalance(user.id)}
                            className="btn btn-primary"
                            style={{ padding: "0 8px", fontSize: "0.75rem", height: "26px", borderRadius: "8px" }}
                            disabled={isPending}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingUserId(null)}
                            className="btn btn-secondary"
                            style={{ padding: "0 8px", fontSize: "0.75rem", height: "26px", borderRadius: "8px" }}
                          >
                            X
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TRANSACTIONS TAB */}
      {activeTab === "txns" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.875rem" }}>
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 800, margin: 0 }}>Transaction History</h3>
              <input
                type="text"
                placeholder="Search txns..."
                value={txnSearch}
                onChange={(e) => setTxnSearch(e.target.value)}
                className="input"
                style={{ width: "160px", padding: "0.5rem 0.75rem", fontSize: "0.75rem", height: "32px", borderRadius: "10px" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {filteredTxns.map(txn => {
                const isPendingTx = txn.status === "pending";
                
                return (
                  <div key={txn.id} style={{
                    border: "1px solid var(--border)",
                    borderRadius: "14px",
                    padding: "0.875rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    backgroundColor: "var(--bg-elevated)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <strong style={{ fontSize: "0.875rem" }}>{txn.service_type?.toUpperCase()}</strong>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0 }}>{txn.phone}</p>
                      </div>
                      <span style={{
                        fontSize: "0.75rem",
                        fontWeight: 800,
                        color: txn.status === "success" ? "var(--color-success)" : txn.status === "failed" ? "var(--color-danger)" : "var(--color-warning)"
                      }}>
                        {txn.status?.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                      <strong>Ref:</strong> {txn.reference || txn.id}
                      <p style={{ margin: "2px 0 0 0" }}><strong>Desc:</strong> {txn.description}</p>
                      <p style={{ margin: "2px 0 0 0" }}><strong>Amount:</strong> ₦{Number(txn.amount).toLocaleString()}</p>
                    </div>

                    {isPendingTx && (
                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "4px" }}>
                        <button
                          onClick={() => handleUpdateTxnStatus(txn.id, "success")}
                          className="btn btn-secondary"
                          style={{ flex: 1, padding: "4px 0", fontSize: "0.75rem", height: "26px", borderRadius: "8px", color: "var(--color-success)" }}
                          disabled={isPending}
                        >
                          Mark Success
                        </button>
                        <button
                          onClick={() => handleUpdateTxnStatus(txn.id, "failed")}
                          className="btn btn-secondary"
                          style={{ flex: 1, padding: "4px 0", fontSize: "0.75rem", height: "26px", borderRadius: "8px", color: "var(--color-danger)" }}
                          disabled={isPending}
                        >
                          Mark Failed
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SETUP KEYS TAB */}
      {activeTab === "keys" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Connection Settings */}
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

          {/* Provider Credentials Form */}
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

          {/* Active keys status table */}
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
      )}

      {/* PLATFORM SETTINGS TAB */}
      {activeTab === "settings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
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
      )}
    </div>
  );
}

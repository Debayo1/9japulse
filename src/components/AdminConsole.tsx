"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Users,
  Receipt,
  Key,
  Gear,
  ChartBar,
  Package,
} from "@phosphor-icons/react";
import {
  updatePlatformSettingsAdminAction,
  updateUserBalanceAdminAction,
  updateTransactionStatusAdminAction,
  promoteUserToAdmin,
  updateUserVirtualAccountAdminAction,
} from "@/lib/admin";
import {
  syncGSubzDataPlansAdmin,
  testDatabaseConnection,
  runFullMigration,
  saveProviderKeyAdmin,
} from "@/lib/dbAdmin";
import OverviewTab from "@/components/admin/OverviewTab";
import UsersTab from "@/components/admin/UsersTab";
import TransactionsTab from "@/components/admin/TransactionsTab";
import KeysTab from "@/components/admin/KeysTab";
import SettingsTab from "@/components/admin/SettingsTab";
import ProductsTab from "@/components/admin/ProductsTab";

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
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "txns" | "keys" | "settings" | "products">("overview");
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

  // Editing state for virtual accounts
  const [managingVaUserId, setManagingVaUserId] = useState<string | null>(null);
  const [vaAccountNumber, setVaAccountNumber] = useState("");
  const [vaBankName, setVaBankName] = useState("Palmpay");
  const [vaBankCode, setVaBankCode] = useState("palmpay");
  const [vaLookupNumber, setVaLookupNumber] = useState("");
  const [vaCreateNew, setVaCreateNew] = useState(false);

  // Keys forms states
  const [dbUrl, setDbUrl] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("gsubz");
  const [keyName, setKeyName] = useState("api_key");
  const [keyValue, setKeyValue] = useState("");

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

  const handleSaveVirtualAccount = (userId: string) => {
    startTransition(async () => {
      try {
        const res = await updateUserVirtualAccountAdminAction(userId, {
          account_number: vaAccountNumber || undefined,
          bank_name: vaBankName || undefined,
          bank_code: vaBankCode || undefined,
          account_to_lookup: vaLookupNumber || undefined,
          create_new: vaCreateNew || undefined,
        });

        if (!res.success) throw new Error(res.message);

        // Update local state
        setUsers(prev => prev.map(u => {
          if (u.id === userId) {
            return { ...u, virtual_accounts: [res.data] };
          }
          return u;
        }));

        toast.success(res.message);
        setManagingVaUserId(null);
        // Reset form
        setVaAccountNumber("");
        setVaBankName("Palmpay");
        setVaBankCode("palmpay");
        setVaLookupNumber("");
        setVaCreateNew(false);
      } catch (err: any) {
        toast.error(err.message || "Failed to sync virtual account");
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* ─── Modern Tab bar ────────────────────────────────────────── */}
      <div role="tablist" style={{
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
          { id: "settings", label: "Settings", Icon: Gear },
          { id: "products", label: "Products", Icon: Package as any },
        ].map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={active}
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

      {activeTab === "overview" && (
        <OverviewTab users={users} txns={txns} onNavigate={(tab) => setActiveTab(tab as any)} />
      )}

      {activeTab === "users" && (
        <UsersTab
          users={users}
          isPending={isPending}
          userSearch={userSearch}
          setUserSearch={setUserSearch}
          editingUserId={editingUserId}
          setEditingUserId={setEditingUserId}
          editingUserBalance={editingUserBalance}
          setEditingUserBalance={setEditingUserBalance}
          promotedEmail={promotedEmail}
          setPromotedEmail={setPromotedEmail}
          managingVaUserId={managingVaUserId}
          setManagingVaUserId={setManagingVaUserId}
          vaAccountNumber={vaAccountNumber}
          setVaAccountNumber={setVaAccountNumber}
          vaBankName={vaBankName}
          setVaBankName={setVaBankName}
          vaBankCode={vaBankCode}
          setVaBankCode={setVaBankCode}
          vaLookupNumber={vaLookupNumber}
          setVaLookupNumber={setVaLookupNumber}
          vaCreateNew={vaCreateNew}
          setVaCreateNew={setVaCreateNew}
          handleUpdateBalance={handleUpdateBalance}
          saveUserBalance={saveUserBalance}
          handleSaveVirtualAccount={handleSaveVirtualAccount}
          handlePromoteUser={handlePromoteUser}
        />
      )}

      {activeTab === "txns" && (
        <TransactionsTab
          txns={txns}
          txnSearch={txnSearch}
          setTxnSearch={setTxnSearch}
          isPending={isPending}
          handleUpdateTxnStatus={handleUpdateTxnStatus}
        />
      )}

      {activeTab === "keys" && (
        <KeysTab
          keys={keys}
          dbUrl={dbUrl}
          setDbUrl={setDbUrl}
          selectedProvider={selectedProvider}
          setSelectedProvider={setSelectedProvider}
          keyName={keyName}
          setKeyName={setKeyName}
          keyValue={keyValue}
          setKeyValue={setKeyValue}
          isPending={isPending}
          handleSaveProviderKey={handleSaveProviderKey}
          handleTestDatabase={handleTestDatabase}
          handleRunDbMigrations={handleRunDbMigrations}
          handleSyncPlans={handleSyncPlans}
        />
      )}

      {activeTab === "settings" && (
        <SettingsTab
          settings={settings}
          setSettings={setSettings}
          isPending={isPending}
          handleUpdateSettings={handleUpdateSettings}
        />
      )}

      {activeTab === "products" && <ProductsTab />}
    </div>
  );
}

"use client";

import {
  Users,
  Coins,
  ShieldCheck,
  ChartBar,
  ArrowRight,
  Key,
} from "@phosphor-icons/react/dist/ssr";

interface OverviewTabProps {
  users: any[];
  txns: any[];
  onNavigate: (tab: string) => void;
}

export default function OverviewTab({ users, txns, onNavigate }: OverviewTabProps) {
  const totalWithdrawable = users.reduce(
    (acc, curr) => acc + Number(curr.wallets?.[0]?.balance_withdrawable || 0),
    0
  );
  const successfulTxns = txns.filter((t) => t.status === "success");
  const totalVolume = successfulTxns.reduce(
    (acc, curr) => acc + Number(curr.amount || 0),
    0
  );

  return (
    <div role="tabpanel" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
        {[
          { label: "Total Registered Users", value: users.length, Icon: Users, color: "var(--color-primary)" },
          { label: "Total Balance Pool", value: `₦${totalWithdrawable.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`, Icon: Coins, color: "var(--color-success)" },
          { label: "Successful Transactions", value: successfulTxns.length, Icon: ShieldCheck, color: "var(--color-info)" },
          { label: "Total Processed Volume", value: `₦${totalVolume.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`, Icon: ChartBar, color: "var(--color-warning)" },
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

      <div className="card" style={{ padding: "1.25rem" }}>
        <h3 style={{ fontSize: "0.9375rem", fontWeight: 800, marginBottom: "0.875rem" }}>Quick Actions Dashboard</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
          <button
            onClick={() => onNavigate("users")}
            className="btn btn-secondary"
            style={{ fontSize: "0.8125rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
          >
            <Users size={16} />
            Manage Balances
          </button>
          <button
            onClick={() => onNavigate("keys")}
            className="btn btn-secondary"
            style={{ fontSize: "0.8125rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
          >
            <Key size={16} />
            Credentials Setup
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: "1.25rem" }}>
        <h3 style={{ fontSize: "0.9375rem", fontWeight: 800, marginBottom: "0.75rem" }}>Recent Transactions Log</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {txns.slice(0, 5).map((item) => (
            <div key={item.id} style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid var(--border)",
              paddingBottom: "0.5rem",
            }}>
              <div>
                <span style={{ fontSize: "0.8125rem", fontWeight: 700, textTransform: "uppercase" }}>{item.service_type}</span>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0 }}>{item.phone} • {item.status}</p>
              </div>
              <span style={{ fontWeight: 800, fontSize: "0.875rem" }}>₦{Number(item.amount).toLocaleString()}</span>
            </div>
          ))}
          <button
            onClick={() => onNavigate("txns")}
            className="btn btn-link"
            style={{ alignSelf: "center", fontSize: "0.8125rem", display: "flex", alignItems: "center", gap: "4px" }}
          >
            View all transactions
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

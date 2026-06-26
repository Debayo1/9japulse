"use client";

import { useState } from "react";
import { MagnifyingGlass, CalendarBlank, Funnel, TrendUp } from "@phosphor-icons/react";
import { HistoryList, getServiceConfig } from "./HistoryList";
import type { Database } from "@/lib/database.types";
import { toast } from "sonner";

type Transaction = Database["public"]["Tables"]["transactions"]["Row"];

interface HistoryClientProps {
  initialTransactions: Transaction[];
  totalCount: number;
  walletId: string;
}

export default function HistoryClient({ initialTransactions, totalCount, walletId }: HistoryClientProps) {
  const [activeTab, setActiveTab] = useState<"tx" | "insights">("tx");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTransactions = initialTransactions.filter((t) => {
    if (searchQuery.trim() === "") return true;
    const query = searchQuery.toLowerCase();
    const config = getServiceConfig(t.service_type, t.direction);
    return (
      config.label.toLowerCase().includes(query) ||
      (t.description && t.description.toLowerCase().includes(query)) ||
      t.amount.toString().includes(query)
    );
  });

  const renderInsights = () => {
    // calculate total debit spent
    const totalSpent = initialTransactions
      .filter((t) => t.direction === "debit")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // calculate category outflows
    const categoryTotals: Record<string, number> = {};
    initialTransactions
      .filter((t) => t.direction === "debit")
      .forEach((t) => {
        const cat = t.service_type;
        categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(t.amount);
      });

    const categories = Object.entries(categoryTotals)
      .map(([cat, amount]) => {
        const config = getServiceConfig(cat, "debit");
        return {
          categoryName: config.label,
          color: config.color,
          amount,
          percentage: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return (
      <div className="card animate-fade-in" style={{ padding: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
          <TrendUp size={20} color="var(--color-primary)" />
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Outflow Breakdown
          </h3>
        </div>

        <div style={{ marginBottom: "1.75rem" }}>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", margin: 0 }}>Total Spent</p>
          <p style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", margin: "4px 0 0 0", fontVariantNumeric: "tabular-nums" }}>
            ₦{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>

        {categories.length === 0 ? (
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", textAlign: "center", padding: "2rem 0" }}>
            No spending recorded yet to analyze.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {categories.map((c) => (
              <div key={c.categoryName}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "6px" }}>
                  <span style={{ color: "var(--text-primary)" }}>{c.categoryName}</span>
                  <span style={{ color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>
                    ₦{c.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({c.percentage}%)
                  </span>
                </div>
                <div style={{ width: "100%", height: "8px", borderRadius: "4px", backgroundColor: "var(--bg-surface)", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${c.percentage}%`,
                      height: "100%",
                      borderRadius: "4px",
                      backgroundColor: c.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Title + Icons Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.25rem",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
          History
        </h1>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => toast.info("Filter by date coming soon")}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "1.5px solid var(--border)",
              background: "var(--bg-elevated)",
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            aria-label="Filter calendar"
          >
            <CalendarBlank size={18} weight="regular" />
          </button>
          <button
            onClick={() => toast.info("Filters coming soon")}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "1.5px solid var(--border)",
              background: "var(--bg-elevated)",
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            aria-label="Filter transactions"
          >
            <Funnel size={18} weight="regular" />
          </button>
        </div>
      </div>

      {/* Segmented Control Tabs */}
      <div
        style={{
          display: "flex",
          background: "var(--bg-surface)",
          borderRadius: "24px",
          padding: "4px",
          marginBottom: "1.25rem",
        }}
      >
        <button
          onClick={() => setActiveTab("tx")}
          style={{
            flex: 1,
            textAlign: "center",
            border: "none",
            borderRadius: "20px",
            padding: "8px 12px",
            fontSize: "0.875rem",
            fontWeight: activeTab === "tx" ? 700 : 500,
            background: activeTab === "tx" ? "var(--bg-elevated)" : "transparent",
            color: activeTab === "tx" ? "var(--text-primary)" : "var(--text-secondary)",
            boxShadow: activeTab === "tx" ? "0 4px 10px rgba(0, 0, 0, 0.05)" : "none",
            cursor: "pointer",
            transition: "all var(--duration-fast) var(--ease-smooth)",
          }}
        >
          Transactions
        </button>
        <button
          onClick={() => setActiveTab("insights")}
          style={{
            flex: 1,
            textAlign: "center",
            border: "none",
            borderRadius: "20px",
            padding: "8px 12px",
            fontSize: "0.875rem",
            fontWeight: activeTab === "insights" ? 700 : 500,
            background: activeTab === "insights" ? "var(--bg-elevated)" : "transparent",
            color: activeTab === "insights" ? "var(--text-primary)" : "var(--text-secondary)",
            boxShadow: activeTab === "insights" ? "0 4px 10px rgba(0, 0, 0, 0.05)" : "none",
            cursor: "pointer",
            transition: "all var(--duration-fast) var(--ease-smooth)",
          }}
        >
          Spending Insights
        </button>
      </div>

      {activeTab === "tx" ? (
        <>
          {/* Search bar */}
          <div style={{ position: "relative", marginBottom: "1.25rem" }}>
            <MagnifyingGlass
              size={18}
              weight="regular"
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
            <input
              type="text"
              placeholder="Search transactions"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px 10px 42px",
                borderRadius: "14px",
                border: "1.5px solid var(--border)",
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
                fontSize: "0.875rem",
                outline: "none",
                transition: "border-color var(--duration-fast), box-shadow var(--duration-fast)",
              }}
              className="search-input"
            />
          </div>

          <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "1rem", fontWeight: 600 }}>
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""}
          </p>

          <HistoryList transactions={filteredTransactions} walletId={walletId} />
        </>
      ) : (
        renderInsights()
      )}

      <style>{`
        .search-input:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px hsl(243 75% 58% / 0.06);
        }
      `}</style>
    </div>
  );
}

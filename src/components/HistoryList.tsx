"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import {
  DeviceMobile,
  Globe,
  Lightning,
  Television,
  PlusCircle,
  ArrowBendDownLeft,
  Gift,
  ArrowCircleDown,
  ArrowCircleUp,
  ClockCounterClockwise,
  Question,
} from "@phosphor-icons/react";
import type { Database } from "@/lib/database.types";
import { SkeletonList } from "./SkeletonLoader";

type Transaction = Database["public"]["Tables"]["transactions"]["Row"];

// Service types that represent credits (money coming in)
const CREDIT_TYPES = new Set([
  "wallet_funding",
  "cashback",
  "referral_bonus",
  "contest_payout",
  "refund",
  "deposit",
  "reward",
]);

function isCredit(txn: Transaction): boolean {
  return txn.direction === "credit" || CREDIT_TYPES.has(txn.service_type);
}

const fmtAmount = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(n);

const fmtTime = (iso: string) =>
  new Intl.DateTimeFormat("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));

export const getServiceConfig = (serviceType: string, direction: string) => {
  switch (serviceType) {
    case "airtime":
      return { label: "Airtime Recharge", color: "#EF4444", Icon: DeviceMobile };
    case "data":
      return { label: "Data Bundle", color: "#7C3AED", Icon: Globe };
    case "electricity":
      return { label: "Electricity Bill", color: "#F59E0B", Icon: Lightning };
    case "cable":
    case "cable_tv":
      return { label: "Cable TV Payment", color: "#10B981", Icon: Television };
    case "wallet_funding":
    case "deposit":
      return { label: "Wallet Funding", color: "#06B6D4", Icon: PlusCircle };
    case "refund":
      return { label: "Refund", color: "#0D9488", Icon: ArrowBendDownLeft };
    case "referral_bonus":
    case "cashback":
    case "reward":
      return { label: "Reward Cashback", color: "#EF4444", Icon: Gift };
    default:
      return direction === "credit"
        ? { label: "Money Received", color: "#10B981", Icon: ArrowCircleDown }
        : { label: "Money Sent", color: "#6B7280", Icon: ArrowCircleUp };
  }
};

interface TransactionRowProps {
  txn: Transaction;
}

export function TransactionRow({ txn }: TransactionRowProps) {
  const credit = isCredit(txn);
  const config = getServiceConfig(txn.service_type, txn.direction);
  const Icon = config.Icon ?? Question;

  return (
    <Link
      href={`/history/${txn.id}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.875rem",
        padding: "0.875rem 0.5rem",
        textDecoration: "none",
        color: "inherit",
        borderRadius: "12px",
        transition: "all var(--duration-fast)",
      }}
      className="history-row"
    >
      {/* Dynamic Overlapping Avatar Icon Group */}
      <div style={{ position: "relative", width: "40px", height: "40px", flexShrink: 0 }}>
        {/* Soft-colored squircle icon circle */}
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor: `${config.color}15`, // ~8% opacity
            color: config.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={20} weight="duotone" />
        </div>

        {/* Small absolute indicator badge in the corner */}
        <div
          style={{
            position: "absolute",
            bottom: "-2px",
            right: "-2px",
            width: "15px",
            height: "15px",
            borderRadius: "50%",
            backgroundColor: credit ? "var(--color-success)" : "var(--color-danger)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            border: "1.5px solid var(--bg-elevated)",
          }}
        >
          {credit ? (
            <ArrowCircleDown size={10} weight="fill" color="#ffffff" />
          ) : (
            <ArrowCircleUp size={10} weight="fill" color="#ffffff" />
          )}
        </div>
      </div>

      {/* Center Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {config.label}
        </p>
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px", marginBottom: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {txn.description || (credit ? "System Deposit" : "Service Purchase")}
        </p>
      </div>

      {/* Right Details (Amount + Time) */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p style={{
          fontSize: "0.875rem",
          fontVariantNumeric: "tabular-nums",
          fontWeight: 700,
          color: "var(--text-primary)",
          margin: 0,
        }}>
          {fmtAmount(txn.amount)}
        </p>
        <p style={{ fontSize: "0.7188rem", color: "var(--text-muted)", marginTop: "2px", marginBottom: 0 }}>
          {fmtTime(txn.created_at)}
        </p>
      </div>
    </Link>
  );
}

// ─── Group heading ─────────────────────────────────────────────────────────────
interface GroupHeadingProps { label: string; }

export function GroupHeading({ label }: GroupHeadingProps) {
  return (
    <p
      style={{
        fontSize: "0.8125rem",
        fontWeight: 700,
        color: "var(--text-primary)",
        margin: "1.25rem 0 0.5rem 0.25rem",
      }}
    >
      {label}
    </p>
  );
}

// ─── Full history list with date grouping ─────────────────────────────────────
interface HistoryListProps {
  transactions: Transaction[];
  walletId: string;
}

function groupByDate(txns: Transaction[]) {
  const groups = new Map<string, Transaction[]>();

  for (const txn of txns) {
    const d = new Date(txn.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    let label: string;
    if (d.toDateString() === today.toDateString()) {
      label = "Today";
    } else if (d.toDateString() === yesterday.toDateString()) {
      label = "Yesterday";
    } else {
      label = new Intl.DateTimeFormat("en-NG", {
        day: "numeric",
        month: "long",
        year: "numeric"
      }).format(d);
    }

    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(txn);
  }

  return groups;
}

export function HistoryList({ transactions, walletId }: HistoryListProps) {
  const [mounted, setMounted] = useState(false);
  const [list, setList] = useState(transactions);

  useEffect(() => {
    setMounted(true);
    setList(transactions);
  }, [transactions]);

  useEffect(() => {
    const channel = supabaseBrowser
      .channel(`transactions-channel-${walletId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERT, UPDATE, DELETE
          schema: "public",
          table: "transactions",
          filter: `wallet_id=eq.${walletId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setList((prev) => {
              if (prev.some((t) => t.id === payload.new.id)) return prev;
              return [payload.new as Transaction, ...prev];
            });
          } else if (payload.eventType === "UPDATE") {
            setList((prev) =>
              prev.map((t) => (t.id === payload.new.id ? (payload.new as Transaction) : t))
            );
          } else if (payload.eventType === "DELETE") {
            setList((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, [walletId]);

  if (!mounted) {
    return <SkeletonList rows={transactions.length || 3} />;
  }

  if (list.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--bg-surface)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
          <ClockCounterClockwise size={32} weight="thin" style={{ opacity: 0.4, color: "var(--text-secondary)" }} />
        </div>
        <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>No transactions yet</h3>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.375rem", maxWidth: "240px", lineHeight: 1.4 }}>
          Your recent payments, transfers, and funding history will appear here.
        </p>
      </div>
    );
  }

  const grouped = groupByDate(list);

  return (
    <div className="animate-fade-in">
      {[...grouped.entries()].map(([label, txns]) => (
        <section key={label} style={{ marginBottom: "0.75rem" }}>
          <GroupHeading label={label} />
          {/* Card containing all transactions for the day */}
          <div className="card" style={{ padding: "0.25rem 0.75rem" }}>
            {txns.map((txn, index) => (
              <div key={txn.id}>
                {index > 0 && <div style={{ height: "1px", backgroundColor: "var(--border)", opacity: 0.5 }} />}
                <TransactionRow txn={txn} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

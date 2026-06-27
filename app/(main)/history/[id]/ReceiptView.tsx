"use client";

import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { ShareNetwork, House, ArrowLeft, CheckCircle, WarningCircle, Clock } from "@phosphor-icons/react";
import Header from "@/components/Header";

const NETWORK_LABELS: Record<string, string> = {
  mtn: "MTN",
  airtel: "Airtel",
  glo: "Glo",
  "9mobile": "9mobile",
};

interface ReceiptViewProps {
  txn: {
    id: string;
    service_type: string;
    amount: number;
    direction: string;
    status: string;
    description: string | null;
    reference: string | null;
    created_at: string;
  };
}

export default function ReceiptView({ txn }: ReceiptViewProps) {
  const amountNum = Number(txn.amount);
  const credit = txn.direction === "credit";
  const desc = txn.description || "";

  // Helper to extract network operator
  let network = "";
  if (desc.toLowerCase().includes("mtn")) network = "mtn";
  else if (desc.toLowerCase().includes("airtel")) network = "airtel";
  else if (desc.toLowerCase().includes("glo")) network = "glo";
  else if (desc.toLowerCase().includes("9mobile")) network = "9mobile";

  const networkLabel = NETWORK_LABELS[network] || "";

  const formattedAmount = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amountNum);

  const dateStr = new Date(txn.created_at).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const handleShare = () => {
    const text = `9jaPulse Transaction Receipt\n-------------------------\nType: ${txn.service_type.toUpperCase()}\nAmount: ${formattedAmount}\nDirection: ${txn.direction.toUpperCase()}\nStatus: ${txn.status.toUpperCase()}\nDescription: ${desc}\nRef: ${txn.reference || txn.id}\nDate: ${dateStr}\nThank you for using 9jaPulse!`;
    
    if (navigator.share) {
      navigator.share({
        title: "Transaction Receipt",
        text: text,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Receipt details copied to clipboard!");
    }
  };

  const getStatusColor = () => {
    if (txn.status === "success") return "var(--color-success)";
    if (txn.status === "failed") return "var(--color-danger)";
    return "var(--color-warning)";
  };

  const renderStatusIcon = () => {
    if (txn.status === "success") {
      return <CheckCircle size={52} weight="fill" color="var(--color-success)" />;
    }
    if (txn.status === "failed") {
      return <WarningCircle size={52} weight="fill" color="var(--color-danger)" />;
    }
    return <Clock size={52} weight="fill" color="var(--color-warning)" />;
  };

  return (
    <div className="page" style={{ paddingBottom: "2rem" }}>
      <Header title="Receipt Details" showBack={true} />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "1rem" }}>
        {/* Status Icon */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            backgroundColor: `${getStatusColor()}12`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1rem",
          }}
        >
          {renderStatusIcon()}
        </div>

        <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 0.25rem 0", textAlign: "center" }}>
          Transaction {txn.status === "success" ? "Successful" : txn.status === "failed" ? "Failed" : "Pending"}
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: "0 0 1.5rem 0", textAlign: "center" }}>
          {txn.status === "success" ? "This transaction was processed successfully." : txn.status === "failed" ? "This transaction has failed." : "This transaction is currently pending."}
        </p>

        {/* Large Amount */}
        <div style={{ fontSize: "2.25rem", fontWeight: 900, letterSpacing: "-0.03em", color: "var(--text-primary)", marginBottom: "1.5rem", fontVariantNumeric: "tabular-nums" }}>
          {credit ? "+" : "−"}{formattedAmount}
        </div>

        {/* Details Card */}
        <div className="card" style={{ width: "100%", padding: "1.25rem", marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 1rem 0" }}>
            Payment Summary
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Service Type</span>
              <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)", textTransform: "capitalize" }}>
                {txn.service_type}
              </span>
            </div>

            {network && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Network</span>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {["mtn", "airtel", "glo", "9mobile"].includes(network) ? (
                    <Image
                      src={`/networks/${network}.png`}
                      alt={networkLabel}
                      width={18}
                      height={18}
                      style={{ borderRadius: "50%", objectFit: "cover" }}
                    />
                  ) : null}
                  <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    {networkLabel}
                  </span>
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "2px" }}>Description</span>
              <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)", textAlign: "right", maxWidth: "60%" }}>
                {desc}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Flow Direction</span>
              <span style={{ fontSize: "0.875rem", fontWeight: 700, color: credit ? "var(--color-success)" : "var(--text-primary)", textTransform: "capitalize" }}>
                {txn.direction}
              </span>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "0.25rem 0" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Reference ID</span>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-muted)", fontFamily: "monospace" }}>
                {txn.reference || txn.id}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Date & Time</span>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                {dateStr}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Transaction Status</span>
              <span style={{ fontSize: "0.8125rem", fontWeight: 800, color: getStatusColor(), textTransform: "uppercase" }}>
                {txn.status}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <button
            onClick={handleShare}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              width: "100%",
              height: "48px",
              borderRadius: "14px",
              border: "1.5px solid var(--border)",
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
              fontWeight: 700,
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            <ShareNetwork size={18} />
            Share Receipt
          </button>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Link
              href="/home"
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                height: "48px",
                borderRadius: "14px",
                background: "var(--color-primary)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.9rem",
                textDecoration: "none",
                textAlign: "center",
              }}
            >
              <House size={18} />
              Home
            </Link>

            <Link
              href="/history"
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                height: "48px",
                borderRadius: "14px",
                border: "1.5px solid var(--border)",
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                fontWeight: 700,
                fontSize: "0.9rem",
                textDecoration: "none",
                textAlign: "center",
              }}
            >
              <ArrowLeft size={18} />
              Back
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Copy, CheckCircle } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";

interface DepositClientProps {
  account: {
    bank_name: string;
    account_number: string;
    account_name: string;
    account_type: string;
    status: string;
  } | null;
  displayName: string;
  depositFee: number;
}

export default function DepositClient({ account, displayName, depositFee }: DepositClientProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(`${label} copied!`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <>
      {/* ─── Fee Badge ─── */}
      <div
        className="card animate-fade-in"
        style={{
          padding: "0.875rem 1.25rem",
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: "hsl(38 92% 50% / 0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--color-warning)",
            }}
          >
            <span style={{ fontWeight: 800, fontSize: "0.875rem" }}>%</span>
          </div>
          <div>
            <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", margin: 0 }}>
              Deposit fee
            </p>
            <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-primary)", margin: "2px 0 0 0" }}>
              ₦{depositFee.toLocaleString()}
            </p>
          </div>
        </div>
        <span className="badge badge-warning" style={{ fontSize: "0.625rem" }}>Per transaction</span>
      </div>

      {/* ─── Virtual Account Card ─── */}
      <div className="card animate-slide-up" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
        <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 0.5rem 0" }}>
          Your virtual account
        </p>
        <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 1rem 0" }}>
          {displayName}
        </p>

        {account ? (
          <>
            {/* Large Account Number */}
            <div
              style={{
                background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
                borderRadius: "14px",
                padding: "1.25rem",
                textAlign: "center",
                marginBottom: "1rem",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{
                position: "absolute", inset: 0, opacity: 0.06,
                backgroundImage: "radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 50%, #fff 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }} />
              <p style={{ fontSize: "0.625rem", color: "hsla(0,0%,100%,0.6)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 0.25rem 0" }}>
                Account Number
              </p>
              <p style={{
                fontSize: "1.75rem", fontWeight: 800, color: "#fff", margin: 0,
                letterSpacing: "0.08em", fontVariantNumeric: "tabular-nums",
              }}>
                {account.account_number}
              </p>
            </div>

            {/* Account Details Grid */}
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {[
                { label: "Bank", value: account.bank_name ?? "Palmpay" },
                { label: "Account Name", value: account.account_name },
                { label: "Type", value: account.account_type ?? "Static" },
                { label: "Status", value: account.status },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.625rem 0.75rem",
                    background: "var(--bg-surface)",
                    borderRadius: "10px",
                  }}
                >
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                    {item.label}
                  </span>
                  <span style={{
                    fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-primary)",
                    display: "flex", alignItems: "center", gap: "0.375rem",
                  }}>
                    {item.label === "Account Number" ? (
                      <>
                        {item.value}
                        <button
                          type="button"
                          onClick={() => copyToClipboard(item.value, "Account number")}
                          className="squishy"
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-primary)", display: "flex", padding: "2px" }}
                          aria-label="Copy account number"
                        >
                          {copied ? <CheckCircle size={16} weight="fill" style={{ color: "var(--color-success)" }} /> : <Copy size={16} />}
                        </button>
                      </>
                    ) : item.label === "Status" ? (
                      <span className={`badge ${account.status === "active" ? "badge-success" : "badge-warning"}`}>
                        {account.status}
                      </span>
                    ) : (
                      item.value
                    )}
                  </span>
                </div>
              ))}
            </div>

            {/* Copy all details button */}
            <button
              type="button"
              onClick={() => copyToClipboard(
                `${account.bank_name ?? "Palmpay"}\n${account.account_number}\n${account.account_name}`,
                "Account details"
              )}
              className="btn btn-primary btn-full"
              style={{ height: "44px", marginTop: "1rem" }}
            >
              <Copy size={16} />
              Copy Account Details
            </button>
          </>
        ) : (
          <div className="card" style={{ padding: "1.5rem", textAlign: "center", background: "var(--bg-surface)" }}>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", margin: 0 }}>
              Virtual account is being prepared. Refresh shortly.
            </p>
          </div>
        )}
      </div>

      {/* ─── Funding Notes ─── */}
      <div className="card" style={{ padding: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-primary)", flexShrink: 0 }} />
          <h2 style={{ fontSize: "0.8125rem", fontWeight: 700, margin: 0 }}>Funding Notes</h2>
        </div>
        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
          Transfer funds directly to your personalized account details above. Your wallet balance will be funded automatically within minutes once the transfer is confirmed.
        </p>
      </div>
    </>
  );
}

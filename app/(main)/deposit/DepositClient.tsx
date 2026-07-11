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
      <div className="card animate-fade-in" style={{
        padding: "0.875rem 1.25rem", marginBottom: "1rem",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: "hsl(38 92% 50% / 0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--color-warning)",
          }}>
            <span style={{ fontWeight: 800, fontSize: "0.875rem" }}>%</span>
          </div>
          <div>
            <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", margin: 0 }}>
              Deposit fee
            </p>
            <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-primary)", margin: "2px 0 0 0" }}>
              ₦{Number(depositFee ?? 0).toLocaleString()}
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
            {/* ─── Premium Account Number Card ─── */}
            <div style={{
              background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
              borderRadius: "16px", padding: "1.5rem", marginBottom: "1rem",
              position: "relative", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)",
            }}>
              <div style={{
                position: "absolute", inset: 0,
                background: "radial-gradient(circle at 30% 40%, rgba(255,255,255,0.06) 0%, transparent 60%), radial-gradient(circle at 70% 60%, rgba(255,255,255,0.04) 0%, transparent 40%)",
              }} />
              <div style={{
                position: "absolute", top: "-50%", right: "-20%", width: "200%", height: "200%",
                background: "radial-gradient(circle, rgba(79,172,254,0.08) 0%, transparent 60%)",
              }} />

              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                  marginBottom: "1.25rem",
                }}>
                  <div>
                    <p style={{
                      fontSize: "0.625rem", color: "hsla(0,0%,100%,0.5)", fontWeight: 600,
                      textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 0.25rem 0",
                    }}>
                      Account Number
                    </p>
                    <p style={{
                      fontSize: "1.5rem", fontWeight: 800, color: "#fff", margin: 0,
                      letterSpacing: "0.06em", fontVariantNumeric: "tabular-nums",
                    }}>
                      {account.account_number}
                    </p>
                  </div>
                  <button type="button" onClick={() => copyToClipboard(account.account_number, "Account number")}
                    className="squishy"
                    style={{
                      background: "hsla(0,0%,100%,0.1)", border: "none", borderRadius: "10px",
                      cursor: "pointer", padding: "0.5rem", display: "flex",
                      backdropFilter: "blur(8px)",
                      transition: "all var(--duration-fast) var(--ease-smooth)",
                    }}
                    aria-label="Copy account number"
                  >
                    {copied
                      ? <CheckCircle size={20} weight="fill" style={{ color: "var(--color-success)", animation: "pop 0.3s ease" }} />
                      : <Copy size={20} weight="duotone" style={{ color: "#fff" }} />
                    }
                  </button>
                </div>

                <div style={{
                  display: "flex", gap: "0.75rem", flexWrap: "wrap",
                  padding: "0.75rem", borderRadius: "10px",
                  background: "hsla(0,0%,100%,0.06)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                }}>
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <p style={{ fontSize: "0.5625rem", color: "hsla(0,0%,100%,0.5)", fontWeight: 600, textTransform: "uppercase", margin: "0 0 2px 0" }}>
                      Bank
                    </p>
                    <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#fff", margin: 0 }}>
                      {account.bank_name ?? "Palmpay"}
                    </p>
                  </div>
                  <div style={{ flex: 2, minWidth: 140 }}>
                    <p style={{ fontSize: "0.5625rem", color: "hsla(0,0%,100%,0.5)", fontWeight: 600, textTransform: "uppercase", margin: "0 0 2px 0" }}>
                      Account Name
                    </p>
                    <p style={{
                      fontSize: "0.8125rem", fontWeight: 700, color: "#fff", margin: 0,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {account.account_name}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Account Details Grid ─── */}
            <div style={{ display: "grid", gap: "0.5rem" }}>
              {[
                { label: "Bank", value: account.bank_name ?? "Palmpay" },
                { label: "Account Name", value: account.account_name },
                { label: "Type", value: account.account_type ?? "Static" },
                { label: "Status", value: account.status },
              ].map((item) => (
                <div key={item.label} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "0.75rem 1rem",
                  background: "rgba(255,255,255,0.03)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.05)",
                  transition: "background var(--duration-fast) var(--ease-smooth)",
                }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                    {item.label}
                  </span>
                  <span style={{
                    fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-primary)",
                    display: "flex", alignItems: "center", gap: "0.375rem",
                  }}>
                    {item.label === "Status" ? (
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

            {/* ─── Copy All Button ─── */}
            <button type="button"
              onClick={() => copyToClipboard(
                `${account.bank_name ?? "Palmpay"}\n${account.account_number}\n${account.account_name}`,
                "Account details"
              )}
              className="btn btn-primary btn-full squishy"
              style={{
                height: "46px", marginTop: "1rem", borderRadius: "12px", fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                transition: "all var(--duration-fast) var(--ease-smooth)",
              }}
            >
              <Copy size={16} weight="duotone" />
              Copy Account Details
            </button>
          </>
        ) : (
          <div style={{
            padding: "2rem 1.5rem", textAlign: "center",
            background: "rgba(255,255,255,0.03)", borderRadius: "14px",
            border: "1px solid rgba(255,255,255,0.05)",
          }}>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", margin: 0 }}>
              Virtual account is being prepared. Refresh shortly.
            </p>
          </div>
        )}
      </div>

      {/* ─── Funding Notes ─── */}
      <div className="card animate-fade-in" style={{
        padding: "1.25rem",
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-primary)", flexShrink: 0 }} />
          <h2 style={{ fontSize: "0.8125rem", fontWeight: 700, margin: 0 }}>Funding Notes</h2>
        </div>
        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
          Transfer funds directly to your personalized account details above. Your wallet balance will be funded automatically within minutes once the transfer is confirmed.
        </p>
      </div>

      <style>{`
        @keyframes pop {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}

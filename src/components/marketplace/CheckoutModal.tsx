"use client";

import { X, Backspace } from "@phosphor-icons/react";

interface CheckoutProduct {
  title: string;
  price: number;
}

interface CheckoutModalProps {
  product: CheckoutProduct;
  pin: string;
  submittingPurchase: boolean;
  open: boolean;
  onClose: () => void;
  onNumberInput: (num: string) => void;
  onBackspace: () => void;
}

export default function CheckoutModal({
  product,
  pin,
  submittingPurchase,
  open,
  onClose,
  onNumberInput,
  onBackspace
}: CheckoutModalProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Confirm order with PIN"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 110,
        backgroundColor: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "end",
        justifyContent: "center",
        animation: "fade-in 0.2s"
      }}
    >
      <div style={{
        backgroundColor: "var(--bg-elevated)",
        borderTopLeftRadius: "24px",
        borderTopRightRadius: "24px",
        border: "1px solid var(--border)",
        borderBottom: "none",
        width: "100%",
        maxWidth: "460px",
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1.25rem",
        animation: "slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
      }}>
        <div style={{ display: "flex", width: "100%", justifyContent: "space-between" }}>
          <strong>Confirm Order</strong>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
            aria-label="Close checkout"
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>PAYING FOR</span>
          <h3 style={{ fontSize: "0.875rem", fontWeight: 800, margin: "2px 0 6px 0", color: "var(--text-primary)" }}>{product.title}</h3>
          <div style={{ fontSize: "1.625rem", fontWeight: 900, color: "var(--color-primary)" }}>
            ₦{product.price.toLocaleString()}
          </div>
        </div>

        <div style={{ display: "flex", gap: "1.25rem", margin: "0.5rem 0" }} aria-label="PIN entry indicators">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              style={{
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                border: "2px solid var(--color-primary)",
                backgroundColor: pin.length > idx ? "var(--color-primary)" : "transparent",
                boxShadow: pin.length > idx ? "0 0 8px var(--color-primary)" : "none",
                transform: pin.length > idx ? "scale(1.15)" : "scale(1)",
                transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)"
              }}
            />
          ))}
        </div>

        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          Enter your 4-digit transaction PIN to complete purchase.
        </span>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "14px",
          width: "100%",
          maxWidth: "280px",
          marginTop: "0.5rem"
        }}>
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              onClick={() => onNumberInput(num)}
              disabled={submittingPurchase}
              className="pin-btn"
              style={{
                height: "50px",
                borderRadius: "14px",
                border: "1px solid var(--border)",
                backgroundColor: "var(--bg-base)",
                color: "var(--text-primary)",
                fontSize: "1.125rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "background var(--duration-fast)"
              }}
            >
              {num}
            </button>
          ))}
          <div />
          <button
            onClick={() => onNumberInput("0")}
            disabled={submittingPurchase}
            className="pin-btn"
            style={{
              height: "50px",
              borderRadius: "14px",
              border: "1px solid var(--border)",
              backgroundColor: "var(--bg-base)",
              color: "var(--text-primary)",
              fontSize: "1.125rem",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            0
          </button>
          <button
            onClick={onBackspace}
            disabled={submittingPurchase}
            style={{
              height: "50px",
              borderRadius: "14px",
              border: "none",
              backgroundColor: "transparent",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer"
            }}
            aria-label="Backspace"
          >
            <Backspace size={20} />
          </button>
        </div>

        {submittingPurchase && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            <div className="spinner" style={{ width: "14px", height: "14px" }} />
            Authorizing wallet transaction ledger...
          </div>
        )}
      </div>
    </div>
  );
}

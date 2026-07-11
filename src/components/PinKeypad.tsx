"use client";

import { useState, useEffect } from "react";
import { Backspace } from "@phosphor-icons/react";

interface PinKeypadProps {
  show: boolean;
  title?: string;
  onPinComplete: (pin: string) => void;
  onClose: () => void;
  loading?: boolean;
  error?: string;
  loadingTitle?: string;
  loadingSubtitle?: string;
  children?: React.ReactNode;
}

export default function PinKeypad({
  show,
  title = "Enter Transaction PIN",
  onPinComplete,
  onClose,
  loading = false,
  error,
  loadingTitle = "Verifying PIN...",
  loadingSubtitle = "Processing your transaction",
  children,
}: PinKeypadProps) {
  const [pin, setPin] = useState("");

  useEffect(() => {
    if (!show) setPin("");
  }, [show]);

  const handleDigit = (digit: string) => {
    if (loading || pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    if (newPin.length === 4) {
      onPinComplete(newPin);
    }
  };

  const handleBackspace = () => {
    if (!loading) setPin((prev) => prev.slice(0, -1));
  };

  const handleCancel = () => {
    if (!loading) {
      setPin("");
      onClose();
    }
  };

  if (!show) return null;

  const dotStyle = (filled: boolean): React.CSSProperties => ({
    width: 14,
    height: 14,
    borderRadius: "50%",
    border: "2px solid var(--border)",
    backgroundColor: filled ? "var(--color-primary)" : "transparent",
    transform: filled ? "scale(1.15)" : "scale(1)",
    transition: "all var(--duration-fast) var(--ease-smooth)",
    boxShadow: filled ? "0 0 8px var(--color-primary)" : "none",
  });

  const keyStyle: React.CSSProperties = {
    width: 60,
    height: 60,
    borderRadius: "50%",
    border: "1.5px solid var(--border)",
    background: "var(--bg-elevated)",
    color: "var(--text-primary)",
    fontSize: "1.25rem",
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Enter PIN"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "var(--bg-base)",
        zIndex: 110,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--text-secondary)",
          }}
        >
          SECURITY VERIFICATION
        </span>
        <h2
          style={{
            fontSize: "1.375rem",
            fontWeight: 800,
            margin: "0.25rem 0 0.5rem 0",
          }}
        >
          {title}
        </h2>
        {children && (
          <p
            style={{
              fontSize: "0.8125rem",
              color: "var(--text-secondary)",
              margin: 0,
            }}
          >
            {children}
          </p>
        )}
      </div>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "3rem" }}>
        {[0, 1, 2, 3].map((idx) => (
          <div key={idx} style={dotStyle(pin.length > idx)} />
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1.25rem 1.5rem",
          maxWidth: 260,
          width: "100%",
          marginBottom: "2rem",
        }}
      >
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => handleDigit(num)}
            className="squishy"
            style={keyStyle}
            disabled={loading}
          >
            {num}
          </button>
        ))}

        <button
          type="button"
          onClick={handleCancel}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            fontSize: "0.8125rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
          disabled={loading}
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={() => handleDigit("0")}
          className="squishy"
          style={keyStyle}
          disabled={loading}
        >
          0
        </button>

        <button
          type="button"
          onClick={handleBackspace}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
          disabled={loading}
        >
          <Backspace size={22} weight="duotone" />
        </button>
      </div>

      {loading && (
        <div style={{
          position: "absolute", inset: 0,
          backgroundColor: "var(--bg-base)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          zIndex: 999, gap: "1rem",
          animation: "fadeIn 0.15s ease",
        }}>
          <div style={{
            width: 48, height: 48,
            border: "4px solid var(--border)",
            borderTopColor: "var(--color-primary)",
            borderRadius: "50%",
            animation: "pin-spin 0.7s linear infinite",
          }} />
          <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            {loadingTitle}
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", margin: 0 }}>
            {loadingSubtitle}
          </p>
        </div>
      )}

      {error && (
        <div
          style={{
            color: "var(--color-danger, #ef4444)",
            fontSize: "0.8125rem",
            marginTop: "0.5rem",
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}

      <style>{`
        @keyframes pin-spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}

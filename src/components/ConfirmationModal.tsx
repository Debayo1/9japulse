"use client";

interface ConfirmationModalProps {
  show: boolean;
  title?: string;
  children: React.ReactNode;
  total: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmationModal({
  show,
  title = "Confirm Transaction",
  children,
  total,
  loading = false,
  onConfirm,
  onClose,
}: ConfirmationModalProps) {
  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Confirm purchase"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 100,
      }}
      onClick={() => !loading && onClose()}
    >
      <div
        className="glass animate-slide-up"
        aria-label="Confirm purchase"
        style={{
          width: "100%",
          maxWidth: "480px",
          backgroundColor: "var(--bg-elevated)",
          borderTopLeftRadius: "28px",
          borderTopRightRadius: "28px",
          border: "1.5px solid var(--border)",
          borderBottom: "none",
          padding: "1.75rem 1.5rem",
          boxShadow: "0 -8px 32px rgba(0,0,0,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "1.5rem" }}>
          <div
            style={{
              width: "48px",
              height: "4px",
              backgroundColor: "var(--text-muted)",
              borderRadius: "2px",
              opacity: 0.3,
              marginBottom: "1rem",
            }}
          />
          <h2 style={{ fontSize: "1.125rem", fontWeight: 800 }}>{title}</h2>
        </div>

        <div
          className="glass-sm"
          style={{
            padding: "1rem",
            border: "1.5px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            marginBottom: "1.5rem",
          }}
        >
          {children}
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1.5px solid var(--border)", paddingTop: "0.75rem" }}>
            <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", fontWeight: 600 }}>Amount Due</span>
            <span style={{ fontSize: "0.9375rem", fontWeight: 900, color: "var(--color-primary)" }}>₦{total}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ flex: 1, height: "48px" }}
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ flex: 2, height: "48px" }}
            onClick={onConfirm}
            disabled={loading}
          >
            Confirm & Pay
          </button>
        </div>
      </div>
    </div>
  );
}

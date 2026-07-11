"use client";

import { X } from "@phosphor-icons/react";
import { toast } from "sonner";

interface ShippingDetails {
  name: string;
  phone: string;
  email: string;
  address: string;
}

interface ShippingProduct {
  title: string;
  price: number;
  image_url: string;
}

interface ShippingModalProps {
  product: ShippingProduct;
  shippingDetails: ShippingDetails;
  open: boolean;
  onClose: () => void;
  onUpdate: (details: ShippingDetails) => void;
  onSubmit: () => void;
}

export default function ShippingModal({
  product,
  shippingDetails,
  open,
  onClose,
  onUpdate,
  onSubmit
}: ShippingModalProps) {
  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingDetails.name || !shippingDetails.phone || !shippingDetails.email || !shippingDetails.address) {
      toast.error("Please fill in all shipping details!");
      return;
    }
    onSubmit();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Shipping information form"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        backgroundColor: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "end",
        justifyContent: "center",
        animation: "fade-in 0.25s"
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: "var(--bg-elevated)",
          borderTopLeftRadius: "24px",
          borderTopRightRadius: "24px",
          border: "1px solid var(--border)",
          borderBottom: "none",
          width: "100%",
          maxWidth: "460px",
          padding: "1.5rem",
          maxHeight: "90vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "1.125rem",
          animation: "slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-primary)", fontWeight: 800 }}>
              Delivery Details
            </span>
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 800, margin: "2px 0 0 0" }}>Shipping Information</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
            aria-label="Close shipping form"
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", padding: "8px", backgroundColor: "var(--bg-base)", borderRadius: "10px" }}>
          <img
            src={product.image_url}
            alt={product.title}
            style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "6px" }}
          />
          <div>
            <h4 style={{ fontSize: "0.75rem", fontWeight: 800, margin: 0 }}>{product.title}</h4>
            <p style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--color-primary)", margin: 0 }}>₦{product.price.toLocaleString()}</p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--text-secondary)" }}>Recipient Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. John Obi"
              value={shippingDetails.name}
              onChange={(e) => onUpdate({ ...shippingDetails, name: e.target.value })}
              style={{
                height: "42px",
                borderRadius: "10px",
                backgroundColor: "var(--bg-base)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                padding: "0 12px",
                fontSize: "0.8125rem",
                outline: "none"
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--text-secondary)" }}>Phone Number</label>
            <input
              type="tel"
              required
              placeholder="e.g. 08012345678"
              value={shippingDetails.phone}
              onChange={(e) => onUpdate({ ...shippingDetails, phone: e.target.value })}
              style={{
                height: "42px",
                borderRadius: "10px",
                backgroundColor: "var(--bg-base)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                padding: "0 12px",
                fontSize: "0.8125rem",
                outline: "none"
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--text-secondary)" }}>Email Address</label>
            <input
              type="email"
              required
              placeholder="e.g. john@example.com"
              value={shippingDetails.email}
              onChange={(e) => onUpdate({ ...shippingDetails, email: e.target.value })}
              style={{
                height: "42px",
                borderRadius: "10px",
                backgroundColor: "var(--bg-base)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                padding: "0 12px",
                fontSize: "0.8125rem",
                outline: "none"
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--text-secondary)" }}>Delivery Address</label>
            <textarea
              required
              rows={3}
              placeholder="Street Address, City, State"
              value={shippingDetails.address}
              onChange={(e) => onUpdate({ ...shippingDetails, address: e.target.value })}
              style={{
                borderRadius: "10px",
                backgroundColor: "var(--bg-base)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                padding: "10px 12px",
                fontSize: "0.8125rem",
                outline: "none",
                resize: "none",
                fontFamily: "inherit"
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ height: "44px", width: "100%", fontWeight: 800, marginTop: "0.5rem" }}
        >
          Verify & Pay ₦{product.price.toLocaleString()}
        </button>
      </form>
    </div>
  );
}

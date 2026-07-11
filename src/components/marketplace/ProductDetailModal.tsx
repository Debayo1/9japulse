"use client";

import { X, Star, ShoppingCart } from "@phosphor-icons/react";

interface ProductDetailProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  rating: number;
  stock_quantity: number;
  images?: string[];
}

interface ProductDetailModalProps {
  product: ProductDetailProduct;
  quantity: number;
  activeImgIndex: number;
  onClose: () => void;
  onSetQuantity: (q: number) => void;
  onSetActiveImgIndex: (idx: number) => void;
  onCheckout: () => void;
}

export default function ProductDetailModal({
  product,
  quantity,
  activeImgIndex,
  onClose,
  onSetQuantity,
  onSetActiveImgIndex,
  onCheckout
}: ProductDetailModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Product details for ${product.title}`}
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
      <div style={{
        backgroundColor: "var(--bg-elevated)",
        borderTopLeftRadius: "24px",
        borderTopRightRadius: "24px",
        border: "1px solid var(--border)",
        borderBottom: "none",
        width: "100%",
        maxWidth: "460px",
        padding: "1.5rem",
        maxHeight: "85vh",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        animation: "slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
          <span style={{ fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-primary)", fontWeight: 800 }}>
            {product.category} Catalog
          </span>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
            aria-label="Close product details"
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ position: "relative", borderRadius: "16px", overflow: "hidden", aspectRatio: "16/10", width: "100%", backgroundColor: "var(--bg-base)" }}>
          <img
            src={product.images && product.images.length > 0 ? product.images[activeImgIndex] : (product.image_url ?? undefined)}
            alt={product.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        {product.images && product.images.length > 1 && (
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "2px", scrollbarWidth: "none" }} role="tablist" aria-label="Product images">
            {product.images.map((imgUrl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSetActiveImgIndex(idx)}
                role="tab"
                aria-selected={activeImgIndex === idx}
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "8px",
                  overflow: "hidden",
                  border: `2px solid ${activeImgIndex === idx ? "var(--color-primary)" : "var(--border)"}`,
                  padding: 0,
                  backgroundColor: "var(--bg-base)",
                  cursor: "pointer",
                  transition: "border var(--duration-fast)"
                }}
              >
                <img src={imgUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </button>
            ))}
          </div>
        )}

        <div>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 800, margin: 0 }}>{product.title}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
            <Star size={14} weight="fill" color="#F59E0B" />
            <span style={{ fontSize: "0.75rem", fontWeight: 700 }}>{product.rating} Rating</span>
            <span style={{ color: "var(--text-muted)" }}>•</span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Stock: {product.stock_quantity} available</span>
          </div>
        </div>

        <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.4, margin: 0 }}>
          {product.description}
        </p>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Unit Price</span>
              <p style={{ fontSize: "1.125rem", fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>
                ₦{product.price.toLocaleString()}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0px", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
              <button
                onClick={() => onSetQuantity(Math.max(1, quantity - 1))}
                style={{ width: 36, height: 36, border: "none", background: "var(--bg-elevated)", color: "var(--text-primary)", fontSize: "1.125rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                aria-label="Decrease quantity"
              >−</button>
              <span style={{ width: 32, textAlign: "center", fontWeight: 800, fontSize: "0.9375rem" }}>{quantity}</span>
              <button
                onClick={() => onSetQuantity(Math.min(product.stock_quantity, quantity + 1))}
                style={{ width: 36, height: 36, border: "none", background: "var(--bg-elevated)", color: "var(--color-primary)", fontSize: "1.125rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                aria-label="Increase quantity"
              >+</button>
            </div>
          </div>

          <button
            onClick={onCheckout}
            className="btn btn-primary"
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", height: "46px", fontSize: "0.9375rem" }}
          >
            <ShoppingCart size={18} weight="bold" />
            Order {quantity > 1 ? `${quantity}x` : ""} — ₦{(product.price * quantity).toLocaleString()}
          </button>
        </div>
      </div>
    </div>
  );
}

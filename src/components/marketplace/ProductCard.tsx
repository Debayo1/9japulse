"use client";

import { Star, ShoppingCart } from "@phosphor-icons/react";

interface ProductCardProduct {
  id: string;
  title: string;
  price: number;
  image_url: string;
  category: string;
  rating: number;
}

interface ProductCardProps {
  product: ProductCardProduct;
  onViewDetails: () => void;
  onBuyNow: () => void;
}

export default function ProductCard({ product, onViewDetails, onBuyNow }: ProductCardProps) {
  return (
    <div
      className="card product-card"
      onClick={onViewDetails}
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "8px",
        cursor: "pointer",
        position: "relative",
        height: "100%",
        justifyContent: "space-between"
      }}
    >
      <div style={{ position: "relative", borderRadius: "10px", overflow: "hidden", aspectRatio: "1/1", width: "100%", backgroundColor: "var(--bg-base)" }}>
        <img
          src={product.image_url}
          alt={product.title}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <span style={{
          position: "absolute",
          bottom: "6px",
          left: "6px",
          fontSize: "0.625rem",
          fontWeight: 800,
          backgroundColor: "rgba(15,23,42,0.85)",
          color: "white",
          padding: "3px 6px",
          borderRadius: "4px"
        }}>
          {product.category}
        </span>
      </div>

      <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "4px", flexGrow: 1 }}>
        <h3 style={{
          fontSize: "0.75rem",
          fontWeight: 800,
          margin: 0,
          color: "var(--text-primary)",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          lineHeight: "1.3"
        }}>
          {product.title}
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
          <Star size={10} weight="fill" color="#F59E0B" />
          <span style={{ fontSize: "0.625rem", fontWeight: 700, color: "var(--text-secondary)" }}>{product.rating}</span>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", borderTop: "1px solid var(--border)", paddingTop: "6px" }}>
        <strong style={{ fontSize: "0.875rem", color: "var(--color-primary)" }}>
          ₦{product.price.toLocaleString()}
        </strong>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBuyNow();
          }}
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-primary) 10%, transparent)",
            border: "none",
            borderRadius: "8px",
            width: "28px",
            height: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-primary)",
            cursor: "pointer"
          }}
          aria-label={`Buy ${product.title}`}
        >
          <ShoppingCart size={14} weight="fill" />
        </button>
      </div>
    </div>
  );
}

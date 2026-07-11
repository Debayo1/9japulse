"use client";

import { Package, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export default function ProductsTab() {
  return (
    <div role="tabpanel" className="card animate-fade-in" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: "rgba(99, 102, 241, 0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-primary)",
        }}>
          <Package size={22} weight="fill" />
        </div>
        <div>
          <h3 style={{ fontSize: "1rem", fontWeight: 800, margin: 0 }}>Product Catalog Management</h3>
          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0 }}>Manage the store items, update pricing, descriptions, and stock quantities.</p>
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginTop: "0.5rem" }}>
        <Link href="/admin/products" className="btn btn-primary" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", height: "42px", padding: "0 1.5rem", fontSize: "0.875rem", fontWeight: 700 }}>
          Open Product Manager
          <ArrowRight size={16} weight="bold" />
        </Link>
      </div>
    </div>
  );
}

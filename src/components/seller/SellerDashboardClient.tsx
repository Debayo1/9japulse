"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import {
  Storefront,
  Package,
  ShoppingBag,
  CurrencyDollar,
  Wallet,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle,
  Warning,
  TrendUp,
  ArrowUpRight,
} from "@phosphor-icons/react";
import Header from "@/components/Header";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { applyAsSeller, getSellerStats } from "@/lib/seller";
import type { SellerRow } from "@/lib/database.types";

interface Props {
  user: { id: string; email: string; full_name: string };
  seller: SellerRow | null;
}

interface Stats {
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  availableBalance: number;
  heldBalance: number;
}

export default function SellerDashboardClient({ user, seller }: Props) {
  const router = useRouter();
  const [sellerState, setSellerState] = useState(seller);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);

  const [formName, setFormName] = useState(user.full_name || "");
  const [formDesc, setFormDesc] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabaseBrowser.auth.getSession();
      if (!data.session) router.replace("/login");
    }
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (sellerState?.id && sellerState.status === "approved") {
      loadStats(sellerState.id);
    }
  }, [sellerState]);

  async function loadStats(sellerId: string) {
    try {
      const s = await getSellerStats(sellerId);
      setStats(s);
    } catch {
      setStats({
        totalProducts: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
        availableBalance: 0,
        heldBalance: 0,
      });
    }
  }

  async function handleApply() {
    if (!formName.trim()) {
      toast.error("Display name is required");
      return;
    }
    setSubmitting(true);
    try {
      const result = await applyAsSeller(user.id, formName, formDesc, formPhone, user.email);
      if (result.success) {
        toast.success(result.message);
        setSellerState({
          id: "pending",
          user_id: user.id,
          display_name: formName,
          description: formDesc || null,
          phone: formPhone || null,
          email: user.email,
          avatar_url: null,
          status: "pending",
          approved_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  }

  if (sellerState && sellerState.status === "pending") {
    return (
      <div className="page" style={{ paddingBottom: "2rem" }}>
        <Header title="Seller Dashboard" showBack={true} />
        <div className="card animate-fade-in" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--color-warning), hsl(38 92% 50%))",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1.25rem", boxShadow: "0 0 32px hsl(38 92% 50% / 0.2)",
          }}>
            <Clock size={36} weight="fill" color="#fff" />
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "0.5rem" }}>
            Application Under Review
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
            Your seller application has been submitted and is being reviewed by our team. You will be notified once approved.
          </p>
          <div className="badge badge-warning" style={{ fontSize: "0.75rem", padding: "6px 16px" }}>
            Pending Review
          </div>
        </div>
      </div>
    );
  }

  if (!sellerState) {
    return (
      <div className="page" style={{ paddingBottom: "2rem" }}>
        <Header title="Become a Seller" showBack={true} />
        <div className="card animate-fade-in" style={{ marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1rem" }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Storefront size={24} weight="fill" color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>Start Selling on 9jaPulse</h2>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
                List your products and reach thousands of buyers
              </p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {["No listing fees — keep your profits", "Secure escrow payments", "Automated order management", "Real-time analytics dashboard"].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 0" }}>
                <CheckCircle size={16} weight="fill" color="var(--color-success)" />
                <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card animate-fade-in" style={{ animationDelay: "80ms" }}>
          <h3 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "1rem" }}>Seller Application</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            <div>
              <label className="input-label">Display Name *</label>
              <input
                className="input"
                placeholder="Your shop name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div>
              <label className="input-label">Description</label>
              <input
                className="input"
                placeholder="What do you sell?"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
              />
            </div>
            <div>
              <label className="input-label">Phone Number</label>
              <input
                className="input"
                placeholder="0801 234 5678"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary btn-full"
              onClick={handleApply}
              disabled={submitting || !formName.trim()}
              style={{ height: "48px", fontSize: "0.875rem" }}
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const fmt = (n: number) => "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="page" style={{ paddingBottom: "2rem" }}>
      <Header title="Seller Dashboard" showBack={true} />

      <div className="glass-sm animate-fade-in" style={{
        padding: "1rem 1.125rem", marginBottom: "1.25rem",
        background: "linear-gradient(135deg, hsl(152 55% 96%), hsl(165 55% 94%))",
        border: "none",
      }}>
        <div className="dark" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
              Available Balance
            </p>
            <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", margin: "4px 0 0 0", letterSpacing: "-0.02em" }}>
              {fmt(stats?.availableBalance ?? 0)}
            </p>
          </div>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: "var(--color-success)", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>
            <Wallet size={22} weight="fill" color="#fff" />
          </div>
        </div>
        <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.75rem" }}>
          <div>
            <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", margin: 0 }}>Held</p>
            <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-primary)", margin: "2px 0 0 0" }}>{fmt(stats?.heldBalance ?? 0)}</p>
          </div>
          <div>
            <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", margin: 0 }}>Total Earned</p>
            <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-primary)", margin: "2px 0 0 0" }}>{fmt(stats?.totalRevenue ?? 0)}</p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
        {[
          { label: "Products", value: stats?.totalProducts ?? 0, icon: Package, color: "var(--color-primary)" },
          { label: "Orders", value: stats?.totalOrders ?? 0, icon: ShoppingBag, color: "var(--color-accent)" },
          { label: "Pending", value: stats?.pendingOrders ?? 0, icon: Clock, color: "var(--color-warning)" },
          { label: "Revenue", value: fmt(stats?.totalRevenue ?? 0), icon: TrendUp, color: "var(--color-success)" },
        ].map((item, i) => (
          <div
            key={item.label}
            className="card animate-fade-in"
            style={{ padding: "0.875rem", animationDelay: `${i * 50}ms` }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: `color-mix(in srgb, ${item.color} 12%, transparent)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: item.color,
              }}>
                <item.icon size={16} weight="fill" />
              </div>
            </div>
            <p style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
              {item.value}
            </p>
            <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>{item.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <Link
          href="/seller/products"
          className="btn btn-primary"
          style={{ flex: 1, height: "46px", fontSize: "0.8125rem", textDecoration: "none" }}
        >
          <Plus size={16} weight="bold" />
          Manage Products
        </Link>
        <Link
          href="/seller/orders"
          className="btn btn-secondary"
          style={{ flex: 1, height: "46px", fontSize: "0.8125rem", textDecoration: "none" }}
        >
          <ShoppingBag size={16} weight="bold" />
          View Orders
        </Link>
      </div>

      <div className="card animate-fade-in" style={{ animationDelay: "150ms" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ fontSize: "0.875rem", fontWeight: 700, margin: 0 }}>Quick Links</h3>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {[
            { href: "/seller/products", label: "Add New Product", icon: Package },
            { href: "/seller/orders", label: "All Orders", icon: ShoppingBag },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem",
                borderRadius: "12px", textDecoration: "none",
                background: "var(--bg-surface)", border: "1px solid var(--border)",
                transition: "all var(--duration-fast) var(--ease-smooth)",
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: "color-mix(in srgb, var(--color-primary) 10%, transparent)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--color-primary)",
              }}>
                <item.icon size={16} weight="fill" />
              </div>
              <span style={{ flex: 1, fontWeight: 600, fontSize: "0.8125rem", color: "var(--text-primary)" }}>
                {item.label}
              </span>
              <ArrowRight size={14} color="var(--text-muted)" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

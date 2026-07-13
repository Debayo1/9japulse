"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ShoppingBag,
  Clock,
  CheckCircle,
  SealCheck,
  Timer,
  User,
  CreditCard,
} from "@phosphor-icons/react";
import Header from "@/components/Header";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { getSellerByUserId, getSellerOrders } from "@/lib/seller";
import type { SellerRow, SellerOrderRow } from "@/lib/database.types";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: "Pending", color: "var(--text-muted)", bg: "var(--bg-surface)", icon: Clock },
  funded: { label: "Funded", color: "var(--color-primary)", bg: "hsl(227 70% 55% / 0.1)", icon: CreditCard },
  confirmed: { label: "Confirmed", color: "var(--color-warning)", bg: "hsl(38 92% 50% / 0.1)", icon: SealCheck },
  released: { label: "Released", color: "var(--color-success)", bg: "hsl(152 60% 42% / 0.1)", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "var(--color-danger)", bg: "hsl(0 72% 51% / 0.1)", icon: Clock },
};

export default function SellerOrdersPage() {
  const router = useRouter();
  const [seller, setSeller] = useState<SellerRow | null>(null);
  const [orders, setOrders] = useState<SellerOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function init() {
      const { data } = await supabaseBrowser.auth.getSession();
      if (!data.session) {
        router.replace("/login");
        return;
      }
      const s = await getSellerByUserId(data.session.user.id);
      if (!s || s.status !== "approved") {
        router.replace("/seller");
        return;
      }
      setSeller(s);
      await loadOrders(s.id);
    }
    init();
  }, [router]);

  async function loadOrders(sellerId: string) {
    try {
      const o = await getSellerOrders(sellerId);
      setOrders(o);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const fmt = (n: number) => "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 0 });

  function getAutoReleaseInfo(order: SellerOrderRow) {
    if (order.status === "released" || order.status === "cancelled") return null;
    const created = new Date(order.created_at);
    const releaseDate = new Date(created);
    releaseDate.setDate(releaseDate.getDate() + 3);
    const now = new Date();
    const diff = releaseDate.getTime() - now.getTime();
    if (diff <= 0) return "Auto-release eligible";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `Auto-release in ${days}d ${hours}h`;
  }

  const FILTERS = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "funded", label: "Funded" },
    { key: "confirmed", label: "Confirmed" },
    { key: "released", label: "Released" },
  ];

  if (loading) {
    return (
      <div className="page" style={{ paddingBottom: "2rem" }}>
        <Header title="My Orders" showBack={true} />
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="card" style={{ height: "120px", opacity: 0.5, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="spinner" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ paddingBottom: "2rem" }}>
      <Header title="My Orders" showBack={true} />

      <div style={{
        display: "flex", gap: "6px", overflowX: "auto", marginBottom: "1.25rem",
        paddingBottom: "4px", scrollbarWidth: "none",
      }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              flexShrink: 0, padding: "6px 14px", borderRadius: 99,
              fontSize: "0.75rem", fontWeight: 700, cursor: "pointer",
              border: `1px solid ${filter === f.key ? "var(--color-primary)" : "var(--border)"}`,
              background: filter === f.key ? "var(--color-primary)" : "var(--bg-elevated)",
              color: filter === f.key ? "#fff" : "var(--text-secondary)",
              transition: "all var(--duration-fast)",
            }}
          >
            {f.label}
            {f.key !== "all" && (
              <span style={{ marginLeft: "4px", opacity: 0.7 }}>
                {orders.filter((o) => f.key === "all" || o.status === f.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: "color-mix(in srgb, var(--color-primary) 10%, transparent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1rem", color: "var(--color-primary)",
          }}>
            <ShoppingBag size={28} weight="duotone" />
          </div>
          <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.375rem" }}>No orders found</h3>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
            {filter === "all" ? "Orders will appear here when buyers purchase your products" : `No ${filter} orders`}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {filtered.map((order, i) => {
            const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const StatusIcon = status.icon;
            const releaseInfo = getAutoReleaseInfo(order);
            return (
              <div
                key={order.id}
                className="card animate-fade-in"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: status.bg, display: "flex",
                      alignItems: "center", justifyContent: "center",
                      color: status.color,
                    }}>
                      <StatusIcon size={18} weight="fill" />
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: "0.8125rem", margin: 0 }}>
                        {order.product_title}
                      </p>
                      <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                        Ref: {order.reference?.slice(0, 12)}...
                      </p>
                    </div>
                  </div>
                  <span style={{
                    padding: "3px 10px", borderRadius: 99, fontSize: "0.625rem",
                    fontWeight: 700, color: status.color, background: status.bg,
                    textTransform: "uppercase", letterSpacing: "0.04em",
                  }}>
                    {status.label}
                  </span>
                </div>

                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "0.5rem", padding: "0.625rem",
                  background: "var(--bg-surface)", borderRadius: 10,
                  marginBottom: releaseInfo ? "0.5rem" : 0,
                }}>
                  <div>
                    <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", margin: 0, textTransform: "uppercase" }}>Amount</p>
                    <p style={{ fontSize: "0.8125rem", fontWeight: 700, margin: "2px 0 0 0" }}>{fmt(order.amount)}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", margin: 0, textTransform: "uppercase" }}>Commission</p>
                    <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-danger)", margin: "2px 0 0 0" }}>-{fmt(order.commission)}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", margin: 0, textTransform: "uppercase" }}>Payout</p>
                    <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-success)", margin: "2px 0 0 0" }}>{fmt(order.seller_payout)}</p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "0.5rem" }}>
                  <User size={12} color="var(--text-muted)" />
                  <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", margin: 0 }}>
                    {order.shipping_name} · {order.shipping_phone}
                  </p>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", margin: 0 }}>
                    Qty: {order.quantity}
                  </p>
                  {releaseInfo && (
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Timer size={11} color="var(--color-warning)" />
                      <p style={{ fontSize: "0.625rem", color: "var(--color-warning)", margin: 0, fontWeight: 600 }}>
                        {releaseInfo}
                      </p>
                    </div>
                  )}
                </div>

                <div style={{
                  marginTop: "0.625rem", paddingTop: "0.5rem",
                  borderTop: "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", margin: 0 }}>
                    {new Date(order.created_at).toLocaleDateString("en-NG", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </p>
                  <div style={{
                    display: "flex", gap: "2px",
                  }}>
                    {["pending", "funded", "confirmed", "released"].map((step, idx) => {
                      const stepIdx = ["pending", "funded", "confirmed", "released"].indexOf(order.status);
                      const isComplete = idx <= stepIdx;
                      return (
                        <div
                          key={step}
                          style={{
                            width: 20, height: 3, borderRadius: 2,
                            background: isComplete ? "var(--color-success)" : "var(--border)",
                            transition: "background var(--duration-fast)",
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

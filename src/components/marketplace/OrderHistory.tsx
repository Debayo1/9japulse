"use client";

import { Truck, ShoppingCart, X, User, Phone, Envelope, MapPin } from "@phosphor-icons/react";

interface MarketplaceOrder {
  id: string;
  user_id: string;
  product_id: string;
  product_title: string;
  product_image: string | null;
  amount: number;
  reference: string;
  shipping_name: string;
  shipping_phone: string;
  shipping_email: string;
  shipping_address: string;
  status: string;
  created_at: string;
}

interface OrderHistoryProps {
  orders: MarketplaceOrder[];
  loading: boolean;
  selectedOrder: MarketplaceOrder | null;
  onSelectOrder: (order: MarketplaceOrder) => void;
  onCloseOrder: () => void;
  onSwitchToCatalog: () => void;
}

function OrderTimeline({ status, date }: { status: string; date: string }) {
  const steps = [
    { label: "Order Placed", key: "placed", desc: `We received your order request on ${new Date(date).toLocaleDateString()}.` },
    { label: "Processing", key: "processing", desc: "Warehouse packaging your items." },
    { label: "In Transit", key: "in_transit", desc: "Dispatched with Pulse Express Courier." },
    { label: "Delivered", key: "delivered", desc: "Parcel successfully delivered to your address." }
  ];

  const getStepState = (stepKey: string) => {
    if (status === "delivered") return "completed";
    if (status === "in_transit") {
      if (stepKey === "placed" || stepKey === "processing") return "completed";
      if (stepKey === "in_transit") return "active";
      return "pending";
    }
    if (stepKey === "placed") return "completed";
    if (stepKey === "processing") return "active";
    return "pending";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", padding: "0.5rem 0" }}>
      {steps.map((step, idx) => {
        const state = getStepState(step.key);
        return (
          <div key={step.key} style={{ display: "flex", gap: "14px", position: "relative" }}>
            {idx < steps.length - 1 && (
              <div style={{
                position: "absolute",
                left: "10px",
                top: "22px",
                bottom: "-22px",
                width: "2px",
                backgroundColor: state === "completed" ? "var(--color-primary)" : "var(--border)",
                zIndex: 1
              }} />
            )}

            <div style={{
              width: "22px",
              height: "22px",
              borderRadius: "99px",
              backgroundColor: state === "completed"
                ? "var(--color-primary)"
                : state === "active"
                  ? "var(--color-primary)"
                  : "var(--bg-elevated)",
              border: `2px solid ${state === "completed" || state === "active" ? "var(--color-primary)" : "var(--border)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2,
              color: "white",
              fontSize: "0.625rem",
              fontWeight: "bold"
            }}>
              {state === "completed" ? "✓" : ""}
            </div>

            <div style={{ flex: 1 }}>
              <h4 style={{
                fontSize: "0.8125rem",
                fontWeight: state === "active" || state === "completed" ? 800 : 600,
                margin: 0,
                color: state === "pending" ? "var(--text-muted)" : "var(--text-primary)"
              }}>
                {step.label}
              </h4>
              <p style={{
                fontSize: "0.7125rem",
                color: "var(--text-secondary)",
                margin: "2px 0 0 0",
                lineHeight: 1.3
              }}>
                {step.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function OrderHistory({
  orders,
  loading,
  selectedOrder,
  onSelectOrder,
  onCloseOrder,
  onSwitchToCatalog
}: OrderHistoryProps) {
  if (selectedOrder) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Order details"
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
          gap: "1.25rem",
          animation: "slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
            <div>
              <span style={{ fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-primary)", fontWeight: 800 }}>
                Order Tracker
              </span>
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 800, margin: "2px 0 0 0" }}>Ref: {selectedOrder.reference}</h3>
            </div>
            <button
              onClick={onCloseOrder}
              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              aria-label="Close order details"
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center", padding: "10px", backgroundColor: "var(--bg-base)", borderRadius: "12px" }}>
            {selectedOrder.product_image ? (
              <img
                src={selectedOrder.product_image}
                alt={selectedOrder.product_title}
                style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "8px" }}
              />
            ) : (
              <div style={{ width: "48px", height: "48px", borderRadius: "8px", backgroundColor: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ShoppingCart size={20} />
              </div>
            )}
            <div>
              <h4 style={{ fontSize: "0.8125rem", fontWeight: 800, margin: 0 }}>{selectedOrder.product_title}</h4>
              <p style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--color-primary)", margin: "2px 0 0 0" }}>
                ₦{Number(selectedOrder.amount).toLocaleString()}
              </p>
            </div>
          </div>

          <div style={{ padding: "0.5rem 0", borderBottom: "1px solid var(--border)", borderTop: "1px solid var(--border)" }}>
            <span style={{ fontSize: "0.6875rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Visual Status Timeline</span>
            <div style={{ marginTop: "10px" }}>
              <OrderTimeline status={selectedOrder.status} date={selectedOrder.created_at} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "0.6875rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Delivery Information</span>

            <div style={{ display: "flex", gap: "8px", alignItems: "start", fontSize: "0.75rem" }}>
              <User size={14} style={{ marginTop: "2px", color: "var(--text-secondary)" }} />
              <div>
                <strong style={{ color: "var(--text-primary)" }}>{selectedOrder.shipping_name}</strong>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", alignItems: "start", fontSize: "0.75rem" }}>
              <Phone size={14} style={{ marginTop: "2px", color: "var(--text-secondary)" }} />
              <div>
                <span style={{ color: "var(--text-secondary)" }}>{selectedOrder.shipping_phone}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", alignItems: "start", fontSize: "0.75rem" }}>
              <Envelope size={14} style={{ marginTop: "2px", color: "var(--text-secondary)" }} />
              <div>
                <span style={{ color: "var(--text-secondary)" }}>{selectedOrder.shipping_email}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", alignItems: "start", fontSize: "0.75rem" }}>
              <MapPin size={14} style={{ marginTop: "2px", color: "var(--text-secondary)" }} />
              <div>
                <span style={{ color: "var(--text-secondary)", lineHeight: 1.3 }}>{selectedOrder.shipping_address}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
        <div className="spinner" style={{ margin: "0 auto" }} />
        <p style={{ marginTop: "12px", color: "var(--text-secondary)", fontSize: "0.8125rem" }}>Loading orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="card" style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
        <div style={{ color: "var(--text-muted)", marginBottom: "12px" }}>
          <Truck size={48} weight="thin" />
        </div>
        <h3 style={{ fontSize: "0.9375rem", fontWeight: 800, margin: 0 }}>No orders found</h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", marginTop: "4px" }}>
          You have not placed any orders yet. Browse our catalog to shop global items!
        </p>
        <button
          onClick={onSwitchToCatalog}
          className="btn btn-primary"
          style={{ marginTop: "1rem", height: "36px", padding: "0 1.25rem", fontSize: "0.75rem" }}
        >
          Go to Shop
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {orders.map((order) => (
        <div
          key={order.id}
          className="card"
          onClick={() => onSelectOrder(order)}
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "1rem",
            cursor: "pointer",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            transition: "all var(--duration-fast)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "8px", marginBottom: "10px" }}>
            <div>
              <span style={{ fontSize: "0.625rem", fontWeight: 800, color: "var(--text-muted)" }}>REFERENCE</span>
              <p style={{ fontSize: "0.75rem", fontWeight: 800, margin: 0, color: "var(--color-primary)" }}>{order.reference}</p>
            </div>
            <span style={{
              fontSize: "0.625rem",
              fontWeight: 800,
              textTransform: "uppercase",
              backgroundColor: order.status === "delivered"
                ? "rgba(16,185,129,0.1)"
                : order.status === "in_transit"
                  ? "rgba(59,130,246,0.1)"
                  : "rgba(245,158,11,0.1)",
              color: order.status === "delivered"
                ? "#10B981"
                : order.status === "in_transit"
                  ? "#3B82F6"
                  : "#F59E0B",
              padding: "4px 8px",
              borderRadius: "6px"
            }}>
              {order.status.replace("_", " ")}
            </span>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {order.product_image ? (
              <img
                src={order.product_image}
                alt={order.product_title}
                style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "8px", backgroundColor: "var(--bg-base)" }}
              />
            ) : (
              <div style={{ width: "50px", height: "50px", borderRadius: "8px", backgroundColor: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ShoppingCart size={20} />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: "0.8125rem", fontWeight: 800, margin: 0, color: "var(--text-primary)", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {order.product_title}
              </h4>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                ₦{Number(order.amount).toLocaleString()}
              </span>
              <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginLeft: "8px" }}>
                • {new Date(order.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

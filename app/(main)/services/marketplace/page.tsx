"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  MagnifyingGlass, 
  Tag, 
  ShoppingCart, 
  Star, 
  X, 
  Sparkle, 
  CheckCircle,
  Backspace,
  Truck,
  FileText,
  MapPin,
  User,
  Phone,
  Envelope
} from "@phosphor-icons/react";
import { toast } from "sonner";
import Header from "@/components/Header";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

interface Product {
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

const CATEGORIES = ["All", "Electronics", "Fashion", "Gadgets", "Home"];

export default function MarketplacePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Splash screen
  const [showSplash, setShowSplash] = useState(true);

  // Selected Product details view
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  // Quantity selector
  const [quantity, setQuantity] = useState(1);

  // Tab State
  const [activeTab, setActiveTab] = useState<"catalog" | "orders">("catalog");

  // Shipping details state
  const [openShippingModal, setOpenShippingModal] = useState(false);
  const [shippingDetails, setShippingDetails] = useState({
    name: "",
    phone: "",
    email: "",
    address: ""
  });

  // Checkout PIN entry states
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [pin, setPin] = useState("");
  const [submittingPurchase, setSubmittingPurchase] = useState(false);

  // Orders list state
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<MarketplaceOrder | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabaseBrowser.auth.getSession();
      if (!data.session) {
        router.replace("/login");
        return;
      }
      
      const user = data.session.user;
      setShippingDetails(prev => ({
        ...prev,
        name: user.user_metadata?.full_name || "",
        email: user.email || ""
      }));
    }
    checkAuth();
    loadCatalog();
    loadOrders();
  }, [router]);

  async function loadCatalog(category?: string) {
    setLoading(true);
    try {
      const catParam = category && category !== "All" ? `?category=${category}` : "";
      const res = await fetch(`/api/marketplace${catParam}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setProducts(data.products || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  async function loadOrders() {
    setLoadingOrders(true);
    try {
      const res = await fetch("/api/marketplace?type=orders");
      const data = await res.json();
      
      const cached = getCachedOrders();
      const combined = [...(data.orders || [])];
      
      for (const item of cached) {
        if (!combined.some(o => o.reference === item.reference)) {
          combined.push(item);
        }
      }
      
      combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setOrders(combined);
    } catch (err) {
      console.warn("Failed to fetch live orders, loading from cache:", err);
      setOrders(getCachedOrders());
    } finally {
      setLoadingOrders(false);
    }
  }

  function getCachedOrders(): MarketplaceOrder[] {
    try {
      const raw = localStorage.getItem("vtu_marketplace_orders");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveOrderToCache(order: MarketplaceOrder) {
    try {
      const list = getCachedOrders();
      list.unshift(order);
      localStorage.setItem("vtu_marketplace_orders", JSON.stringify(list));
    } catch (e) {
      console.error("Local storage write failed", e);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const res = await fetch(`/api/marketplace?query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setProducts(data.products || []);
      toast.success(`Synced ${data.products?.length || 0} products matching "${searchQuery}"`);
    } catch (err: any) {
      toast.error(err.message || "Search sync failed");
    } finally {
      setSearching(false);
    }
  }

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    loadCatalog(cat);
  };

  const handleNumberInput = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const triggerCheckout = (product: Product) => {
    setViewProduct(null);
    setCheckoutProduct(product);
    setOpenShippingModal(true); // show shipping collector first!
    setPin("");
    setQuantity(1);
  };

  const handlePurchase = async () => {
    if (pin.length < 4 || !checkoutProduct) return;

    setSubmittingPurchase(true);
    try {
      const res = await fetch("/api/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: checkoutProduct.id,
          pin: pin,
          quantity: quantity,
          shippingDetails: shippingDetails
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      toast.success(data.message || "Purchase successful!");
      
      if (data.order) {
        saveOrderToCache(data.order);
      }

      setCheckoutProduct(null);
      setOpenShippingModal(false);
      loadCatalog(selectedCategory);
      loadOrders();
    } catch (err: any) {
      toast.error(err.message || "Purchase failed");
      setPin(""); // clear PIN on failure
    } finally {
      setSubmittingPurchase(false);
    }
  };

  // Watch PIN length to auto-trigger purchase
  useEffect(() => {
    if (pin.length === 4 && checkoutProduct && !openShippingModal) {
      handlePurchase();
    }
  }, [pin, checkoutProduct, openShippingModal]);

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
              {/* Connecting Line */}
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

              {/* Indicator Dot */}
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

              {/* Step content */}
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

  // Splash screen
  if (showSplash) {
    return (
      <div style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
        animation: "fade-in 0.4s ease"
      }}>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: 24,
          background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 48px rgba(99,102,241,0.5)",
          animation: "pulse 1.5s ease-in-out infinite"
        }}>
          <ShoppingCart size={40} weight="fill" color="white" />
        </div>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 900, margin: 0, letterSpacing: "-0.03em", color: "white" }}>9jaPulse Store</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem", marginTop: "0.5rem" }}>Premium global products · Fast Nigerian delivery</p>
        </div>
        <div style={{ display: "flex", gap: "8px", marginTop: "0.5rem" }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "var(--color-primary)",
              opacity: 0.3 + i * 0.35,
              animation: `pulse ${0.8 + i * 0.2}s ease-in-out infinite`
            }} />
          ))}
        </div>
        <button
          onClick={() => setShowSplash(false)}
          className="btn btn-primary"
          style={{ marginTop: "1rem", padding: "0.75rem 2rem", fontSize: "0.9375rem", fontWeight: 800 }}
        >
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div className="page" style={{ paddingBottom: "3rem" }}>
      <Header title="Global Store" showBack={true} />

      {/* Tab Switcher: Browse vs My Orders */}
      <div style={{
        display: "flex",
        borderRadius: "12px",
        backgroundColor: "var(--bg-elevated)",
        padding: "4px",
        marginBottom: "1.25rem"
      }}>
        <button
          onClick={() => setActiveTab("catalog")}
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: activeTab === "catalog" ? "var(--bg-surface)" : "transparent",
            color: activeTab === "catalog" ? "var(--color-primary)" : "var(--text-secondary)",
            fontWeight: 800,
            fontSize: "0.8125rem",
            cursor: "pointer",
            boxShadow: activeTab === "catalog" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
            transition: "all var(--duration-fast)"
          }}
        >
          Browse Catalog
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: activeTab === "orders" ? "var(--bg-surface)" : "transparent",
            color: activeTab === "orders" ? "var(--color-primary)" : "var(--text-secondary)",
            fontWeight: 800,
            fontSize: "0.8125rem",
            cursor: "pointer",
            boxShadow: activeTab === "orders" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
            transition: "all var(--duration-fast)"
          }}
        >
          My Orders
        </button>
      </div>

      {/* CATALOG TAB CONTENT */}
      {activeTab === "catalog" && (
        <>
          {/* Search form */}
          <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px", marginBottom: "1.25rem" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }}>
                <MagnifyingGlass size={18} />
              </span>
              <input
                type="text"
                placeholder="Search global products (e.g., smart watch)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={searching}
                style={{
                  width: "100%",
                  height: "44px",
                  paddingLeft: "38px",
                  paddingRight: "12px",
                  borderRadius: "12px",
                  backgroundColor: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  fontSize: "0.875rem",
                  outline: "none"
                }}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={searching || !searchQuery.trim()}
              style={{ height: "44px", padding: "0 1.25rem", whiteSpace: "nowrap", fontSize: "0.8125rem" }}
            >
              {searching ? "Syncing..." : "Search"}
            </button>
          </form>

          {/* Horizontal Category list */}
          <div 
            style={{ 
              display: "flex", 
              gap: "8px", 
              overflowX: "auto", 
              marginBottom: "1.5rem", 
              paddingBottom: "4px",
              scrollbarWidth: "none"
            }}
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                style={{
                  flexShrink: 0,
                  padding: "6px 14px",
                  borderRadius: "99px",
                  backgroundColor: selectedCategory === cat ? "var(--color-primary)" : "var(--bg-elevated)",
                  border: `1px solid ${selectedCategory === cat ? "var(--color-primary)" : "var(--border)"}`,
                  color: selectedCategory === cat ? "white" : "var(--text-secondary)",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all var(--duration-fast)"
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Catalog view */}
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card" style={{ height: "200px", opacity: 0.5, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div className="spinner" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="card" style={{ padding: "2.5rem 1.5rem", textAlign: "center" }}>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", margin: 0 }}>
                No products found. Use the search bar above to pull items directly from global suppliers!
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
              {products.map((item) => (
                <div
                  key={item.id}
                  className="card product-card"
                  onClick={() => { setViewProduct(item); setActiveImgIndex(0); }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: "8px",
                    cursor: "pointer",
                    position: "relative",
                    height: "100%",
                    justifyContent: "between"
                  }}
                >
                  {/* Product Image */}
                  <div style={{ position: "relative", borderRadius: "10px", overflow: "hidden", aspectRatio: "1/1", width: "100%", backgroundColor: "var(--bg-base)" }}>
                    <img
                      src={item.image_url}
                      alt={item.title}
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
                      {item.category}
                    </span>
                  </div>

                  {/* Title & Rating */}
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
                      {item.title}
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                      <Star size={10} weight="fill" color="#F59E0B" />
                      <span style={{ fontSize: "0.625rem", fontWeight: 700, color: "var(--text-secondary)" }}>{item.rating}</span>
                    </div>
                  </div>

                  {/* Price & Buy footer */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", borderTop: "1px solid var(--border)", paddingTop: "6px" }}>
                    <strong style={{ fontSize: "0.875rem", color: "var(--color-primary)" }}>
                      ₦{item.price.toLocaleString()}
                    </strong>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerCheckout(item);
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
                    >
                      <ShoppingCart size={14} weight="fill" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ORDERS TAB CONTENT */}
      {activeTab === "orders" && (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {loadingOrders ? (
            <div style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
              <div className="spinner" style={{ margin: "0 auto" }} />
              <p style={{ marginTop: "12px", color: "var(--text-secondary)", fontSize: "0.8125rem" }}>Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="card" style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
              <div style={{ color: "var(--text-muted)", marginBottom: "12px" }}>
                <Truck size={48} weight="thin" />
              </div>
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 800, margin: 0 }}>No orders found</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", marginTop: "4px" }}>
                You have not placed any orders yet. Browse our catalog to shop global items!
              </p>
              <button 
                onClick={() => setActiveTab("catalog")}
                className="btn btn-primary"
                style={{ marginTop: "1rem", height: "36px", padding: "0 1.25rem", fontSize: "0.75rem" }}
              >
                Go to Shop
              </button>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="card"
                onClick={() => setSelectedOrder(order)}
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
                {/* Header */}
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

                {/* Details body */}
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
            ))
          )}
        </div>
      )}

      {/* ─── Detail Modal ─── */}
      {viewProduct && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          backgroundColor: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "end",
          justifyContent: "center",
          animation: "fade-in 0.25s"
        }}>
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
                {viewProduct.category} Catalog
              </span>
              <button
                onClick={() => setViewProduct(null)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Image display */}
            <div style={{ position: "relative", borderRadius: "16px", overflow: "hidden", aspectRatio: "16/10", width: "100%", backgroundColor: "var(--bg-base)" }}>
              <img
                src={viewProduct.images && viewProduct.images.length > 0 ? viewProduct.images[activeImgIndex] : (viewProduct.image_url ?? undefined)}
                alt={viewProduct.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>

            {/* Thumbnail selector row */}
            {viewProduct.images && viewProduct.images.length > 1 && (
              <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "2px", scrollbarWidth: "none" }}>
                {viewProduct.images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImgIndex(idx)}
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
              <h2 style={{ fontSize: "1.125rem", fontWeight: 855, margin: 0 }}>{viewProduct.title}</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                <Star size={14} weight="fill" color="#F59E0B" />
                <span style={{ fontSize: "0.75rem", fontWeight: 700 }}>{viewProduct.rating} Rating</span>
                <span style={{ color: "var(--text-muted)" }}>•</span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Stock: {viewProduct.stock_quantity} available</span>
              </div>
            </div>

            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.4, margin: 0 }}>
              {viewProduct.description}
            </p>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {/* Quantity + Total */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Unit Price</span>
                  <p style={{ fontSize: "1.125rem", fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>
                    ₦{viewProduct.price.toLocaleString()}
                  </p>
                </div>
                {/* Quantity stepper */}
                <div style={{ display: "flex", alignItems: "center", gap: "0px", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    style={{ width: 36, height: 36, border: "none", background: "var(--bg-elevated)", color: "var(--text-primary)", fontSize: "1.125rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >−</button>
                  <span style={{ width: 32, textAlign: "center", fontWeight: 800, fontSize: "0.9375rem" }}>{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => Math.min(viewProduct.stock_quantity, q + 1))}
                    style={{ width: 36, height: 36, border: "none", background: "var(--bg-elevated)", color: "var(--color-primary)", fontSize: "1.125rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >+</button>
                </div>
              </div>

              <button
                onClick={() => triggerCheckout(viewProduct)}
                className="btn btn-primary"
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", height: "46px", fontSize: "0.9375rem" }}
              >
                <ShoppingCart size={18} weight="bold" />
                Order {quantity > 1 ? `${quantity}x` : ""} — ₦{(viewProduct.price * quantity).toLocaleString()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Shipping Details Modal ─── */}
      {openShippingModal && checkoutProduct && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          backgroundColor: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "end",
          justifyContent: "center",
          animation: "fade-in 0.25s"
        }}>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (!shippingDetails.name || !shippingDetails.phone || !shippingDetails.email || !shippingDetails.address) {
                toast.error("Please fill in all shipping details!");
                return;
              }
              setOpenShippingModal(false); // triggers PIN keypad next
            }}
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
                <h3 style={{ fontSize: "0.9375rem", fontWeight: 950, margin: "2px 0 0 0" }}>Shipping Information</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpenShippingModal(false);
                  setCheckoutProduct(null);
                }}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Product recap banner */}
            <div style={{ display: "flex", gap: "10px", alignItems: "center", padding: "8px", backgroundColor: "var(--bg-base)", borderRadius: "10px" }}>
              <img
                src={checkoutProduct.image_url}
                alt={checkoutProduct.title}
                style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "6px" }}
              />
              <div>
                <h4 style={{ fontSize: "0.75rem", fontWeight: 800, margin: 0 }}>{checkoutProduct.title}</h4>
                <p style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--color-primary)", margin: 0 }}>₦{checkoutProduct.price.toLocaleString()}</p>
              </div>
            </div>

            {/* Inputs */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Full Name */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--text-secondary)" }}>Recipient Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Obi"
                  value={shippingDetails.name}
                  onChange={(e) => setShippingDetails(prev => ({ ...prev, name: e.target.value }))}
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

              {/* Phone Number */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--text-secondary)" }}>Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 08012345678"
                  value={shippingDetails.phone}
                  onChange={(e) => setShippingDetails(prev => ({ ...prev, phone: e.target.value }))}
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

              {/* Email Address */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--text-secondary)" }}>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john@example.com"
                  value={shippingDetails.email}
                  onChange={(e) => setShippingDetails(prev => ({ ...prev, email: e.target.value }))}
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

              {/* Delivery Address */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--text-secondary)" }}>Delivery Address</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Street Address, City, State"
                  value={shippingDetails.address}
                  onChange={(e) => setShippingDetails(prev => ({ ...prev, address: e.target.value }))}
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
              Verify & Pay ₦{checkoutProduct.price.toLocaleString()}
            </button>
          </form>
        </div>
      )}

      {/* ─── PIN Checkout Modal ─── */}
      {checkoutProduct && !openShippingModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 110,
          backgroundColor: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(10px)",
          display: "flex",
          alignItems: "end",
          justifyContent: "center",
          animation: "fade-in 0.2s"
        }}>
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
                onClick={() => setCheckoutProduct(null)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Price banner */}
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>PAYING FOR</span>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 800, margin: "2px 0 6px 0", color: "var(--text-primary)" }}>{checkoutProduct.title}</h3>
              <div style={{ fontSize: "1.625rem", fontWeight: 900, color: "var(--color-primary)" }}>
                ₦{checkoutProduct.price.toLocaleString()}
              </div>
            </div>

            {/* Bubble Dots PIN Indicators */}
            <div style={{ display: "flex", gap: "1.25rem", margin: "0.5rem 0" }}>
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

            {/* Secure PIN keypad */}
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
                  onClick={() => handleNumberInput(num)}
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
                onClick={() => handleNumberInput("0")}
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
                onClick={handleBackspace}
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
      )}

      {/* ─── Order Detail & Tracker Modal ─── */}
      {selectedOrder && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          backgroundColor: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "end",
          justifyContent: "center",
          animation: "fade-in 0.25s"
        }}>
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
                <h3 style={{ fontSize: "0.9375rem", fontWeight: 950, margin: "2px 0 0 0" }}>Ref: {selectedOrder.reference}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Product card block */}
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

            {/* Visual Tracker Timeline */}
            <div style={{ padding: "0.5rem 0", borderBottom: "1px solid var(--border)", borderTop: "1px solid var(--border)" }}>
              <span style={{ fontSize: "0.6875rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Visual Status Timeline</span>
              <div style={{ marginTop: "10px" }}>
                <OrderTimeline status={selectedOrder.status} date={selectedOrder.created_at} />
              </div>
            </div>

            {/* Shipping details */}
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
      )}

      <style>{`
        .product-card {
          transition: transform var(--duration-fast) var(--ease-spring),
                      box-shadow var(--duration-fast),
                      background var(--duration-fast) var(--ease-smooth);
        }
        .product-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px -8px rgba(0, 0, 0, 0.12);
          background: var(--bg-surface);
        }
        .product-card:active {
          transform: scale(0.97);
        }
        .pin-btn:active {
          background-color: var(--border) !important;
        }
      `}</style>
    </div>
  );
}

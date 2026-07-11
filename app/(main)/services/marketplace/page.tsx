"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MagnifyingGlass,
  ShoppingCart,
  Sparkle,
  CheckCircle,
  Tag,
  FileText
} from "@phosphor-icons/react";
import { toast } from "sonner";
import Header from "@/components/Header";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import ProductCard from "@/components/marketplace/ProductCard";
import ProductDetailModal from "@/components/marketplace/ProductDetailModal";
import ShippingModal from "@/components/marketplace/ShippingModal";
import CheckoutModal from "@/components/marketplace/CheckoutModal";
import OrderHistory from "@/components/marketplace/OrderHistory";

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
    setOpenShippingModal(true);
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
      setPin("");
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
          {[0, 1, 2].map(i => (
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
                <ProductCard
                  key={item.id}
                  product={item}
                  onViewDetails={() => { setViewProduct(item); setActiveImgIndex(0); }}
                  onBuyNow={() => triggerCheckout(item)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ORDERS TAB CONTENT */}
      {activeTab === "orders" && (
        <OrderHistory
          orders={orders}
          loading={loadingOrders}
          selectedOrder={selectedOrder}
          onSelectOrder={setSelectedOrder}
          onCloseOrder={() => setSelectedOrder(null)}
          onSwitchToCatalog={() => setActiveTab("catalog")}
        />
      )}

      {/* Detail Modal */}
      {viewProduct && (
        <ProductDetailModal
          product={viewProduct}
          quantity={quantity}
          activeImgIndex={activeImgIndex}
          onClose={() => setViewProduct(null)}
          onSetQuantity={setQuantity}
          onSetActiveImgIndex={setActiveImgIndex}
          onCheckout={() => triggerCheckout(viewProduct)}
        />
      )}

      {/* Shipping Details Modal */}
      <ShippingModal
        product={checkoutProduct!}
        shippingDetails={shippingDetails}
        open={openShippingModal && !!checkoutProduct}
        onClose={() => { setOpenShippingModal(false); setCheckoutProduct(null); }}
        onUpdate={(details) => setShippingDetails(details)}
        onSubmit={() => setOpenShippingModal(false)}
      />

      {/* PIN Checkout Modal */}
      <CheckoutModal
        product={checkoutProduct!}
        pin={pin}
        submittingPurchase={submittingPurchase}
        open={!!checkoutProduct && !openShippingModal}
        onClose={() => setCheckoutProduct(null)}
        onNumberInput={handleNumberInput}
        onBackspace={handleBackspace}
      />

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

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
  Backspace
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
}

const CATEGORIES = ["All", "Electronics", "Fashion", "Gadgets", "Home"];

export default function MarketplacePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Selected Product details view
  const [viewProduct, setViewProduct] = useState<Product | null>(null);

  // Checkout PIN entry states
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [pin, setPin] = useState("");
  const [submittingPurchase, setSubmittingPurchase] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabaseBrowser.auth.getSession();
      if (!data.session) {
        router.replace("/login");
      }
    }
    checkAuth();
    loadCatalog();
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

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const res = await fetch(`/api/marketplace?query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setProducts(data.products || []);
      toast.success(`Temu synced ${data.products?.length || 0} products matching "${searchQuery}"`);
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
    setPin("");
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
          pin: pin
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      toast.success(data.message || "Purchase successful!");
      setCheckoutProduct(null);
      loadCatalog(selectedCategory);
    } catch (err: any) {
      toast.error(err.message || "Purchase failed");
      setPin(""); // clear PIN on failure
    } finally {
      setSubmittingPurchase(false);
    }
  };

  // Watch PIN length to auto-trigger purchase
  useEffect(() => {
    if (pin.length === 4 && checkoutProduct) {
      handlePurchase();
    }
  }, [pin, checkoutProduct]);

  return (
    <div className="page" style={{ paddingBottom: "3rem" }}>
      <Header title="Temu Super Marketplace" showBack={true} />

      {/* Hero promo card */}
      <div
        className="card animate-fade-in"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "1.25rem",
          background: "linear-gradient(135deg, #e74c3c 15%, #f39c12 100%)",
          color: "white",
          border: "none",
          padding: "1.25rem"
        }}
      >
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: "rgba(255,255,255,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <Sparkle size={24} weight="fill" />
        </div>
        <div>
          <h2 style={{ fontSize: "0.9375rem", fontWeight: 800, margin: 0, letterSpacing: "-0.01em" }}>Direct Temu Imports</h2>
          <p style={{ fontSize: "0.75rem", opacity: 0.9, marginTop: "2px" }}>
            Shop authentic items at factory rates. Standard shipping to Nigeria funded natively via 9jaPulse.
          </p>
        </div>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px", marginBottom: "1.25rem" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }}>
            <MagnifyingGlass size={18} />
          </span>
          <input
            type="text"
            placeholder="Search Temu products (e.g., smart watch)..."
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
            No products found. Use the search bar above to pull items directly from Temu!
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
          {products.map((item) => (
            <div
              key={item.id}
              className="card product-card"
              onClick={() => setViewProduct(item)}
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

            <img
              src={viewProduct.image_url}
              alt={viewProduct.title}
              style={{ width: "100%", aspectRatio: "16/10", objectFit: "cover", borderRadius: "16px" }}
            />

            <div>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 850, margin: 0 }}>{viewProduct.title}</h2>
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

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.5rem", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
              <div>
                <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Unit Price</span>
                <p style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>
                  ₦{viewProduct.price.toLocaleString()}
                </p>
              </div>

              <button
                onClick={() => triggerCheckout(viewProduct)}
                className="btn btn-primary"
                style={{ display: "flex", alignItems: "center", gap: "6px", height: "42px", padding: "0 1.5rem" }}
              >
                <ShoppingCart size={16} weight="bold" />
                Order Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── PIN Checkout Modal ─── */}
      {checkoutProduct && (
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

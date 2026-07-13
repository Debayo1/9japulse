"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  PencilSimple,
  Trash,
  X,
  Package,
  Image,
} from "@phosphor-icons/react";
import Header from "@/components/Header";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import {
  getSellerByUserId,
  getSellerProducts,
  addSellerProduct,
  updateSellerProduct,
  deleteSellerProduct,
} from "@/lib/seller";
import type { SellerRow, SellerProductRow } from "@/lib/database.types";

const CATEGORIES = ["Electronics", "Fashion", "Gadgets", "Home", "Beauty", "Food", "Books", "Other"];

interface ProductForm {
  title: string;
  description: string;
  price: string;
  category: string;
  stock_quantity: string;
  image_url: string;
}

const emptyForm: ProductForm = {
  title: "",
  description: "",
  price: "",
  category: "Electronics",
  stock_quantity: "",
  image_url: "",
};

export default function SellerProductsPage() {
  const router = useRouter();
  const [seller, setSeller] = useState<SellerRow | null>(null);
  const [products, setProducts] = useState<SellerProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

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
      await loadProducts(s.id);
    }
    init();
  }, [router]);

  async function loadProducts(sellerId: string) {
    try {
      const p = await getSellerProducts(sellerId);
      setProducts(p);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(product: SellerProductRow) {
    setEditingId(product.id);
    setForm({
      title: product.title,
      description: product.description || "",
      price: String(product.price),
      category: product.category,
      stock_quantity: String(product.stock_quantity),
      image_url: product.image_url || "",
    });
    setShowModal(true);
  }

  async function handleSubmit() {
    if (!seller || !form.title.trim() || !form.price) {
      toast.error("Title and price are required");
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
        const result = await updateSellerProduct(editingId, {
          title: form.title,
          description: form.description || undefined,
          price: parseFloat(form.price),
          category: form.category,
          stock_quantity: parseInt(form.stock_quantity || "0"),
          image_url: form.image_url || undefined,
        });
        if (result.success) {
          toast.success("Product updated");
          setShowModal(false);
          await loadProducts(seller.id);
        } else {
          toast.error("Failed to update product");
        }
      } else {
        const result = await addSellerProduct(seller.id, {
          title: form.title,
          description: form.description || undefined,
          price: parseFloat(form.price),
          category: form.category,
          stock_quantity: parseInt(form.stock_quantity || "0"),
          image_url: form.image_url || undefined,
        });
        if (result.success) {
          toast.success("Product added");
          setShowModal(false);
          await loadProducts(seller.id);
        } else {
          toast.error("Failed to add product");
        }
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(productId: string) {
    setDeleting(productId);
    try {
      const result = await deleteSellerProduct(productId);
      if (result.success) {
        toast.success("Product deleted");
        setProducts((prev) => prev.filter((p) => p.id !== productId));
      } else {
        toast.error("Failed to delete product");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleting(null);
    }
  }

  async function handleToggleActive(product: SellerProductRow) {
    try {
      const result = await updateSellerProduct(product.id, { is_active: !product.is_active });
      if (result.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, is_active: !p.is_active } : p))
        );
        toast.success(product.is_active ? "Product deactivated" : "Product activated");
      }
    } catch {
      toast.error("Failed to toggle product");
    }
  }

  const fmt = (n: number) => "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 0 });

  if (loading) {
    return (
      <div className="page" style={{ paddingBottom: "2rem" }}>
        <Header title="My Products" showBack={true} />
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="card" style={{ height: "100px", opacity: 0.5, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="spinner" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ paddingBottom: "2rem" }}>
      <Header title="My Products" showBack={true} />

      <button
        className="btn btn-primary btn-full"
        onClick={openAdd}
        style={{ height: "46px", marginBottom: "1.25rem", fontSize: "0.8125rem" }}
      >
        <Plus size={18} weight="bold" />
        Add New Product
      </button>

      {products.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: "color-mix(in srgb, var(--color-primary) 10%, transparent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1rem", color: "var(--color-primary)",
          }}>
            <Package size={28} weight="duotone" />
          </div>
          <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.375rem" }}>No products yet</h3>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
            Add your first product to start selling
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {products.map((product, i) => (
            <div
              key={product.id}
              className="card animate-fade-in"
              style={{ animationDelay: `${i * 40}ms`, opacity: product.is_active ? 1 : 0.5 }}
            >
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 12, flexShrink: 0,
                  background: product.image_url
                    ? `url(${product.image_url}) center/cover`
                    : "var(--bg-surface)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "1px solid var(--border)", overflow: "hidden",
                }}>
                  {!product.image_url && (
                    <Image size={20} color="var(--text-muted)" />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: "0.875rem", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {product.title}
                      </p>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                        {product.category} · {product.stock_quantity} in stock
                      </p>
                    </div>
                    <p style={{ fontWeight: 800, fontSize: "0.875rem", color: "var(--color-success)", margin: 0, whiteSpace: "nowrap" }}>
                      {fmt(product.price)}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.625rem" }}>
                    <button
                      onClick={() => openEdit(product)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "4px",
                        padding: "4px 10px", borderRadius: 8, border: "1px solid var(--border)",
                        background: "var(--bg-surface)", color: "var(--text-secondary)",
                        fontSize: "0.6875rem", fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      <PencilSimple size={12} /> Edit
                    </button>
                    <button
                      onClick={() => handleToggleActive(product)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "4px",
                        padding: "4px 10px", borderRadius: 8, border: "1px solid var(--border)",
                        background: product.is_active ? "hsl(152 60% 42% / 0.1)" : "var(--bg-surface)",
                        color: product.is_active ? "var(--color-success)" : "var(--text-muted)",
                        fontSize: "0.6875rem", fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      {product.is_active ? "Active" : "Inactive"}
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      disabled={deleting === product.id}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "4px",
                        padding: "4px 10px", borderRadius: 8, border: "1px solid hsl(0 72% 51% / 0.2)",
                        background: "hsl(0 72% 51% / 0.06)", color: "var(--color-danger)",
                        fontSize: "0.6875rem", fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      <Trash size={12} /> {deleting === product.id ? "..." : "Del"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
            animation: "fade-in 0.2s ease",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div
            className="animate-slide-up"
            style={{
              width: "100%", maxWidth: 480,
              background: "var(--bg-elevated)",
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              padding: "1.5rem 1.25rem 2rem",
              maxHeight: "85dvh", overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>
                {editingId ? "Edit Product" : "Add Product"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: "var(--bg-surface)", border: "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "var(--text-secondary)",
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <div>
                <label className="input-label">Product Title *</label>
                <input
                  className="input"
                  placeholder="e.g., Wireless Bluetooth Earbuds"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="input-label">Description</label>
                <textarea
                  className="input"
                  placeholder="Describe your product..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  style={{ resize: "vertical", minHeight: "80px" }}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label className="input-label">Price (₦) *</label>
                  <input
                    className="input"
                    type="number"
                    placeholder="0"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="input-label">Stock Qty</label>
                  <input
                    className="input"
                    type="number"
                    placeholder="0"
                    value={form.stock_quantity}
                    onChange={(e) => setForm((f) => ({ ...f, stock_quantity: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="input-label">Category</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setForm((f) => ({ ...f, category: cat }))}
                      style={{
                        padding: "5px 12px", borderRadius: 99, fontSize: "0.6875rem",
                        fontWeight: 600, border: "1px solid var(--border)", cursor: "pointer",
                        background: form.category === cat ? "var(--color-primary)" : "var(--bg-surface)",
                        color: form.category === cat ? "#fff" : "var(--text-secondary)",
                        transition: "all var(--duration-fast)",
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="input-label">Image URL</label>
                <input
                  className="input"
                  placeholder="https://example.com/image.jpg"
                  value={form.image_url}
                  onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                />
              </div>
              <button
                className="btn btn-primary btn-full"
                onClick={handleSubmit}
                disabled={submitting || !form.title.trim() || !form.price}
                style={{ height: "48px" }}
              >
                {submitting ? "Saving..." : editingId ? "Update Product" : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

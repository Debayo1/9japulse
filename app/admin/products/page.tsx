"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash, PencilSimple, X, Check, Image as ImageIcon, Package } from "@phosphor-icons/react";
import Header from "@/components/Header";
import { toast } from "sonner";

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

const EMPTY_FORM = {
  title: "",
  description: "",
  price: "",
  image_url: "",
  category: "Electronics",
  rating: "4.5",
  stock_quantity: "50",
  extra_images: ["", "", ""],
};

const CATEGORIES = ["Electronics", "Fashion", "Gadgets", "Home", "Beauty", "Sports", "Food"];

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewImg, setPreviewImg] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const res = await fetch("/api/marketplace?limit=100");
      const data = await res.json();
      setProducts(data.products || data || []);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  function openAddForm() {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setPreviewImg(null);
    setShowForm(true);
  }

  function openEditForm(p: Product) {
    setEditId(p.id);
    const extras = p.images?.slice(1) || [];
    setForm({
      title: p.title,
      description: p.description || "",
      price: String(p.price),
      image_url: p.image_url || "",
      category: p.category,
      rating: String(p.rating),
      stock_quantity: String(p.stock_quantity),
      extra_images: [extras[0] || "", extras[1] || "", extras[2] || ""],
    });
    setPreviewImg(p.image_url || null);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.title || !form.price || !form.image_url) {
      toast.error("Title, price, and main image are required.");
      return;
    }

    setSaving(true);
    try {
      const images = [form.image_url, ...form.extra_images].filter(Boolean);
      const body = {
        action: editId ? "update" : "create",
        id: editId,
        title: form.title,
        description: form.description,
        price: parseFloat(form.price),
        image_url: form.image_url,
        category: form.category,
        rating: parseFloat(form.rating),
        stock_quantity: parseInt(form.stock_quantity),
        images,
      };

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      toast.success(editId ? "Product updated!" : "Product added to store!");
      setShowForm(false);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      toast.success("Product removed from store.");
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="page" style={{ paddingBottom: "4rem" }}>
      <Header title="Manage Products" showBack={true} />

      {/* Header bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
          {products.length} product{products.length !== 1 ? "s" : ""} in store
        </span>
        <button className="btn btn-primary" onClick={openAddForm}
          style={{ display: "flex", alignItems: "center", gap: "6px", height: "36px", padding: "0 1rem", fontSize: "0.8125rem" }}>
          <Plus size={16} weight="bold" /> Add Product
        </button>
      </div>

      {/* Product list */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[1,2,3].map(i => (
            <div key={i} className="card" style={{ height: 72, opacity: 0.4 }} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem 1rem" }}>
          <Package size={40} style={{ color: "var(--text-muted)", marginBottom: "0.75rem" }} />
          <p style={{ color: "var(--text-secondary)", margin: 0 }}>No products yet. Add your first product!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {products.map(p => (
            <div key={p.id} className="card" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px" }}>
              {/* Image */}
              <div style={{ width: 52, height: 52, borderRadius: 10, overflow: "hidden", flexShrink: 0, backgroundColor: "var(--bg-base)" }}>
                {p.image_url ? (
                  <img src={p.image_url} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ImageIcon size={20} style={{ color: "var(--text-muted)" }} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 800, fontSize: "0.8125rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</p>
                <span style={{ fontSize: "0.6875rem", color: "var(--color-primary)", fontWeight: 700 }}>₦{Number(p.price).toLocaleString()}</span>
                <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginLeft: "6px" }}>{p.category} · Qty: {p.stock_quantity}</span>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                <button onClick={() => openEditForm(p)} style={{ border: "none", background: "var(--bg-elevated)", borderRadius: 8, padding: "6px", cursor: "pointer", color: "var(--color-primary)" }}>
                  <PencilSimple size={15} />
                </button>
                <button onClick={() => handleDelete(p.id)} disabled={deletingId === p.id} style={{ border: "none", background: "rgba(239,68,68,0.1)", borderRadius: 8, padding: "6px", cursor: "pointer", color: "#ef4444" }}>
                  {deletingId === p.id ? "..." : <Trash size={15} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "end", justifyContent: "center" }}>
          <div style={{ backgroundColor: "var(--bg-elevated)", borderTopLeftRadius: 24, borderTopRightRadius: 24, width: "100%", maxWidth: 480, maxHeight: "92vh", overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", animation: "slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}>

            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "1.0625rem", fontWeight: 900, margin: 0 }}>{editId ? "Edit Product" : "Add New Product"}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            {/* Main Image URL */}
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Main Product Image URL *</label>
              <input
                type="url"
                placeholder="https://example.com/product-photo.jpg"
                value={form.image_url}
                onChange={e => { setForm(f => ({ ...f, image_url: e.target.value })); setPreviewImg(e.target.value || null); }}
                className="input"
                style={{ width: "100%", fontSize: "0.8125rem" }}
              />
              {/* Image preview */}
              {previewImg && (
                <div style={{ marginTop: 8, borderRadius: 12, overflow: "hidden", aspectRatio: "16/9", backgroundColor: "var(--bg-base)", border: "1px solid var(--border)" }}>
                  <img src={previewImg} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={() => setPreviewImg(null)} />
                </div>
              )}
            </div>

            {/* Extra Images */}
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Extra Image URLs (optional — up to 3 more)</label>
              {form.extra_images.map((img, i) => (
                <input
                  key={i}
                  type="url"
                  placeholder={`Extra image ${i + 1} URL`}
                  value={img}
                  onChange={e => {
                    const updated = [...form.extra_images];
                    updated[i] = e.target.value;
                    setForm(f => ({ ...f, extra_images: updated }));
                  }}
                  className="input"
                  style={{ width: "100%", fontSize: "0.8125rem", marginBottom: 6 }}
                />
              ))}
            </div>

            {/* Title */}
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Product Name *</label>
              <input type="text" placeholder="e.g. Samsung Galaxy Buds Pro" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="input" style={{ width: "100%", fontSize: "0.8125rem" }} />
            </div>

            {/* Description */}
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Description</label>
              <textarea placeholder="Describe the product..." value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="input" rows={3} style={{ width: "100%", fontSize: "0.8125rem", resize: "vertical" }} />
            </div>

            {/* Price + Category row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Price (₦) *</label>
                <input type="number" placeholder="5000" value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  className="input" style={{ width: "100%", fontSize: "0.8125rem" }} />
              </div>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="input" style={{ width: "100%", fontSize: "0.8125rem" }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Stock + Rating row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Stock Quantity</label>
                <input type="number" placeholder="50" value={form.stock_quantity}
                  onChange={e => setForm(f => ({ ...f, stock_quantity: e.target.value }))}
                  className="input" style={{ width: "100%", fontSize: "0.8125rem" }} />
              </div>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Rating (1–5)</label>
                <input type="number" placeholder="4.5" min="1" max="5" step="0.1" value={form.rating}
                  onChange={e => setForm(f => ({ ...f, rating: e.target.value }))}
                  className="input" style={{ width: "100%", fontSize: "0.8125rem" }} />
              </div>
            </div>

            {/* Save button */}
            <button onClick={handleSave} disabled={saving} className="btn btn-primary"
              style={{ width: "100%", height: 46, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "0.9375rem" }}>
              <Check size={18} weight="bold" />
              {saving ? "Saving..." : editId ? "Update Product" : "Add to Store"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

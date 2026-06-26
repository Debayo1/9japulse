import { CreditCard, Plus, ArrowUpRight, ShieldCheck, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SkeletonList } from "@/components/SkeletonLoader";

async function CardContent() {
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <CreditCard size={22} weight="duotone" color="var(--color-primary)" />
        <h1 style={{ fontSize: "1.375rem", fontWeight: 700 }}>Cards</h1>
      </div>

      {/* Virtual card visual */}
      <div
        className="animate-slide-up"
        style={{
          background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)",
          borderRadius: 20,
          padding: "1.75rem 1.5rem",
          marginBottom: "1.5rem",
          position: "relative",
          overflow: "hidden",
          boxShadow: "var(--shadow-glow)",
        }}
      >
        {/* Background pattern */}
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)", pointerEvents: "none" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.8125rem", fontWeight: 600 }}>9jaPulse Virtual</p>
          <ShieldCheck size={20} weight="regular" color="rgba(255,255,255,0.7)" />
        </div>

        <p style={{ fontFamily: "monospace", fontSize: "1.125rem", letterSpacing: "0.2em", color: "#fff", fontWeight: 600, marginBottom: "1.5rem" }}>
          •••• •••• •••• ––––
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Card Holder</p>
            <p style={{ color: "#fff", fontWeight: 600, marginTop: "0.125rem" }}>Not yet issued</p>
          </div>
          <p style={{ color: "#fff", fontWeight: 700, fontSize: "1.25rem" }}>VISA</p>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <button className="btn btn-primary" style={{ flexDirection: "column", gap: "0.5rem", height: 72 }}>
          <Plus size={20} weight="bold" />
          <span style={{ fontSize: "0.8125rem" }}>Request Card</span>
        </button>
        <button className="btn btn-secondary" style={{ flexDirection: "column", gap: "0.5rem", height: 72 }}>
          <ArrowUpRight size={20} weight="regular" />
          <span style={{ fontSize: "0.8125rem" }}>Fund Card</span>
        </button>
      </div>

      {/* Info items */}
      {[
        "Virtual USD card for online payments",
        "Instant card issuance (coming soon)",
        "Freeze/unfreeze anytime",
      ].map((text) => (
        <div key={text} className="card" style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-primary)", flexShrink: 0 }} />
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", flex: 1 }}>{text}</p>
          <CaretRight size={16} weight="bold" color="var(--text-muted)" />
        </div>
      ))}
    </>
  );
}

export default function CardPage() {
  return (
    <div className="page">
      <Suspense fallback={<SkeletonList rows={4} />}>
        <CardContent />
      </Suspense>
    </div>
  );
}

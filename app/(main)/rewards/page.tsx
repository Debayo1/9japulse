import { Star, Trophy, Gift, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SkeletonList } from "@/components/SkeletonLoader";

async function RewardsContent() {
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <Star size={22} weight="fill" color="var(--color-warning)" />
        <h1 style={{ fontSize: "1.375rem", fontWeight: 700 }}>Rewards</h1>
      </div>
      <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
        Earn points on every transaction and redeem for cash.
      </p>

      {/* Points card */}
      <div className="glass animate-fade-in" style={{ padding: "1.5rem", marginBottom: "1.25rem", textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
          Your Points
        </p>
        <p style={{ fontSize: "3rem", fontWeight: 800, color: "var(--color-warning)" }}>
          0
        </p>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
          Start transacting to earn points
        </p>
        <button className="btn btn-primary" style={{ marginTop: "1.25rem", width: "100%" }}>
          <Gift size={18} weight="duotone" />
          Redeem Points
        </button>
      </div>

      {/* How it works */}
      <section>
        <h2 style={{ fontWeight: 700, marginBottom: "0.875rem" }}>How it works</h2>
        {[
          { Icon: Star,   label: "Buy Airtime/Data",     desc: "Earn 1 point per ₦100 spent" },
          { Icon: Trophy, label: "Pay Bills",             desc: "Earn 2 points per ₦100 spent" },
          { Icon: Gift,   label: "Redeem for Cash",       desc: "100 points = ₦10 cashback"   },
        ].map(({ Icon, label, desc }) => (
          <div key={label} className="card" style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "0.75rem" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "hsl(38 92% 50% / 0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={20} weight="duotone" color="var(--color-warning)" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, color: "var(--text-primary)" }}>{label}</p>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.125rem" }}>{desc}</p>
            </div>
            <CaretRight size={16} weight="bold" color="var(--text-muted)" />
          </div>
        ))}
      </section>
    </>
  );
}

export default function RewardsPage() {
  return (
    <div className="page">
      <Suspense fallback={<SkeletonList rows={4} />}>
        <RewardsContent />
      </Suspense>
    </div>
  );
}

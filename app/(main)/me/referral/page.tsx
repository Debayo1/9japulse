"use client";

import { ShareNetwork } from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Header from "@/components/Header";

export default function ReferralPage() {
  return (
    <div className="page" style={{ paddingTop: "5rem" }}>
      <Header title="Refer & Earn" showBack />
      <div className="card" style={{ padding: "2rem", textAlign: "center", marginTop: "1rem" }}>
        <ShareNetwork size={48} weight="duotone" color="var(--color-primary)" />
        <h3 style={{ marginTop: "1rem" }}>Refer a Friend</h3>
        <p style={{ fontSize: "0.875rem", marginTop: "0.5rem", lineHeight: 1.6 }}>
          Share 9jaPulse with your friends and earn rewards when they sign up and make their first purchase.
        </p>
        <button
          className="btn btn-primary btn-full"
          style={{ marginTop: "1.5rem", height: 48 }}
          onClick={() => {
            navigator.clipboard?.writeText("https://9japulse.app/ref/loading...");
            toast.success("Referral link copied!");
          }}
        >
          Share Your Link
        </button>
      </div>
    </div>
  );
}

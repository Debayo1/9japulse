"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Header from "./Header";
import Image from "next/image";
import { Info, WifiHigh } from "@phosphor-icons/react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { fetchActiveDataPlans, DataPlanDb } from "@/lib/dataPlans";

interface DataFormProps {
  walletId: string;
  initialWithdrawable: number;
}

interface DataPlan {
  id: string;
  label: string;
  price: number;
  validity: string;
}

const DATA_PLANS: Record<string, DataPlan[]> = {
  mtn: [
    { id: "mtn-1gb", label: "MTN SME 1.0 GB", price: 250, validity: "30 Days" },
    { id: "mtn-2gb", label: "MTN SME 2.0 GB", price: 500, validity: "30 Days" },
    { id: "mtn-5gb", label: "MTN SME 5.0 GB", price: 1250, validity: "30 Days" },
    { id: "mtn-10gb", label: "MTN SME 10.0 GB", price: 2500, validity: "30 Days" },
    { id: "mtn-1.5gb-gift", label: "MTN Gifting 1.5 GB", price: 350, validity: "30 Days" },
    { id: "mtn-3gb-gift", label: "MTN Gifting 3.0 GB", price: 700, validity: "30 Days" },
  ],
  airtel: [
    { id: "art-1.5gb", label: "Airtel CG 1.5 GB", price: 350, validity: "30 Days" },
    { id: "art-3gb", label: "Airtel CG 3.0 GB", price: 700, validity: "30 Days" },
    { id: "art-5gb", label: "Airtel CG 5.0 GB", price: 1150, validity: "30 Days" },
    { id: "art-10gb", label: "Airtel CG 10.0 GB", price: 2300, validity: "30 Days" },
  ],
  glo: [
    { id: "glo-1.35gb", label: "Glo CG 1.35 GB", price: 290, validity: "14 Days" },
    { id: "glo-2.9gb", label: "Glo CG 2.9 GB", price: 580, validity: "30 Days" },
    { id: "glo-5.8gb", label: "Glo CG 5.8 GB", price: 1160, validity: "30 Days" },
    { id: "glo-10gb", label: "Glo CG 10.0 GB", price: 2000, validity: "30 Days" },
  ],
  "9mobile": [
    { id: "9mob-1gb", label: "9mobile CG 1.0 GB", price: 300, validity: "30 Days" },
    { id: "9mob-2gb", label: "9mobile CG 2.0 GB", price: 600, validity: "30 Days" },
    { id: "9mob-5gb", label: "9mobile CG 5.0 GB", price: 1400, validity: "30 Days" },
    { id: "9mob-10gb", label: "9mobile CG 10.0 GB", price: 2800, validity: "30 Days" },
  ],
};

const NETWORKS = [
  { id: "mtn", label: "MTN", color: "#FFCC00", textColor: "#000000" },
  { id: "airtel", label: "Airtel", color: "#E30A17", textColor: "#FFFFFF" },
  { id: "glo", label: "Glo", color: "#4E9C23", textColor: "#FFFFFF" },
  { id: "9mobile", label: "9mobile", color: "#005F53", textColor: "#FFFFFF" },
];

export default function DataForm({ walletId, initialWithdrawable }: DataFormProps) {
  const router = useRouter();
  const [network, setNetwork] = useState("mtn");
  const [phone, setPhone] = useState("");
  const [planIndex, setPlanIndex] = useState(0);
  const [pin, setPin] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [allPlans, setAllPlans] = useState<DataPlanDb[]>([]);

  useEffect(() => {
    fetchActiveDataPlans().then((plans) => {
      setAllPlans(plans);
    });
  }, []);

  const activePlans = allPlans.length > 0
    ? allPlans.filter(p => {
        const s = p.service.toLowerCase();
        if (network === "mtn") return s.startsWith("mtn");
        if (network === "airtel") return s.startsWith("airtel");
        if (network === "glo") return s.startsWith("glo");
        if (network === "9mobile") return s.startsWith("etisalat") || s.startsWith("9mobile");
        return false;
      }).map(p => ({
        id: p.id,
        label: p.display_name || `${p.full_service_name || p.service} - ${p.plan_value}`,
        price: p.price,
        validity: "30 Days",
      }))
    : (DATA_PLANS[network] ?? []);

  const selectedPlan = activePlans[planIndex] ?? activePlans[0];

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value.replace(/[^0-9]/g, ""));
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPin(e.target.value.slice(0, 4).replace(/[^0-9]/g, ""));
  };

  const initiatePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 11) {
      toast.error("Please enter a valid 11-digit phone number");
      return;
    }
    if (!selectedPlan) {
      toast.error("Please select a data plan");
      return;
    }
    if (selectedPlan.price > initialWithdrawable) {
      toast.error("Insufficient withdrawable balance");
      return;
    }
    setPin("");
    setShowConfirm(true);
  };

  const executePurchase = () => {
    if (pin.length < 4) {
      toast.error("Please enter your 4-digit security PIN");
      return;
    }

    startTransition(async () => {
      try {
        const { data: sessionData } = await supabaseBrowser.auth.getSession();
        const accessToken = sessionData?.session?.access_token;
        if (!accessToken) {
          toast.error("Session expired. Please log in again.");
          return;
        }

        const res = await fetch("/api/purchases/data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            walletId,
            network,
            phone,
            planId: selectedPlan.id,
            amount: selectedPlan.price,
            pin,
          }),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Purchase failed");

        toast.success(`${selectedPlan.label} sent successfully to ${phone}!`);
        setShowConfirm(false);
        setPhone("");
        setPin("");
        
        router.push(`/services/success?type=data&amount=${selectedPlan.price}&phone=${phone}&network=${network}&plan=${encodeURIComponent(selectedPlan.label)}&ref=${json.reference || ""}`);
      } catch (err: unknown) {
        toast.error((err as Error).message ?? "Purchase failed");
      }
    });
  };

  return (
    <div className="page" style={{ paddingBottom: "1.5rem" }}>
      <Header title="Buy Data Bundles" />

      {/* ─── Balance Banner ─────────────────────────────────────────────── */}
      <div
        className="glass-sm"
        style={{
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          border: "1.5px solid var(--border)",
        }}
      >
        <div>
          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 500 }}>
            Available Cash
          </p>
          <p style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--color-success)" }}>
            ₦{initialWithdrawable.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <WifiHigh size={28} weight="duotone" style={{ color: "var(--color-primary)", opacity: 0.8 }} />
      </div>

      {/* ─── Data Purchase Form ─────────────────────────────────────────── */}
      <form onSubmit={initiatePurchase} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Network Selector */}
        <div>
          <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.625rem" }}>
            Select Network Provider
          </span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.625rem" }}>
            {NETWORKS.map((net) => {
              const active = network === net.id;
              return (
                <button
                  key={net.id}
                  type="button"
                  onClick={() => {
                    setNetwork(net.id);
                    setPlanIndex(0);
                  }}
                  style={{
                    backgroundColor: active ? "var(--bg-elevated)" : "var(--bg-surface)",
                    color: "var(--text-primary)",
                    border: active ? `2px solid var(--color-primary)` : "1.5px solid var(--border)",
                    height: "72px",
                    borderRadius: "16px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    cursor: "pointer",
                    transition: "all var(--duration-fast) var(--ease-smooth)",
                    boxShadow: active ? `0 6px 16px rgba(0, 0, 0, 0.04)` : "none",
                  }}
                  className="squishy"
                >
                  <Image
                    src={`/networks/${net.id}.png`}
                    alt={net.label}
                    width={28}
                    height={28}
                    style={{ borderRadius: "50%", objectFit: "cover" }}
                  />
                  <span style={{ fontSize: "0.6875rem", fontWeight: 700 }}>
                    {net.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Phone Number Input */}
        <div>
          <label
            htmlFor="data-phone"
            style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.5rem" }}
          >
            Phone Number
          </label>
          <div className="input-wrapper">
            <input
              id="data-phone"
              type="tel"
              placeholder="e.g. 09070578999"
              value={phone}
              onChange={handlePhoneChange}
              maxLength={11}
              required
              className="input"
            />
          </div>
        </div>

        {/* Data Plan Select */}
        <div>
          <label
            htmlFor="data-plan"
            style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.5rem" }}
          >
            Choose Data Plan
          </label>
          <div className="input-wrapper">
            <select
              id="data-plan"
              value={planIndex}
              onChange={(e) => setPlanIndex(parseInt(e.target.value))}
              required
              style={{
                width: "100%",
                background: "var(--bg-elevated)",
                border: "1.5px solid var(--border)",
                borderRadius: "16px",
                color: "var(--text-primary)",
                fontSize: "0.9375rem",
                padding: "0.9375rem 1.125rem",
                outline: "none",
                cursor: "pointer",
                appearance: "none",
                backgroundImage: "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 1.25rem center",
                backgroundSize: "1rem",
              }}
            >
              {activePlans.map((plan, idx) => (
                <option key={plan.id} value={idx}>
                  {plan.label} — ₦{plan.price} ({plan.validity})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pricing Help Banner */}
        {selectedPlan && (
          <div
            style={{
              padding: "0.875rem 1rem",
              borderRadius: "12px",
              backgroundColor: "var(--bg-surface)",
              border: "1.5px dashed var(--border)",
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              fontSize: "0.8125rem",
              color: "var(--text-secondary)",
            }}
          >
            <Info size={16} style={{ color: "var(--color-primary)" }} />
            <span>
              You will be charged <strong>₦{selectedPlan.price.toLocaleString()}</strong>. Validity is {selectedPlan.validity}.
            </span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          className="btn btn-primary btn-full"
          style={{ marginTop: "1rem", height: "48px" }}
        >
          Proceed to Confirm
        </button>
      </form>

      {/* ─── Transaction Confirmation Modal Sheet ───────────────────────── */}
      {showConfirm && selectedPlan && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            zIndex: 100,
          }}
          onClick={() => !isPending && setShowConfirm(false)}
        >
          <div
            className="glass animate-slide-up"
            style={{
              width: "100%",
              maxWidth: "480px",
              backgroundColor: "var(--bg-elevated)",
              borderTopLeftRadius: "28px",
              borderTopRightRadius: "28px",
              border: "1.5px solid var(--border)",
              borderBottom: "none",
              padding: "1.75rem 1.5rem",
              boxShadow: "0 -8px 32px rgba(0,0,0,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "1.5rem" }}>
              <div
                style={{
                  width: "48px",
                  height: "4px",
                  backgroundColor: "var(--text-muted)",
                  borderRadius: "2px",
                  opacity: 0.3,
                  marginBottom: "1rem",
                }}
              />
              <h2 style={{ fontSize: "1.125rem", fontWeight: 800 }}>Confirm Transaction</h2>
            </div>

            {/* Details Panel */}
            <div
              className="glass-sm"
              style={{
                padding: "1rem",
                border: "1.5px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                marginBottom: "1.5rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Service</span>
                <span style={{ fontSize: "0.8125rem", fontWeight: 700 }}>Data Subscription</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Plan Details</span>
                <span style={{ fontSize: "0.8125rem", fontWeight: 700 }}>{selectedPlan.label}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Recipient</span>
                <span style={{ fontSize: "0.8125rem", fontWeight: 700 }}>{phone}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1.5px solid var(--border)", paddingTop: "0.75rem" }}>
                <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", fontWeight: 600 }}>Amount Due</span>
                <span style={{ fontSize: "0.9375rem", fontWeight: 900, color: "var(--color-primary)" }}>₦{selectedPlan.price.toLocaleString()}</span>
              </div>
            </div>

            {/* Security PIN Field */}
            <div style={{ marginBottom: "1.75rem" }}>
              <label
                htmlFor="data-pin"
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  display: "block",
                  textAlign: "center",
                  marginBottom: "0.625rem",
                }}
              >
                Enter 4-Digit Transaction PIN
              </label>
              <input
                id="data-pin"
                type="password"
                placeholder="••••"
                value={pin}
                onChange={handlePinChange}
                maxLength={4}
                style={{
                  textAlign: "center",
                  fontSize: "1.5rem",
                  letterSpacing: "1em",
                  paddingLeft: "1em",
                  height: "50px",
                }}
                className="input"
                autoComplete="off"
                disabled={isPending}
              />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, height: "48px" }}
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 2, height: "48px" }}
                onClick={executePurchase}
                disabled={isPending || pin.length < 4}
              >
                {isPending ? "Sending..." : "Confirm & Pay"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

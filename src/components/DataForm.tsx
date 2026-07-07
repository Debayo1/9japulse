"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Header from "./Header";
import Image from "next/image";
import { Info, WifiHigh, Backspace, CaretRight, X, Warning } from "@phosphor-icons/react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { fetchActiveDataPlans, DataPlanDb } from "@/lib/dataPlans";
import { detectNetworkPrefix } from "@/lib/network";

interface DataFormProps {
  walletId?: string;
  initialWithdrawable?: number;
}

interface DataPlan {
  id: string;
  label: string;
  price: number;
  validity: string;
  service: string;
}

const DATA_PLANS: Record<string, DataPlan[]> = {
  mtn: [
    { id: "mtn-1gb", label: "MTN SME 1.0 GB", price: 250, validity: "30 Days", service: "mtn_sme" },
    { id: "mtn-2gb", label: "MTN SME 2.0 GB", price: 500, validity: "30 Days", service: "mtn_sme" },
    { id: "mtn-5gb", label: "MTN SME 5.0 GB", price: 1250, validity: "30 Days", service: "mtn_sme" },
    { id: "mtn-10gb", label: "MTN SME 10.0 GB", price: 2500, validity: "30 Days", service: "mtn_sme" },
    { id: "mtn-1.5gb-gift", label: "MTN Gifting 1.5 GB", price: 350, validity: "30 Days", service: "mtn_gifting" },
    { id: "mtn-3gb-gift", label: "MTN Gifting 3.0 GB", price: 700, validity: "30 Days", service: "mtn_gifting" },
  ],
  airtel: [
    { id: "art-1.5gb", label: "Airtel CG 1.5 GB", price: 350, validity: "30 Days", service: "airtel_cg" },
    { id: "art-3gb", label: "Airtel CG 3.0 GB", price: 700, validity: "30 Days", service: "airtel_cg" },
    { id: "art-5gb", label: "Airtel CG 5.0 GB", price: 1150, validity: "30 Days", service: "airtel_cg" },
    { id: "art-10gb", label: "Airtel CG 10.0 GB", price: 2300, validity: "30 Days", service: "airtel_cg" },
  ],
  glo: [
    { id: "glo-1.35gb", label: "Glo CG 1.35 GB", price: 290, validity: "14 Days", service: "glo_data" },
    { id: "glo-2.9gb", label: "Glo CG 2.9 GB", price: 580, validity: "30 Days", service: "glo_data" },
    { id: "glo-5.8gb", label: "Glo CG 5.8 GB", price: 1160, validity: "30 Days", service: "glo_data" },
    { id: "glo-10gb", label: "Glo CG 10.0 GB", price: 2000, validity: "30 Days", service: "glo_data" },
  ],
  "9mobile": [
    { id: "9mob-1gb", label: "9mobile CG 1.0 GB", price: 300, validity: "30 Days", service: "etisalat_data" },
    { id: "9mob-2gb", label: "9mobile CG 2.0 GB", price: 600, validity: "30 Days", service: "etisalat_data" },
    { id: "9mob-5gb", label: "9mobile CG 5.0 GB", price: 1400, validity: "30 Days", service: "etisalat_data" },
    { id: "9mob-10gb", label: "9mobile CG 10.0 GB", price: 2800, validity: "30 Days", service: "etisalat_data" },
  ],
};

const getServiceLabel = (serviceKey: string) => {
  const k = serviceKey.toLowerCase();
  if (k === "mtn_sme") return "SME";
  if (k === "mtn_cg_lite") return "CG Lite";
  if (k === "mtncg") return "MTN CG";
  if (k === "mtn_gifting") return "Gifting";
  if (k === "mtn_datashare") return "Datashare";
  if (k === "mtn_coupon") return "Coupon";
  if (k === "airtel_sme") return "SME";
  if (k === "airtel_cg") return "Corporate (CG)";
  if (k === "airtel_gifting") return "Gifting";
  if (k === "glo_sme") return "SME";
  if (k === "glo_data") return "Glo Data";
  if (k === "etisalat_data") return "9mobile Data";
  return serviceKey.replace(/_/g, " ").toUpperCase();
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
  const [showPinPad, setShowPinPad] = useState(false);
  const [showPlansSheet, setShowPlansSheet] = useState(false);
  const [activeServiceFilter, setActiveServiceFilter] = useState("");
  const [mismatchWarning, setMismatchWarning] = useState<{ expected: string; detected: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const [allPlans, setAllPlans] = useState<DataPlanDb[]>([]);

  // Balance cache state & Realtime updates
  const [wId, setWId] = useState(walletId || "");
  const [withdrawable, setWithdrawable] = useState(initialWithdrawable ?? 0);

  useEffect(() => {
    // Restores cache instantly
    const cached = localStorage.getItem("vtu_wallet_cache");
    if (cached) {
      const wObj = JSON.parse(cached);
      if (!wId) setWId(wObj.id);
      if (initialWithdrawable === undefined) setWithdrawable(wObj.balance_withdrawable);
    }

    async function syncBalance() {
      try {
        const { data: session } = await supabaseBrowser.auth.getSession();
        const user = session?.session?.user;
        if (!user) return;
        const { data: wallet } = await (supabaseBrowser
          .from("wallets")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle() as any);
        if (wallet) {
          const wObj = {
            id: wallet.id,
            balance_total: Number(wallet.balance_total),
            balance_withdrawable: Number(wallet.balance_withdrawable)
          };
          setWId(wObj.id);
          setWithdrawable(wObj.balance_withdrawable);
          localStorage.setItem("vtu_wallet_cache", JSON.stringify(wObj));
        }
      } catch (err) {
        console.error("Failed to sync wallet in DataForm:", err);
      }
    }
    syncBalance();

    // Subscribe to Postgres balance changes for real-time DB changes
    let isMounted = true;
    let sub: any = null;
    async function setupRealtime() {
      const { data } = await supabaseBrowser.auth.getSession();
      const user = data.session?.user;
      if (!user || !isMounted) return;

      sub = supabaseBrowser
        .channel(`wallet-realtime-data-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "wallets",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newW = payload.new as any;
            setWithdrawable(Number(newW.balance_withdrawable));
            const wObj = {
              id: newW.id,
              balance_total: Number(newW.balance_total),
              balance_withdrawable: Number(newW.balance_withdrawable)
            };
            localStorage.setItem("vtu_wallet_cache", JSON.stringify(wObj));
          }
        )
        .subscribe();
    }
    setupRealtime();

    return () => {
      isMounted = false;
      if (sub) supabaseBrowser.removeChannel(sub);
    };
  }, [wId, initialWithdrawable]);

  useEffect(() => {
    fetchActiveDataPlans().then((plans) => {
      setAllPlans(plans);
    });
  }, []);

  // 1. Group active dynamic plans or fallbacks by provider service type
  const rawNetworkPlans = allPlans.length > 0
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
        rawService: p.service.toLowerCase(),
      }))
    : (DATA_PLANS[network] ?? []).map(p => ({
        ...p,
        rawService: p.service.toLowerCase()
      }));

  // 2. Extract unique available service categories for this network
  const availableServices = Array.from(new Set(rawNetworkPlans.map(p => p.rawService)));

  // 3. Select active category (fallback to first available service if mismatch)
  const currentServiceFilter = availableServices.includes(activeServiceFilter)
    ? activeServiceFilter
    : (availableServices[0] || "");

  // 4. Final filtered data plans to show
  const activePlans = rawNetworkPlans.filter(plan => plan.rawService === currentServiceFilter);

  const selectedPlan = activePlans[planIndex];

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value.replace(/[^0-9]/g, ""));
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPin(e.target.value.slice(0, 4).replace(/[^0-9]/g, ""));
  };

  const proceedToConfirmation = (targetNetwork: string) => {
    setPin("");
    setShowConfirm(true);
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
    if (selectedPlan.price > withdrawable) {
      toast.error("Insufficient withdrawable balance");
      return;
    }

    // Network prefix check
    const detected = detectNetworkPrefix(phone);
    if (detected && detected !== network) {
      setMismatchWarning({ expected: network, detected });
      return;
    }

    proceedToConfirmation(network);
  };

  const triggerExecutePurchase = (targetPin: string) => {
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
            walletId: wId,
            network,
            phone,
            planId: selectedPlan.id,
            amount: selectedPlan.price,
            pin: targetPin,
          }),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Purchase failed");

        toast.success(`${selectedPlan.label} sent successfully to ${phone}!`);
        setShowPinPad(false);
        setShowConfirm(false);
        setPhone("");
        setPin("");
        
        router.push(`/services/success?type=data&amount=${selectedPlan.price}&phone=${phone}&network=${network}&plan=${encodeURIComponent(selectedPlan.label)}&ref=${json.reference || ""}`);
      } catch (err: unknown) {
        toast.error((err as Error).message ?? "Purchase failed");
        setPin("");
      }
    });
  };

  return (
    <div className="page" style={{ paddingBottom: "1.5rem" }}>
      <Header title="Buy Data Bundles" />

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
                    border: "none",
                    height: "72px",
                    borderRadius: "16px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    cursor: "pointer",
                    transition: "all var(--duration-fast) var(--ease-smooth)",
                    boxShadow: active ? `0 8px 20px -4px color-mix(in srgb, ${net.color} 40%, transparent)` : "none",
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

        {/* Data Plan Type Selection (MTN SME, Datashare, Glo Data etc.) */}
        <div>
          <label style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.5rem" }}>
            Data Plan Type
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
            {availableServices.map(svcKey => {
              const active = currentServiceFilter === svcKey;
              return (
                <button
                  key={svcKey}
                  type="button"
                  onClick={() => {
                    setActiveServiceFilter(svcKey);
                    setPlanIndex(0);
                  }}
                  style={{
                    backgroundColor: active ? "var(--color-primary)" : "var(--bg-surface)",
                    color: active ? "white" : "var(--text-primary)",
                    border: active ? "1.5px solid var(--color-primary)" : "1.5px solid var(--border)",
                    height: "36px",
                    padding: "0 0.85rem",
                    borderRadius: "10px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all var(--duration-fast) var(--ease-smooth)",
                  }}
                  className="squishy"
                >
                  {getServiceLabel(svcKey)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Data Plan Select */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5rem" }}>
            <label
              htmlFor="data-plan"
              style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)" }}
            >
              Choose Data Plan
            </label>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>
              Balance: ₦{withdrawable.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="input-wrapper">
            <button
              id="data-plan"
              type="button"
              onClick={() => setShowPlansSheet(true)}
              style={{
                width: "100%",
                background: "var(--bg-elevated)",
                border: "1.5px solid var(--border)",
                borderRadius: "16px",
                color: selectedPlan ? "var(--text-primary)" : "var(--text-secondary)",
                fontSize: "0.9375rem",
                padding: "0.9375rem 1.125rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                textAlign: "left"
              }}
            >
              <span>
                {selectedPlan 
                  ? `${selectedPlan.label} — ₦${selectedPlan.price}` 
                  : "Tap to select a data plan..."}
              </span>
              <CaretRight size={16} weight="bold" color="var(--text-secondary)" />
            </button>
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
            <Info size={16} weight="duotone" style={{ color: "var(--color-primary)" }} />
            <span>
              You will be charged <strong>₦{selectedPlan.price.toLocaleString()}</strong>.
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
                onClick={() => setShowPinPad(true)}
                disabled={isPending}
              >
                Confirm & Pay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Dedicated Transaction PIN Keypad Overlay ─── */}
      {showPinPad && selectedPlan && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "var(--bg-base)",
          zIndex: 110,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem"
        }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-secondary)" }}>
              SECURITY VERIFICATION
            </span>
            <h2 style={{ fontSize: "1.375rem", fontWeight: 800, margin: "0.25rem 0 0.5rem 0" }}>Enter Transaction PIN</h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", margin: 0 }}>
              Paying <strong style={{ color: "var(--text-primary)" }}>₦{selectedPlan.price.toLocaleString()}</strong> to {phone}
            </p>
          </div>

          {/* Dots */}
          <div style={{ display: "flex", gap: "1rem", marginBottom: "3rem" }}>
            {[0, 1, 2, 3].map(idx => (
              <div
                key={idx}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  border: "2px solid var(--border)",
                  backgroundColor: pin.length > idx ? "var(--color-primary)" : "transparent",
                  transform: pin.length > idx ? "scale(1.15)" : "scale(1)",
                  transition: "all var(--duration-fast) var(--ease-smooth)",
                  boxShadow: pin.length > idx ? "0 0 8px var(--color-primary)" : "none"
                }}
              />
            ))}
          </div>

          {/* Keypad */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1.25rem 1.5rem",
            maxWidth: 260,
            width: "100%",
            marginBottom: "2rem"
          }}>
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => {
                  if (pin.length < 4) {
                    const newPin = pin + num;
                    setPin(newPin);
                    if (newPin.length === 4) {
                      triggerExecutePurchase(newPin);
                    }
                  }
                }}
                className="squishy"
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  border: "1.5px solid var(--border)",
                  background: "var(--bg-elevated)",
                  color: "var(--text-primary)",
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                disabled={isPending}
              >
                {num}
              </button>
            ))}

            <button
              type="button"
              onClick={() => {
                setPin("");
                setShowPinPad(false);
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-secondary)",
                fontSize: "0.8125rem",
                fontWeight: 700,
                cursor: "pointer"
              }}
              disabled={isPending}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => {
                if (pin.length < 4) {
                  const newPin = pin + "0";
                  setPin(newPin);
                  if (newPin.length === 4) {
                    triggerExecutePurchase(newPin);
                  }
                }
              }}
              className="squishy"
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                border: "1.5px solid var(--border)",
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
                fontSize: "1.25rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              disabled={isPending}
            >
              0
            </button>

            <button
              type="button"
              onClick={() => setPin(prev => prev.slice(0, -1))}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer"
              }}
              disabled={isPending}
            >
              <Backspace size={22} weight="duotone" />
            </button>
          </div>
          
          {isPending && (
            <div style={{ color: "var(--text-secondary)", fontSize: "0.8125rem", display: "flex", alignItems: "center", gap: "6px" }}>
              <div className="spinner" style={{ width: "16px", height: "16px" }} />
              Verifying PIN & Processing...
            </div>
          )}
        </div>
      )}

      {/* ─── Data Plans Grid Bottom Sheet Overlay ─── */}
      {showPlansSheet && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(4px)",
            zIndex: 120,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center"
          }}
          onClick={() => setShowPlansSheet(false)}
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
              padding: "1.5rem",
              boxShadow: "0 -8px 32px rgba(0,0,0,0.15)",
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 800 }}>Select Data Plan</h2>
              <button
                type="button"
                onClick={() => setShowPlansSheet(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  padding: "4px"
                }}
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            {/* SME Loan Warning Banner */}
            <div style={{
              padding: "0.75rem 1rem",
              backgroundColor: "rgba(245, 158, 11, 0.08)",
              border: "1px solid rgba(245, 158, 11, 0.25)",
              borderRadius: "12px",
              color: "var(--color-warning)",
              fontSize: "0.72rem",
              fontWeight: 700,
              marginBottom: "1rem",
              lineHeight: 1.4
            }}>
              ⚠️ Notice: SME data plans are not recommended for phone numbers that have active network loans, as operator systems may deduct the data bundle to settle loans.
            </div>

            {/* Grid List */}
            <div style={{ overflowY: "auto", flex: 1, paddingBottom: "1rem" }}>
              {activePlans.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: "0.875rem", padding: "2rem 0" }}>
                  No active plans found for this type.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {activePlans.map((plan, idx) => {
                    const isSelected = selectedPlan?.id === plan.id;
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => {
                          setPlanIndex(idx);
                          setShowPlansSheet(false);
                        }}
                        style={{
                          backgroundColor: isSelected ? "var(--color-primary)" : "color-mix(in srgb, var(--bg-surface) 60%, transparent)",
                          color: isSelected ? "white" : "var(--text-primary)",
                          border: "none",
                          borderRadius: "12px",
                          padding: "1rem 1.25rem",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all var(--duration-fast)",
                          boxShadow: isSelected ? "0 4px 16px -4px var(--color-primary)" : "none",
                          width: "100%"
                        }}
                        className="squishy"
                      >
                        <span style={{ fontSize: "0.875rem", fontWeight: 800 }}>
                          {plan.label.replace(/MTN |Airtel |Glo |9mobile /gi, "")}
                        </span>
                        <span style={{
                          fontSize: "0.78rem",
                          fontWeight: 800,
                          backgroundColor: isSelected ? "rgba(255, 255, 255, 0.2)" : "color-mix(in srgb, var(--color-primary) 10%, transparent)",
                          color: isSelected ? "white" : "var(--color-primary)",
                          padding: "4px 10px",
                          borderRadius: "8px"
                        }}>
                          ₦{plan.price.toLocaleString()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ─── Network Mismatch Warning Modal ─────────────────────────── */}
      {mismatchWarning && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 110,
            padding: "1.5rem"
          }}
          onClick={() => setMismatchWarning(null)}
        >
          <div
            className="glass animate-scale-up"
            style={{
              width: "100%",
              maxWidth: "400px",
              backgroundColor: "var(--bg-elevated)",
              borderRadius: "24px",
              border: "1.5px solid var(--border)",
              padding: "1.75rem",
              boxShadow: "var(--shadow-lg)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--color-warning)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <Warning size={20} weight="duotone" /> Network Mismatch
            </h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 1.5rem 0" }}>
              The phone number you entered appears to belong to <strong>{mismatchWarning.detected.toUpperCase()}</strong>, but you have selected <strong>{mismatchWarning.expected.toUpperCase()}</strong>.
              <br /><br />
              Are you sure you want to proceed with <strong>{mismatchWarning.expected.toUpperCase()}</strong>?
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={() => setMismatchWarning(null)}
                className="btn btn-secondary"
                style={{ flex: 1, height: "42px", fontSize: "0.875rem" }}
              >
                No, Close
              </button>
              <button
                onClick={() => {
                  const targetNetwork = mismatchWarning.expected;
                  setMismatchWarning(null);
                  proceedToConfirmation(targetNetwork);
                }}
                className="btn btn-primary"
                style={{ flex: 1, height: "42px", fontSize: "0.875rem", backgroundColor: "var(--color-warning)", borderColor: "var(--color-warning)" }}
              >
                Yes, Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

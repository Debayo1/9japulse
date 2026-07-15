"use client";

import { useState, useEffect, useTransition } from "react";
import Header from "@/components/Header";
import PinKeypad from "@/components/PinKeypad";
import { SkeletonList } from "@/components/SkeletonLoader";
import { toast } from "sonner";
import { createGiftCode, redeemGiftCode, getMyGiftCodes } from "@/lib/giftCodes";
import { Gift, Sparkle, CopySimple, CheckCircle, ShareNetwork } from "@phosphor-icons/react";

interface GiftCodeItem {
  id: string;
  code: string;
  amount: number;
  status: string;
  message: string | null;
  created_at: string;
  profiles?: { full_name: string } | null;
}

export default function GiftCodesPage() {
  const [tab, setTab] = useState<"create" | "redeem">("create");
  const [createAmount, setCreateAmount] = useState("");
  const [message, setMessage] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemResult, setRedeemResult] = useState<{ amount: number; code: string } | null>(null);
  const [createdList, setCreatedList] = useState<GiftCodeItem[]>([]);
  const [redeemedList, setRedeemedList] = useState<GiftCodeItem[]>([]);
  const [showPinPad, setShowPinPad] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, startSaving] = useTransition();

  useEffect(() => {
    startSaving(async () => {
      try {
        const data = await getMyGiftCodes();
        setCreatedList(data.created);
        setRedeemedList(data.redeemed);
      } catch {
        toast.error("Failed to load gift codes");
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const handleCreate = () => {
    const amt = parseFloat(createAmount);
    if (isNaN(amt) || amt < 100) return toast.error("Minimum gift code amount is ₦100");
    setShowPinPad(true);
  };

  const handlePinComplete = (pin: string) => {
    startSaving(async () => {
      try {
        const result = await createGiftCode(parseFloat(createAmount), message || undefined);
        setGeneratedCode(result.code);
        setShowPinPad(false);
        toast.success("Gift code created!");
        const data = await getMyGiftCodes();
        setCreatedList(data.created);
      } catch (e: any) {
        toast.error(e.message);
      }
    });
  };

  const handleRedeem = () => {
    if (!redeemCode.trim()) return toast.error("Enter a gift code");
    startSaving(async () => {
      try {
        const result = await redeemGiftCode(redeemCode);
        setRedeemResult(result);
        toast.success(`₦${result.amount.toLocaleString()} credited!`);
        const data = await getMyGiftCodes();
        setRedeemedList(data.redeemed);
      } catch (e: any) {
        toast.error(e.message);
      }
    });
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied!");
  };

  const handleShare = (code: string, amount: number) => {
    if (navigator.share) {
      navigator.share({ title: "9jaPulse Gift Code", text: `I sent you a 9jaPulse gift code! Use code: ${code} worth ₦${amount.toLocaleString()}` });
    } else {
      handleCopy(code);
    }
  };

  const statusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: "badge-success",
      redeemed: "",
      expired: "badge-warning",
      cancelled: "badge-danger",
    };
    const labels: Record<string, string> = {
      active: "Active",
      redeemed: "Redeemed",
      expired: "Expired",
      cancelled: "Cancelled",
    };
    return <span className={`badge ${variants[status] ?? ""}`} style={status === "redeemed" ? { background: "color-mix(in srgb, var(--color-primary) 10%, transparent)", color: "var(--color-primary)" } : undefined}>{labels[status] ?? status}</span>;
  };

  return (
    <div className="page">
      <Header title="Gift Codes" />

      {/* Tabs */}
      <div className="glass-sm" style={{ display: "flex", marginBottom: "1rem", padding: "0.25rem" }}>
        {(["create", "redeem"] as const).map((t) => (
          <button key={t} className="btn btn-ghost" style={{ flex: 1, height: "40px", fontSize: "0.8125rem", background: tab === t ? "var(--bg-elevated)" : "transparent", border: tab === t ? "1px solid var(--border)" : "none" }} onClick={() => { setTab(t); setGeneratedCode(null); setRedeemResult(null); }}>
            {t === "create" ? "Create" : "Redeem"}
          </button>
        ))}
      </div>

      {tab === "create" && (
        <section className="animate-fade-in">
          <div className="card" style={{ marginBottom: "1rem" }}>
            <label className="input-label">Amount (₦)</label>
            <input className="input" type="number" placeholder="100" min={100} value={createAmount} onChange={(e) => setCreateAmount(e.target.value.replace(/[^0-9]/g, ""))} style={{ marginBottom: "0.75rem" }} />
            <label className="input-label">Message (optional)</label>
            <textarea className="input" placeholder="Happy birthday! 🎉" rows={2} value={message} onChange={(e) => setMessage(e.target.value)} style={{ resize: "none", marginBottom: "0.75rem" }} />
            <button className="btn btn-primary btn-full" onClick={handleCreate} disabled={!createAmount}>
              <Sparkle size={16} />
              Generate Code
            </button>
          </div>

          {generatedCode && (
            <div className="glass animate-fade-in" style={{ padding: "1.5rem", textAlign: "center", marginBottom: "1rem" }}>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>New Gift Code</p>
              <p style={{ fontSize: "2rem", fontWeight: 900, letterSpacing: "0.12em", fontFamily: "monospace", margin: "0 0 0.5rem", color: "var(--text-primary)" }}>{generatedCode}</p>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>Worth ₦{parseFloat(createAmount).toLocaleString()}</p>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                <button className="btn btn-secondary" onClick={() => handleCopy(generatedCode)}>
                  <CopySimple size={16} />
                  Copy
                </button>
                <button className="btn btn-primary" onClick={() => handleShare(generatedCode, parseFloat(createAmount))}>
                  <ShareNetwork size={16} />
                  Share
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {tab === "redeem" && (
        <section className="animate-fade-in">
          <div className="card" style={{ marginBottom: "1rem" }}>
            <label className="input-label">Gift Code</label>
            <input className="input" placeholder="Enter code" value={redeemCode} onChange={(e) => setRedeemCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} style={{ marginBottom: "0.75rem" }} />
            <button className="btn btn-primary btn-full" onClick={handleRedeem} disabled={redeemCode.length < 8 || saving}>
              <Gift size={16} />
              Redeem
            </button>
          </div>

          {redeemResult && (
            <div className="glass animate-fade-in" style={{ padding: "1.5rem", textAlign: "center", marginBottom: "1rem" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "color-mix(in srgb, var(--color-success) 12%, transparent)", color: "var(--color-success)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem" }}>
                <CheckCircle size={28} weight="fill" />
              </div>
              <p style={{ fontWeight: 800, fontSize: "1.375rem", margin: "0 0 0.25rem" }}>₦{redeemResult.amount.toLocaleString()}</p>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", margin: 0 }}>Code: {redeemResult.code}</p>
            </div>
          )}
        </section>
      )}

      {/* History */}
      <div style={{ marginTop: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <Gift size={16} style={{ color: "var(--text-secondary)" }} />
          <h3 style={{ margin: 0 }}>My Gift Codes</h3>
        </div>

        {loading ? (
          <SkeletonList rows={3} />
        ) : createdList.length === 0 && redeemedList.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "2rem 1rem" }}>
            <Gift size={32} style={{ color: "var(--text-muted)", marginBottom: "0.5rem" }} />
            <p style={{ fontSize: "0.875rem", margin: 0 }}>No gift codes yet</p>
            {tab === "create" && <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Create one above to get started</p>}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {[...createdList, ...redeemedList].slice(0, 20).map((item) => (
              <div key={item.id} className="card" style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: "0.8125rem", margin: 0, fontFamily: "monospace" }}>{item.code}</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "2px 0 0" }}>
                    ₦{item.amount.toLocaleString()} &middot; {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
                {statusBadge(item.status)}
              </div>
            ))}
          </div>
        )}
      </div>

      <PinKeypad
        show={showPinPad}
        title="Confirm Gift Code"
        onPinComplete={handlePinComplete}
        onClose={() => setShowPinPad(false)}
        loading={saving}
        loadingTitle="Creating Gift Code"
        loadingSubtitle={`Deducting ₦${parseFloat(createAmount || "0").toLocaleString()}`}
      >
        ₦{parseFloat(createAmount || "0").toLocaleString()} will be deducted
      </PinKeypad>
    </div>
  );
}

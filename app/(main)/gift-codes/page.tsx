"use client";

import { useState, useEffect, useCallback } from "react";
import { Gift, Sparkle, CopySimple, CheckCircle } from "@phosphor-icons/react";
import { toast } from "sonner";
import { createGiftCode, redeemGiftCode, getMyGiftCodes } from "@/lib/giftCodes";
import Header from "@/components/Header";

type Tab = "create" | "redeem";

interface GiftCodeItem {
  id: string;
  code: string;
  amount: number;
  status: "active" | "redeemed" | "expired" | "cancelled";
  message: string | null;
  created_at: string;
  redeemed_at: string | null;
}

export default function GiftCodesPage() {
  const [tab, setTab] = useState<Tab>("create");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<{ code: string; amount: number } | null>(null);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemed, setRedeemed] = useState<{ amount: number; code: string } | null>(null);
  const [createdList, setCreatedList] = useState<GiftCodeItem[]>([]);
  const [redeemedList, setRedeemedList] = useState<GiftCodeItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCodes = useCallback(async () => {
    try {
      const data = await getMyGiftCodes();
      setCreatedList(data.created);
      setRedeemedList(data.redeemed);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  const handleGenerate = async () => {
    const amt = Number(amount);
    if (!amt || amt < 100) { toast.error("Minimum amount is ₦100"); return; }
    setGenerating(true);
    try {
      const result = await createGiftCode(amt, message || undefined);
      setGenerated(result);
      toast.success("Gift code created!");
      fetchCodes();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleRedeem = async () => {
    if (!redeemCode.trim()) return;
    setRedeeming(true);
    try {
      const result = await redeemGiftCode(redeemCode);
      setRedeemed(result);
      toast.success(`₦${result.amount} received!`);
      fetchCodes();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setRedeeming(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied!");
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: "bg-emerald-500/20 text-emerald-400",
      redeemed: "bg-blue-500/20 text-blue-400",
      expired: "bg-yellow-500/20 text-yellow-400",
      cancelled: "bg-red-500/20 text-red-400",
    };
    return `badge ${map[status] || "bg-white/10 text-zinc-400"}`;
  };

  return (
    <div className="page bg-zinc-950">
      <Header title="Gift Codes" />

      {/* Tabs */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-1 flex mb-6">
        {(["create", "redeem"] as Tab[]).map((t) => (
          <button
            key={t}
            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              tab === t
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                : "text-zinc-400"
            }`}
            onClick={() => setTab(t)}
          >
            {t === "create" ? "Create" : "Redeem"}
          </button>
        ))}
      </div>

      {tab === "create" && (
        <div className="space-y-4 animate-fade-in">
          {!generated ? (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Sparkle size={20} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">New Gift Code</p>
                  <p className="text-zinc-400 text-xs">Create a code to send to someone</p>
                </div>
              </div>

              <label className="input-label text-zinc-400">Amount (₦)</label>
              <input
                className="input mb-4"
                type="number"
                placeholder="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />

              <label className="input-label text-zinc-400">Message (optional)</label>
              <textarea
                className="input mb-4 resize-none"
                rows={3}
                placeholder="Happy birthday! 🎉"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />

              <button
                className="btn btn-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold"
                onClick={handleGenerate}
                disabled={generating || !amount}
              >
                {generating ? "Generating..." : "Generate Code"}
              </button>
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 text-center animate-scale-in">
              <CheckCircle size={28} className="text-emerald-400 mx-auto mb-3" weight="fill" />
              <p className="text-white font-semibold">Code Generated!</p>
              <p className="text-zinc-400 text-sm mb-4">₦{generated.amount.toLocaleString()} gift code</p>

              <div
                className="bg-white/10 rounded-xl py-4 px-6 mb-4 cursor-pointer border border-white/10"
                onClick={() => copyCode(generated.code)}
              >
                <p className="text-white text-2xl font-bold tracking-widest font-mono">
                  {generated.code}
                </p>
              </div>

              <button
                className="btn btn-full bg-white/10 text-white"
                onClick={() => copyCode(generated.code)}
              >
                <CopySimple size={18} />
                Copy Code
              </button>

              <button
                className="btn btn-full text-zinc-400 mt-2"
                onClick={() => { setGenerated(null); setAmount(""); setMessage(""); }}
              >
                Create Another
              </button>
            </div>
          )}
        </div>
      )}

      {tab === "redeem" && (
        <div className="space-y-4 animate-fade-in">
          {!redeemed ? (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Gift size={20} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">Redeem Code</p>
                  <p className="text-zinc-400 text-xs">Enter a gift code you received</p>
                </div>
              </div>

              <input
                className="input mb-4 text-center text-lg tracking-widest uppercase font-mono"
                placeholder="XXXXXXXX"
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))}
                onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
              />

              <button
                className="btn btn-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold"
                onClick={handleRedeem}
                disabled={redeeming || redeemCode.length < 8}
              >
                {redeeming ? "Redeeming..." : "Redeem"}
              </button>
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 text-center animate-scale-in">
              <CheckCircle size={28} className="text-emerald-400 mx-auto mb-3" weight="fill" />
              <p className="text-white font-semibold text-lg">₦{redeemed.amount.toLocaleString()} Received!</p>
              <p className="text-zinc-400 text-sm mb-4">Code: {redeemed.code}</p>
              <button className="btn btn-full bg-white/10 text-white" onClick={() => setRedeemed(null)}>
                Redeem Another
              </button>
            </div>
          )}
        </div>
      )}

      {/* History */}
      <section className="mt-6 space-y-3">
        <h2 className="text-white font-semibold text-sm flex items-center gap-2">
          <Gift size={16} className="text-zinc-400" />
          My Gift Codes
        </h2>

        {loading ? (
          <div className="bg-white/5 rounded-2xl p-8 text-center text-zinc-500 text-sm">Loading...</div>
        ) : createdList.length === 0 && redeemedList.length === 0 ? (
          <div className="bg-white/5 rounded-2xl p-8 text-center text-zinc-500 text-sm">No gift codes yet</div>
        ) : (
          <>
            {createdList.map((item) => (
              <div
                key={item.id}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-white font-mono text-sm tracking-wider">{item.code}</p>
                  <p className="text-zinc-400 text-xs mt-0.5">₦{item.amount.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={statusBadge(item.status)}>{item.status}</span>
                  <button
                    className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                    onClick={() => copyCode(item.code)}
                  >
                    <CopySimple size={14} className="text-zinc-400" />
                  </button>
                </div>
              </div>
            ))}
            {redeemedList.length > 0 && (
              <div className="mt-4">
                <p className="text-zinc-500 text-xs mb-2 uppercase tracking-wider">Redeemed by you</p>
                {redeemedList.map((item: any) => (
                  <div
                    key={item.id}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 flex items-center justify-between mb-2"
                  >
                    <div>
                      <p className="text-white font-mono text-sm tracking-wider">{item.code}</p>
                      <p className="text-zinc-400 text-xs mt-0.5">
                        ₦{item.amount.toLocaleString()} — {item.profiles?.full_name || "Someone"}
                      </p>
                    </div>
                    <span className={statusBadge(item.status)}>{item.status}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

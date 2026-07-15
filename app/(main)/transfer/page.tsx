"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowsLeftRight, User, CheckCircle } from "@phosphor-icons/react";
import { toast } from "sonner";
import { lookupUser, transferFunds } from "@/lib/transfers";
import Header from "@/components/Header";

interface Recipient {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
}

export default function TransferPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [sending, setSending] = useState(false);

  const handleLookup = async () => {
    if (!username.trim()) return;
    setLookingUp(true);
    try {
      const result = await lookupUser(username);
      setRecipient(result);
      setStep(2);
      toast.success("User found");
    } catch (e: any) {
      toast.error(e.message);
      setRecipient(null);
    } finally {
      setLookingUp(false);
    }
  };

  const handleTransfer = async () => {
    if (!amount || !pin || !recipient) return;
    setSending(true);
    try {
      const result = await transferFunds(
        recipient.username,
        Number(amount.replace(/,/g, "")),
        pin
      );
      toast.success(`Transfer successful! Ref: ${result.reference}`);
      setStep(4);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setStep(1);
    setUsername("");
    setRecipient(null);
    setAmount("");
    setPin("");
  };

  return (
    <div className="page bg-zinc-950">
      <Header title="Transfer Funds" />

      {/* Steps indicator */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${
              step >= s ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-white/10"
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <User size={20} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-white font-semibold">Recipient</p>
              <p className="text-zinc-400 text-sm">Enter their 9jaPulse username</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="@username"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            />
            <button
              className="btn bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold px-5"
              onClick={handleLookup}
              disabled={lookingUp || !username.trim()}
            >
              {lookingUp ? "..." : "Find"}
            </button>
          </div>
        </div>
      )}

      {step === 2 && recipient && (
        <div className="animate-fade-in space-y-4">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg">
                {(recipient.full_name || recipient.username).charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-white font-semibold text-lg">{recipient.full_name || recipient.username}</p>
                <p className="text-zinc-400 text-sm">@{recipient.username}</p>
              </div>
              <CheckCircle size={20} className="text-emerald-400 ml-auto" weight="fill" />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
            <label className="input-label text-zinc-400">Amount (₦)</label>
            <input
              className="input text-lg font-semibold"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-zinc-500 text-xs mt-2">No fee on transfers</p>
          </div>

          <button
            className="btn btn-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold"
            onClick={() => setStep(3)}
            disabled={!amount || Number(amount) < 1}
          >
            Continue
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 animate-fade-in">
          <div className="text-center mb-6">
            <p className="text-zinc-400 text-sm">Amount to send</p>
            <p className="text-white text-3xl font-bold mt-1">₦{Number(amount).toLocaleString()}</p>
            <p className="text-zinc-500 text-xs mt-1">to @{recipient?.username}</p>
          </div>

          <label className="input-label text-zinc-400">Transaction PIN</label>
          <input
            className="input text-center tracking-widest text-lg"
            type="password"
            maxLength={4}
            inputMode="numeric"
            placeholder="• • • •"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          />

          <div className="bg-white/5 rounded-xl p-3 mt-4 flex items-center gap-2">
            <ArrowsLeftRight size={16} className="text-zinc-500" />
            <p className="text-zinc-400 text-xs">Free transfer — no fees deducted</p>
          </div>

          <button
            className="btn btn-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold mt-5"
            onClick={handleTransfer}
            disabled={sending || pin.length < 4}
          >
            {sending ? "Sending..." : "Confirm Transfer"}
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-emerald-400" weight="fill" />
          </div>
          <p className="text-white text-xl font-bold">Transfer Sent!</p>
          <p className="text-zinc-400 mt-1">₦{Number(amount).toLocaleString()} to @{recipient?.username}</p>
          <button className="btn bg-white/10 text-white mt-6 w-full" onClick={reset}>
            Send Another
          </button>
        </div>
      )}
    </div>
  );
}

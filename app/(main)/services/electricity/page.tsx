"use client";

import { Lightning } from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import Header from "@/components/Header";

export default function ElectricityPage() {
  const router = useRouter();
  const [disco, setDisco] = useState("");
  const [meterNumber, setMeterNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");

  const discos = [
    { id: "ikeja-electric", label: "Ikeja Electric" },
    { id: "eko-electric", label: "Eko Electric" },
    { id: "abuja-electric", label: "Abuja Electric" },
    { id: "ibadan-electric", label: "Ibadan Electric" },
    { id: "kano-electric", label: "Kano Electric" },
    { id: "portharcourt-electric", label: "Port Harcourt Electric" },
    { id: "enugu-electric", label: "Enugu Electric" },
    { id: "jos-electric", label: "Jos Electric" },
    { id: "kaduna-electric", label: "Kaduna Electric" },
    { id: "benin-electric", label: "Benin Electric" },
  ];

  const handleSubmit = () => {
    if (!disco) { toast.error("Select your electricity provider"); return; }
    if (meterNumber.length < 6) { toast.error("Enter a valid meter number"); return; }
    if (phone.length !== 11) { toast.error("Enter a valid 11-digit phone number"); return; }
    if (!amount || Number(amount) < 500) { toast.error("Minimum purchase is ₦500"); return; }
    toast.success("Electricity purchase coming soon!");
  };

  return (
    <div className="page">
      <Header title="Buy Electricity" showBack />
      <div style={{ marginTop: "1rem" }}>
        <label className="input-label">Provider</label>
        <select
          className="input"
          value={disco}
          onChange={(e) => setDisco(e.target.value)}
          style={{ marginBottom: "0.75rem" }}
        >
          <option value="">Select provider</option>
          {discos.map((d) => (
            <option key={d.id} value={d.id}>{d.label}</option>
          ))}
        </select>

        <label className="input-label">Meter Number</label>
        <input
          className="input"
          type="text"
          inputMode="numeric"
          placeholder="Enter meter number"
          value={meterNumber}
          onChange={(e) => setMeterNumber(e.target.value.replace(/\D/g, ""))}
          style={{ marginBottom: "0.75rem" }}
        />

        <label className="input-label">Phone Number</label>
        <input
          className="input"
          type="tel"
          inputMode="numeric"
          placeholder="080 1234 5678"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
          style={{ marginBottom: "0.75rem" }}
        />

        <label className="input-label">Amount (₦)</label>
        <input
          className="input"
          type="text"
          inputMode="numeric"
          placeholder="Min ₦500"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
          style={{ marginBottom: "1.5rem" }}
        />

        <button className="btn btn-primary btn-full" onClick={handleSubmit} style={{ height: 48 }}>
          <Lightning size={18} weight="duotone" />
          Purchase Electricity
        </button>
      </div>
    </div>
  );
}

"use client";

import { Television } from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import Header from "@/components/Header";

export default function CablePage() {
  const router = useRouter();
  const [provider, setProvider] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [package_, setPackage_] = useState("");

  const providers = [
    { id: "gotv", label: "GOtv", packages: ["GOtv Lite", "GOtv Plus", "GOtv Max", "GOtv Supa"] },
    { id: "dstv", label: "DStv", packages: ["DStv Access", "DStv Family", "DStv Compact", "DStv Compact Plus", "DStv Premium"] },
    { id: "startimes", label: "StarTimes", packages: ["StarTimes Nova", "StarTimes Classic", "StarTimes Elite"] },
  ];

  const currentPackages = providers.find((p) => p.id === provider)?.packages || [];

  const handleSubmit = () => {
    if (!provider) { toast.error("Select your cable provider"); return; }
    if (cardNumber.length < 6) { toast.error("Enter a valid smart card number"); return; }
    if (phone.length !== 11) { toast.error("Enter a valid 11-digit phone number"); return; }
    if (!package_) { toast.error("Select a package"); return; }
    toast.success("Cable TV purchase coming soon!");
  };

  return (
    <div className="page">
      <Header title="Cable TV" showBack />
      <div style={{ marginTop: "1rem" }}>
        <label className="input-label">Provider</label>
        <select
          className="input"
          value={provider}
          onChange={(e) => { setProvider(e.target.value); setPackage_(""); }}
          style={{ marginBottom: "0.75rem" }}
        >
          <option value="">Select provider</option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>

        {provider && (
          <>
            <label className="input-label">Smart Card Number</label>
            <input
              className="input"
              type="text"
              inputMode="numeric"
              placeholder="Enter smart card number"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ""))}
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

            <label className="input-label">Package</label>
            <select
              className="input"
              value={package_}
              onChange={(e) => setPackage_(e.target.value)}
              style={{ marginBottom: "1.5rem" }}
            >
              <option value="">Select package</option>
              {currentPackages.map((pkg) => (
                <option key={pkg} value={pkg}>{pkg}</option>
              ))}
            </select>

            <button className="btn btn-primary btn-full" onClick={handleSubmit} style={{ height: 48 }}>
              <Television size={18} weight="duotone" />
              Subscribe
            </button>
          </>
        )}
      </div>
    </div>
  );
}

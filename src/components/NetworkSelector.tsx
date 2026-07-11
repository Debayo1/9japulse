"use client";
import Image from "next/image";

export const NETWORKS = [
  { id: "mtn", label: "MTN", color: "#FFCC00", textColor: "#000000" },
  { id: "airtel", label: "Airtel", color: "#E30A17", textColor: "#FFFFFF" },
  { id: "glo", label: "Glo", color: "#4E9C23", textColor: "#FFFFFF" },
  { id: "9mobile", label: "9mobile", color: "#005F53", textColor: "#FFFFFF" },
];

interface NetworkSelectorProps {
  selected: string;
  onChange: (id: string) => void;
}

export default function NetworkSelector({ selected, onChange }: NetworkSelectorProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.625rem" }}>
      {NETWORKS.map((net) => {
        const active = selected === net.id;
        return (
          <button
            key={net.id}
            type="button"
            aria-label={net.label}
            onClick={() => onChange(net.id)}
            style={{
              backgroundColor: active ? "var(--bg-elevated)" : "var(--bg-surface)",
              color: "var(--text-primary)",
              border: active ? "2px solid var(--color-primary)" : "none",
              height: "72px",
              borderRadius: "16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.375rem",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
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
  );
}

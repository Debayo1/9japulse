"use client";

import { Plus, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";

export default function CardActions() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
      <button
        className="btn btn-primary"
        style={{ flexDirection: "column", gap: "0.5rem", height: 72 }}
        onClick={() => toast.info("Card issuance coming soon!")}
      >
        <Plus size={20} weight="bold" />
        <span style={{ fontSize: "0.8125rem" }}>Request Card</span>
      </button>
      <button
        className="btn btn-secondary"
        style={{ flexDirection: "column", gap: "0.5rem", height: 72 }}
        onClick={() => toast.info("Card funding coming soon!")}
      >
        <ArrowUpRight size={20} weight="regular" />
        <span style={{ fontSize: "0.8125rem" }}>Fund Card</span>
      </button>
    </div>
  );
}

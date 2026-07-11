"use client";

import { Books } from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import Header from "@/components/Header";

export default function ExamPage() {
  const router = useRouter();

  const handleSubmit = () => {
    toast.success("Exam PIN purchase coming soon!");
  };

  return (
    <div className="page">
      <Header title="Exam PIN" showBack />
      <div style={{ marginTop: "1rem" }}>
        <div className="card" style={{ padding: "1.5rem", textAlign: "center", marginBottom: "1.5rem" }}>
          <Books size={32} weight="duotone" color="var(--color-warning)" />
          <h3 style={{ marginTop: "0.75rem" }}>Buy Exam PINs</h3>
          <p style={{ fontSize: "0.8125rem", marginTop: "0.25rem" }}>
            Purchase WAEC, NECO, JAMB, and NABTEB examination pins.
          </p>
        </div>
        <button className="btn btn-primary btn-full" onClick={handleSubmit} style={{ height: 48 }}>
          Buy Exam PIN
        </button>
      </div>
    </div>
  );
}

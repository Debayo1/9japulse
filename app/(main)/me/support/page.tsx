"use client";

import { ChatCircleDots } from "@phosphor-icons/react/dist/ssr";
import Header from "@/components/Header";

export default function SupportPage() {
  return (
    <div className="page" style={{ paddingTop: "5rem" }}>
      <Header title="Help & Support" showBack />
      <div className="card" style={{ padding: "1.5rem", marginTop: "1rem" }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <ChatCircleDots size={40} weight="duotone" color="var(--color-primary)" />
          <h3 style={{ marginTop: "0.75rem" }}>How can we help you?</h3>
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", textAlign: "center", marginBottom: "1.5rem" }}>
          Reach out to us via email or chat. We typically respond within 24 hours.
        </p>
        <a href="mailto:support@9japulse.app" className="btn btn-primary btn-full" style={{ height: 48, textDecoration: "none", marginBottom: "0.75rem" }}>
          Email Support
        </a>
      </div>
    </div>
  );
}

"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle, ShareNetwork, House, ClockCounterClockwise } from "@phosphor-icons/react";
import { toast } from "sonner";
import Header from "@/components/Header";

const NETWORK_LABELS: Record<string, string> = {
  mtn: "MTN",
  airtel: "Airtel",
  glo: "Glo",
  "9mobile": "9mobile",
};

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const type = searchParams.get("type") || "transaction";
  const amount = searchParams.get("amount") || "0";
  const phone = searchParams.get("phone") || "";
  const network = searchParams.get("network") || "";
  const plan = searchParams.get("plan") || "";
  const ref = searchParams.get("ref") || "";
  const dateStr = new Date().toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const formattedAmount = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(parseFloat(amount));

  const networkName = NETWORK_LABELS[network.toLowerCase()] || network;

  const fallbackCopyText = (text: string) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      if (successful) {
        toast.success("Receipt details copied to clipboard!");
      } else {
        throw new Error("Copy command failed");
      }
    } catch (err) {
      console.error("Fallback copy failed:", err);
      toast.error("Failed to copy receipt. Please copy manually.");
    }
  };

  const handleShare = () => {
    const text = `9jaPulse Transaction Receipt\n-------------------------\nType: ${type.toUpperCase()}\nAmount: ${formattedAmount}\nStatus: Successful\nPhone: ${phone}\nNetwork: ${networkName}\n${plan ? `Plan: ${plan}\n` : ""}Ref: ${ref}\nDate: ${dateStr}\nThank you for using 9jaPulse!`;
    if (navigator.share) {
      navigator.share({
        title: "Transaction Receipt",
        text: text,
      }).catch(() => {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          toast.success("Receipt details copied to clipboard!");
        })
        .catch(() => {
          fallbackCopyText(text);
        });
    } else {
      fallbackCopyText(text);
    }
  };

  return (
    <div className="page" style={{ paddingBottom: "2rem" }}>
      <Header title="Receipt" showBack={true} />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "1rem" }}>
        {/* Animated green success icon container */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1rem",
            animation: "pulse 2s infinite ease-in-out",
          }}
        >
          <CheckCircle size={52} weight="fill" color="var(--color-success)" />
        </div>

        <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 0.25rem 0", textAlign: "center" }}>
          Transaction Successful
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: "0 0 1.5rem 0", textAlign: "center" }}>
          Your payment has been processed successfully.
        </p>

        {/* Large Amount */}
        <div style={{ fontSize: "2.25rem", fontWeight: 900, letterSpacing: "-0.03em", color: "var(--text-primary)", marginBottom: "1.5rem", fontVariantNumeric: "tabular-nums" }}>
          {formattedAmount}
        </div>

        {/* Details Card */}
        <div className="card" style={{ width: "100%", padding: "1.25rem", marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 1rem 0" }}>
            Transaction Details
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Service</span>
              <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)", textTransform: "capitalize" }}>
                {type}
              </span>
            </div>

            {network && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Network</span>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {["mtn", "airtel", "glo", "9mobile"].includes(network.toLowerCase()) ? (
                    <Image
                      src={`/networks/${network.toLowerCase()}.png`}
                      alt={networkName}
                      width={18}
                      height={18}
                      style={{ borderRadius: "50%", objectFit: "cover" }}
                    />
                  ) : null}
                  <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    {networkName}
                  </span>
                </div>
              </div>
            )}

            {phone && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Recipient</span>
                <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                  {phone}
                </span>
              </div>
            )}

            {plan && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Plan Details</span>
                <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)", textAlign: "right", maxWidth: "60%" }}>
                  {plan}
                </span>
              </div>
            )}

            <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "0.25rem 0" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Reference</span>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-muted)", fontFamily: "monospace" }}>
                {ref || "N/A"}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Date & Time</span>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                {dateStr}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Status</span>
              <span style={{ fontSize: "0.8125rem", fontWeight: 800, color: "var(--color-success)", textTransform: "uppercase" }}>
                Successful
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <button
            onClick={handleShare}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              width: "100%",
              height: "48px",
              borderRadius: "14px",
              border: "1.5px solid var(--border)",
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
              fontWeight: 700,
              fontSize: "0.9rem",
              cursor: "pointer",
              transition: "transform var(--duration-fast)",
            }}
          >
            <ShareNetwork size={18} />
            Share Receipt
          </button>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Link
              href="/home"
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                height: "48px",
                borderRadius: "14px",
                background: "var(--color-primary)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.9rem",
                textDecoration: "none",
                textAlign: "center",
              }}
            >
              <House size={18} />
              Go Home
            </Link>

            <Link
              href="/history"
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                height: "48px",
                borderRadius: "14px",
                border: "1.5px solid var(--border)",
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                fontWeight: 700,
                fontSize: "0.9rem",
                textDecoration: "none",
                textAlign: "center",
              }}
            >
              <ClockCounterClockwise size={18} />
              History
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
      `}</style>
    </div>
  );
}

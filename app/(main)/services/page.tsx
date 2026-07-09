"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DeviceMobile,
  Globe,
  Lightning,
  Television,
  Student,
  Coins,
  Books,
  SquaresFour,
  Storefront,
} from "@phosphor-icons/react";
import Link from "next/link";
import Header from "@/components/Header";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

const UTILITIES = [
  { label: "Airtime",     Icon: DeviceMobile, href: "/services/airtime",      color: "#EF4444", desc: "Top up instantly" },
  { label: "Data Bundle", Icon: Globe,        href: "/services/data",         color: "#7C3AED", desc: "SME & CG data plans" },
  { label: "Electricity", Icon: Lightning,    href: "/services/electricity",  color: "#F59E0B", desc: "Pay prepaid/postpaid" },
  { label: "Cable TV",    Icon: Television,   href: "/services/cable",        color: "#10B981", desc: "DSTV, GOTV & Startimes" },
];

const OTHER_SERVICES = [
  { label: "Education",   Icon: Student,      href: "/services/education",    color: "#3B82F6", desc: "WAEC, NECO, JAMB" },
  { label: "Betting",     Icon: Coins,        href: "/services/betting",      color: "#06B6D4", desc: "Fund betting wallets" },
  { label: "Exam PIN",    Icon: Books,        href: "/services/exam",         color: "#F97316", desc: "Pin generators" },
  { label: "Marketplace", Icon: Storefront,   href: "/services/marketplace",  color: "#E74C3C", desc: "Direct global imports" },
];

export default function ServicesPage() {
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabaseBrowser.auth.getSession();
      if (!data.session) {
        router.replace("/login");
      }
    }
    checkAuth();
  }, [router]);

  return (
    <div className="page">
      <Header title="All Services" showBack={false} />

      {/* Intro info card */}
      <div
        className="card animate-fade-in"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "1.5rem",
          background: "linear-gradient(135deg, hsl(243 75% 58% / 0.05), hsl(243 75% 58% / 0.01))",
        }}
      >
        <SquaresFour size={24} weight="duotone" color="var(--color-primary)" />
        <div>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, margin: 0 }}>VTU & Bills Center</h2>
          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
            Select any service below to top up or pay bills. Transactions are processed instantly.
          </p>
        </div>
      </div>

      {/* Utilities Category */}
      <section style={{ marginBottom: "1.75rem" }}>
        <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Bills & Utilities
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
          {UTILITIES.map(({ label, Icon, href, color, desc }) => (
            <Link
              key={href}
              href={href}
              className="card service-card"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                padding: "1rem",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  backgroundColor: "var(--bg-elevated)",
                  boxShadow: `0 6px 14px -3px color-mix(in srgb, ${color} 35%, transparent)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: color,
                }}
              >
                <Icon size={20} weight="fill" />
              </div>
              <div>
                <p style={{ fontSize: "0.875rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>{label}</p>
                <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "2px" }}>{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Others Category */}
      <section style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Other Subscriptions
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
          {OTHER_SERVICES.map(({ label, Icon, href, color, desc }) => (
            <Link
              key={href}
              href={href}
              className="card service-card"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                padding: "1rem",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  backgroundColor: "var(--bg-elevated)",
                  boxShadow: `0 6px 14px -3px color-mix(in srgb, ${color} 35%, transparent)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: color,
                }}
              >
                <Icon size={20} weight="fill" />
              </div>
              <div>
                <p style={{ fontSize: "0.875rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>{label}</p>
                <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "2px" }}>{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <style>{`
        .service-card {
          transition: transform var(--duration-fast) var(--ease-spring),
                      box-shadow var(--duration-fast),
                      background var(--duration-fast) var(--ease-smooth);
        }
        .service-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.08);
          background: var(--bg-surface);
        }
        .service-card:active {
          transform: scale(0.96);
        }
      `}</style>
    </div>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { ArrowRight, DeviceMobile, ShieldCheck, Lightning, Trophy, DownloadSimple, HardDrive } from "@phosphor-icons/react";
import IosInstallPrompt from "@/components/IosInstallPrompt";

export default function LandingPage() {
  return (
    <div style={{
      minHeight: "100dvh",
      backgroundColor: "var(--bg-base)",
      color: "var(--text-primary)",
      fontFamily: "var(--font-poppins), sans-serif",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* ─── Navigation Header ─── */}
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1.25rem 1.5rem",
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(20px)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        backgroundColor: "rgba(15, 23, 42, 0.6)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            color: "white",
            fontSize: "1.125rem"
          }}>
            ₦
          </div>
          <span style={{ fontWeight: 800, fontSize: "1.25rem", letterSpacing: "-0.02em" }}>9jaPulse</span>
        </div>

        <Link
          href="/login"
          className="squishy"
          style={{
            textDecoration: "none",
            backgroundColor: "var(--color-primary)",
            color: "white",
            padding: "0.5rem 1rem",
            borderRadius: "12px",
            fontSize: "0.8125rem",
            fontWeight: 700,
            boxShadow: "var(--shadow-glow)"
          }}
        >
          Get Started
        </Link>
      </header>

      {/* ─── Hero Section ─── */}
      <section style={{
        padding: "3.5rem 1.5rem 2rem",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute",
          top: "-20%",
          width: "80%",
          height: "60%",
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 60%)",
          zIndex: 0,
          pointerEvents: "none"
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 540 }}>
          <span style={{
            fontSize: "0.75rem",
            fontWeight: 800,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--color-primary)",
            background: "color-mix(in srgb, var(--color-primary) 10%, transparent)",
            padding: "4px 12px",
            borderRadius: "99px",
            display: "inline-block",
            marginBottom: "1rem"
          }}>
            AUTOMATED BILLS PAYMENT
          </span>
          <h1 style={{
            fontSize: "2.375rem",
            fontWeight: 900,
            lineHeight: 1.15,
            letterSpacing: "-0.04em",
            margin: "0 0 1rem 0",
            background: "linear-gradient(135deg, #FFF 30%, var(--text-secondary) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            Fast, Reliable & Secure Bills Delivery
          </h1>
          <p style={{
            color: "var(--text-secondary)",
            fontSize: "0.9375rem",
            lineHeight: 1.5,
            margin: "0 0 2rem 0"
          }}>
            Purchase airtime, internet data bundles, electricity tokens, exam check PINs, and cable subscriptions instantly at the cheapest discount rates.
          </p>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <Link
              href="/login"
              className="btn btn-primary"
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                padding: "0.75rem 1.25rem",
                fontSize: "0.875rem"
              }}
            >
              Sign In to App
              <ArrowRight size={16} weight="bold" />
            </Link>
            <a
              href="#download"
              className="btn btn-secondary"
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                padding: "0.75rem 1.25rem",
                fontSize: "0.875rem"
              }}
            >
              Get App APK
              <DownloadSimple size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* ─── Features Grid ─── */}
      <section style={{ padding: "2rem 1.5rem", maxWidth: 640, alignSelf: "center", width: "100%" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
          {[
            { title: "Automated Setup", desc: "Sub-second automation on all purchases.", Icon: Lightning, color: "var(--color-primary)" },
            { title: "App Vault PIN", desc: "Secured with transaction PIN & passcode unlock.", Icon: ShieldCheck, color: "var(--color-success)" },
            { title: "No P2P Fees", desc: "Transfer money to peers inside app for ₦0 fee.", Icon: Trophy, color: "var(--color-warning)" },
            { title: "Dynamic Syncing", desc: "Fetch real-time cheaper prices dynamically.", Icon: DeviceMobile, color: "var(--color-info)" }
          ].map((item, idx) => (
            <div key={idx} className="card" style={{ padding: "1.125rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "color-mix(in srgb, var(--bg-base) 80%, transparent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: item.color,
                boxShadow: "0 4px 12px rgba(15,23,42,0.2)"
              }}>
                <item.Icon size={18} weight="bold" />
              </div>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 800, margin: "4px 0 0 0" }}>{item.title}</h3>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Downloads CTA Section ─── */}
      <section id="download" style={{
        padding: "2.5rem 1.5rem",
        borderTop: "1px solid var(--border)",
        backgroundColor: "var(--bg-elevated)",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        alignItems: "center",
        textAlign: "center"
      }}>
        <div style={{ position: "relative", marginBottom: "0.25rem" }}>
          <Image
            src="/happy_human.png"
            alt="Happy Customer"
            width={100}
            height={100}
            style={{
              borderRadius: "50%",
              objectFit: "cover",
              border: "3px solid var(--color-primary)",
              boxShadow: "var(--shadow-glow)"
            }}
          />
        </div>
        <div style={{ maxWidth: 460 }}>
          <h2 style={{ fontSize: "1.375rem", fontWeight: 800, margin: 0 }}>Install 9jaPulse</h2>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "0.375rem" }}>
            Add the application to your mobile device for direct offline bill purchases.
          </p>
        </div>

        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          maxWidth: 380,
          width: "100%"
        }}>
          {/* Android Download card */}
          <div className="card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <DownloadSimple size={20} style={{ color: "var(--color-success)" }} />
              <strong style={{ fontSize: "0.875rem" }}>Android App Package</strong>
            </div>
            <button
              onClick={() => {
                toast.success("APK file download started! (Mock)");
                // In actual deployment, link this to direct APK binary path
                window.location.href = "#";
              }}
              className="btn btn-primary"
              style={{ width: "100%", fontSize: "0.8125rem", height: "38px" }}
            >
              Download direct APK file
            </button>
          </div>

          {/* iOS Setup Guide card */}
          <div className="card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem", textAlign: "left" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}>
              <HardDrive size={20} style={{ color: "var(--color-primary)" }} />
              <strong style={{ fontSize: "0.875rem" }}>iOS Standalone PWA Setup</strong>
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
              Add to Home Screen to convert the web application into a full native app:
            </p>
            <ol style={{ fontSize: "0.75rem", margin: 0, paddingLeft: "1.15rem", color: "var(--text-secondary)" }}>
              <li style={{ marginBottom: "0.25rem" }}>Open Safari browser and navigate to this website URL.</li>
              <li style={{ marginBottom: "0.25rem" }}>Tap the <strong>Share</strong> button (box with an arrow pointing up).</li>
              <li style={{ marginBottom: "0.25rem" }}>Scroll down and select <strong>Add to Home Screen</strong>.</li>
              <li>Enjoy 9jaPulse directly from your app drawer!</li>
            </ol>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        marginTop: "auto",
        padding: "1.5rem",
        textAlign: "center",
        borderTop: "1px solid var(--border)",
        fontSize: "0.75rem",
        color: "var(--text-muted)"
      }}>
        © 2026 9jaPulse. All rights reserved. Developed to match the highest premium standards.
      </footer>
      <IosInstallPrompt />
    </div>
  );
}

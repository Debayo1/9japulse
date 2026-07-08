"use client";

import { useEffect, useState } from "react";
import { X, Export, PlusSquare } from "@phosphor-icons/react";

export default function IosInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !navigator) return;

    // Detect if iOS (iPhone/iPad/iPod)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    // Check if running in standalone mode (installed PWA)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches 
      || (navigator as any).standalone === true;

    // Check if user dismissed it during this session
    const isDismissed = sessionStorage.getItem("ios_pwa_prompt_dismissed") === "true";

    if (isIOS && !isStandalone && !isDismissed) {
      setShowPrompt(true);
    }
  }, []);

  const dismissPrompt = () => {
    sessionStorage.setItem("ios_pwa_prompt_dismissed", "true");
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: "20px",
      left: "20px",
      right: "20px",
      zIndex: 1000,
      backgroundColor: "var(--bg-elevated)",
      border: "1.5px solid var(--border)",
      borderRadius: "16px",
      padding: "1rem 1.25rem",
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem",
      animation: "slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: "12px",
            background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            color: "white",
            fontSize: "1.25rem"
          }}>
            ₦
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 800 }}>Install 9jaPulse</h4>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-secondary)" }}>Add to Home Screen for standalone experience</p>
          </div>
        </div>
        <button 
          onClick={dismissPrompt}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            padding: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          aria-label="Dismiss prompt"
        >
          <X size={18} />
        </button>
      </div>

      <div style={{
        fontSize: "0.78rem",
        color: "var(--text-secondary)",
        lineHeight: 1.4,
        borderTop: "1.5px solid var(--border)",
        paddingTop: "0.75rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <span>1. Tap Safari's share button</span>
          <Export size={16} style={{ color: "var(--color-primary)" }} />
          <span>at the bottom of your screen.</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span>2. Choose</span>
          <strong style={{ color: "var(--text-primary)" }}>Add to Home Screen</strong>
          <PlusSquare size={16} style={{ color: "var(--color-primary)" }} />
        </div>
      </div>
    </div>
  );
}

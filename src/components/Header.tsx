"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Moon,
  Sun as SunIcon,
  ChatDots,
  Bell,
} from "@phosphor-icons/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { applyThemePreference, getStoredThemePreference, resolveTheme } from "@/lib/theme";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  type?: "default" | "dashboard";
  userName?: string;
}

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export default function Header({
  title = "Dashboard",
  showBack = true,
  type = "default",
  userName = "User",
}: HeaderProps) {
  const router = useRouter();
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return resolveTheme(getStoredThemePreference()) === "dark";
  });

  useEffect(() => {
    const onThemeChange = () => {
      const pref = getStoredThemePreference();
      setDark(resolveTheme(pref) === "dark");
    };

    window.addEventListener("storage", onThemeChange);
    document.addEventListener("9japulse-theme-change", onThemeChange);

    return () => {
      window.removeEventListener("storage", onThemeChange);
      document.removeEventListener("9japulse-theme-change", onThemeChange);
    };
  }, []);

  const toggleTheme = () => {
    const nextPref = dark ? "light" : "dark";
    const resolved = applyThemePreference(nextPref);
    setDark(resolved === "dark");
  };

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        margin: "-1.25rem -1.25rem 1.25rem -1.25rem",
        background: "var(--bg-glass)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border-glass)",
        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.015)",
        transition: "background-color var(--duration-normal), border-color var(--duration-normal)",
      }}
    >
      {/* ─── Navigation Header ──────────────────────────────────────────── */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "56px",
          padding: "0 1.25rem",
        }}
      >
        {type === "dashboard" ? (
          <>
            {/* Left: profile avatar & welcome */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "0.8125rem",
                  boxShadow: "0 4px 12px hsl(243 75% 58% / 0.25)",
                  flexShrink: 0,
                }}
              >
                {getInitials(userName)}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1px", minWidth: 0 }}>
                <span style={{ fontSize: "0.6875rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                  Welcome back 👋
                </span>
                <span style={{ fontSize: "0.875rem", color: "var(--text-primary)", fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {userName.split(" ")[0] || "User"}
                </span>
              </div>
            </div>

            {/* Right: Actions */}
            <div style={{ display: "flex", gap: "4px", alignItems: "center", flexShrink: 0 }}>
              <button
                onClick={toggleTheme}
                className="header-btn"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                aria-label="Toggle theme"
              >
                {dark ? <SunIcon size={20} weight="fill" /> : <Moon size={20} weight="regular" />}
              </button>

              <button
                onClick={() => toast.info("Support chat coming soon")}
                className="header-btn"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                aria-label="Support chat"
              >
                <ChatDots size={20} weight="regular" />
              </button>

              <button
                onClick={() => toast.info("No new notifications")}
                className="header-btn"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
                aria-label="Notifications"
              >
                <Bell size={20} weight="regular" />
                <span style={{
                  position: "absolute",
                  top: "7px",
                  right: "7px",
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  backgroundColor: "var(--color-danger)",
                  border: "1.5px solid var(--bg-base)",
                }} />
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Left button container */}
            <div style={{ width: "40px", display: "flex", justifyContent: "flex-start" }}>
              {showBack && (
                <button
                  onClick={() => router.back()}
                  style={{
                    background: "var(--bg-surface)",
                    border: "1.5px solid var(--border)",
                    cursor: "pointer",
                    color: "var(--text-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    width: "34px",
                    height: "34px",
                  }}
                  className="header-btn"
                  aria-label="Go back"
                >
                  <ArrowLeft size={18} weight="bold" />
                </button>
              )}
            </div>

            {/* Centered Title */}
            <h1
              style={{
                fontSize: "1rem",
                fontWeight: 800,
                color: "var(--text-primary)",
                textAlign: "center",
                flex: 1,
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              {title}
            </h1>

            {/* Right button container */}
            <div style={{ width: "40px", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={toggleTheme}
                style={{
                  background: "var(--bg-surface)",
                  border: "1.5px solid var(--border)",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "34px",
                  height: "34px",
                }}
                className="header-btn"
                aria-label="Toggle theme"
              >
                {dark ? <SunIcon size={18} weight="fill" /> : <Moon size={18} weight="regular" />}
              </button>
            </div>
          </>
        )}
      </header>

      <style>{`
        .header-btn {
          transition: background-color var(--duration-fast) var(--ease-smooth),
                      transform var(--duration-fast) var(--ease-spring);
        }
        .header-btn:hover {
          background-color: var(--bg-surface) !important;
        }
        .header-btn:active {
          transform: scale(0.88);
        }
      `}</style>
    </div>
  );
}

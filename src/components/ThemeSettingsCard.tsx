"use client";

import { useState } from "react";
import { applyThemePreference, getStoredThemePreference, resolveTheme, type ThemePreference } from "@/lib/theme";

const OPTIONS: Array<{ value: ThemePreference; label: string; description: string }> = [
  { value: "system", label: "Follow system", description: "Match your phone or browser theme automatically." },
  { value: "light", label: "Light mode", description: "Bright surfaces with a warm editorial feel." },
  { value: "dark", label: "Dark mode", description: "A deeper dashboard look for night use." },
];

export default function ThemeSettingsCard() {
  const [preference, setPreference] = useState<ThemePreference>(() => getStoredThemePreference());
  const [resolved, setResolved] = useState<"light" | "dark">(() => resolveTheme(getStoredThemePreference()));

  const chooseTheme = (next: ThemePreference) => {
    setPreference(next);
    const nextResolved = applyThemePreference(next);
    setResolved(nextResolved);
  };

  return (
    <section className="card" style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div>
        <h2 style={{ marginBottom: "0.25rem" }}>Default Theme</h2>
        <p style={{ fontSize: "0.8125rem" }}>
          Pick how 9jaPulse should open on this device. The status bar and app shell follow this choice.
        </p>
      </div>

      <div style={{ display: "grid", gap: "0.75rem" }}>
        {OPTIONS.map((option) => {
          const active = preference === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => chooseTheme(option.value)}
              className="card"
              style={{
                textAlign: "left",
                padding: "0.875rem 1rem",
                border: active ? "1.5px solid var(--color-primary)" : "1.5px solid var(--border)",
                background: active ? "hsl(243 75% 58% / 0.08)" : "var(--bg-surface)",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center" }}>
                <div>
                  <p style={{ fontWeight: 700, color: "var(--text-primary)" }}>{option.label}</p>
                  <p style={{ fontSize: "0.75rem", marginTop: "0.15rem" }}>{option.description}</p>
                </div>
                <span className="badge" style={{ alignSelf: "center" }}>
                  {active ? "Active" : "Select"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="glass-sm" style={{ padding: "0.875rem 1rem", border: "1px solid var(--border)" }}>
        <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.25rem" }}>
          Current appearance
        </p>
        <strong>{preference}</strong>
        <p style={{ fontSize: "0.8125rem", marginTop: "0.25rem" }}>
          The resolved theme is <strong>{resolved}</strong>.
        </p>
      </div>
    </section>
  );
}

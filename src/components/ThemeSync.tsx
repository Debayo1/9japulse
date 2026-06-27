"use client";

import { useEffect } from "react";
import { applyThemePreference, getStoredThemePreference, getThemeColor, resolveTheme } from "@/lib/theme";

function syncThemeMeta(resolved: "light" | "dark") {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = getThemeColor(resolved);
}

export default function ThemeSync() {
  useEffect(() => {
    const preference = getStoredThemePreference();
    const resolved = applyThemePreference(preference);
    syncThemeMeta(resolved);

    const onStorage = (event: StorageEvent) => {
      if (event.key !== "9japulse-theme") return;
      const nextPref = getStoredThemePreference();
      const nextResolved = applyThemePreference(nextPref);
      syncThemeMeta(nextResolved);
    };

    const onThemeChange = () => {
      const pref = getStoredThemePreference();
      syncThemeMeta(resolveTheme(pref));
    };

    window.addEventListener("storage", onStorage);
    document.addEventListener("9japulse-theme-change", onThemeChange);

    return () => {
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("9japulse-theme-change", onThemeChange);
    };
  }, []);

  return null;
}

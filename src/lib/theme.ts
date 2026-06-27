export type ThemePreference = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "9japulse-theme";

export function resolveTheme(preference: ThemePreference): "light" | "dark" {
  if (preference === "system") {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  return preference;
}

export function getStoredThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const value = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }
  return "system";
}

export function setStoredThemePreference(preference: ThemePreference) {
  window.localStorage.setItem(THEME_STORAGE_KEY, preference);
}

export function applyThemePreference(preference: ThemePreference) {
  const resolved = resolveTheme(preference);
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
  setStoredThemePreference(preference);
  document.dispatchEvent(
    new CustomEvent("9japulse-theme-change", {
      detail: { preference, resolved },
    })
  );
  return resolved;
}

export function getThemeColor(resolved: "light" | "dark") {
  return resolved === "dark" ? "#0e1623" : "#f7f4ef";
}

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import AuthSync from "@/components/AuthSync";
import ThemeSync from "@/components/ThemeSync";
import "./globals.css";

const inter = Inter({
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "9jaPulse - Your Digital Wallet & VTU Super-App",
  description:
    "Airtime, data, bills & wallet - all in one premium Nigerian fintech super-app.",
  applicationName: "9jaPulse",
  keywords: ["VTU", "airtime", "data", "wallet", "Nigeria", "fintech"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "9jaPulse",
  },
  icons: {
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f4ef" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1623" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <script id="theme-init" nonce="__NONCE__" dangerouslySetInnerHTML={{ __html: `
          (function () {
            try {
              var key = '9japulse-theme';
              var theme = localStorage.getItem(key) || 'system';
              var dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
              document.documentElement.classList.toggle('dark', dark);
              document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
            } catch (e) {}
          })();
        ` }} />
        <AuthSync />
        <ThemeSync />
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "var(--bg-elevated)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-inter)",
              fontSize: "0.9375rem",
            },
          }}
        />
      </body>
    </html>
  );
}

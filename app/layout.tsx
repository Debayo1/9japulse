import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Outfit } from "next/font/google";
import { Toaster } from "sonner";
import AuthSync from "@/components/AuthSync";
import ThemeSync from "@/components/ThemeSync";
import "./globals.css";

const outfit = Outfit({
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
    <html lang="en" className={`${outfit.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <Script id="theme-init" strategy="beforeInteractive">{`
          (function () {
            try {
              var key = '9japulse-theme';
              var theme = localStorage.getItem(key) || 'system';
              var dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
              document.documentElement.classList.toggle('dark', dark);
              document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
            } catch (e) {}
          })();
        `}</Script>
        <AuthSync />
        <ThemeSync />
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "hsl(223 30% 13%)",
              color: "hsl(210 40% 96%)",
              border: "1px solid hsl(223 25% 18%)",
              fontFamily: "var(--font-inter)",
              fontSize: "0.9375rem",
            },
          }}
        />
      </body>
    </html>
  );
}

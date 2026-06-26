import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import AuthSync from "@/components/AuthSync";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "9jaPulse – Your Digital Wallet & VTU Super-App",
  description:
    "Airtime, data, bills & wallet – all in one premium Nigerian fintech super-app.",
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
  themeColor: "#0e1623",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-dvh antialiased">
        <AuthSync />
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

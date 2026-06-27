import { Suspense } from "react";
import WalletCard from "@/components/WalletCard";
import { HistoryList } from "@/components/HistoryList";
import { SkeletonWallet, SkeletonList, SkeletonServices } from "@/components/SkeletonLoader";
import { getWallet, getTransactions } from "@/lib/ledger";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  DeviceMobile,
  Globe,
  Lightning,
  Television,
  Student,
  Coins,
  Books,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import Header from "@/components/Header";
import PromoBanner from "@/components/PromoBanner";

const SERVICES = [
  { label: "Airtime",     Icon: DeviceMobile, href: "/services/airtime",      color: "#EF4444" },
  { label: "Data",        Icon: Globe,        href: "/services/data",         color: "#7C3AED" },
  { label: "Electricity", Icon: Lightning,    href: "/services/electricity",  color: "#F59E0B" },
  { label: "Cable TV",    Icon: Television,   href: "/services/cable",        color: "#10B981" },
  { label: "Education",   Icon: Student,      href: "/services/education",    color: "#3B82F6" },
  { label: "Betting",     Icon: Coins,        href: "/services/betting",      color: "#06B6D4" },
  { label: "Exam PIN",    Icon: Books,        href: "/services/exam",         color: "#F97316" },
] as const;


async function HomeContent() {
  const user = await getUser();
  if (!user) redirect("/login");

  const wallet = await getWallet(user.id);
  const { transactions } = await getTransactions(wallet.id, 0, 2);

  const fullName = (user.user_metadata?.full_name as string) ?? user.email ?? "User";

  return (
    <>
      {/* Top Header */}
      <Header type="dashboard" userName={fullName} />

      {/* Wallet Card */}
      <WalletCard
        walletId={wallet.id}
        balanceTotal={wallet.balance_total}
        balanceWithdrawable={wallet.balance_withdrawable}
        userName={fullName}
      />

      {/* Recent Transactions (Brought up under balance card) */}
      <section style={{ marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <h2 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0 }}>Recent Transactions</h2>
          <Link
            href="/history"
            style={{ fontSize: "0.78rem", color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}
          >
            See all
          </Link>
        </div>
        <HistoryList transactions={transactions} walletId={wallet.id} />
      </section>

      {/* Quick Services */}
      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Quick Services
        </h2>
        <div className="card" style={{ padding: "1.25rem 1rem" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "1.25rem 1rem",
            }}
          >
            {SERVICES.map(({ label, Icon, href, color }) => (
              <Link
                key={href}
                href={href}
                style={{ textDecoration: "none" }}
                className="service-shortcut"
              >
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 16,
                    background: `${color}0D`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "0.4rem",
                    color: color,
                    transition: "all var(--duration-fast) var(--ease-smooth)",
                  }}
                  className="shortcut-icon-wrapper"
                >
                  <Icon size={20} weight="duotone" color={color} />
                </div>
                <span
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    textAlign: "center",
                    display: "block",
                    transition: "color var(--duration-fast) var(--ease-smooth)",
                  }}
                  className="shortcut-label"
                >
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Promo Wealth Banner */}
      <PromoBanner />

      <style>{`
        .service-shortcut {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .service-shortcut:hover .shortcut-icon-wrapper {
          transform: translateY(-2px);
          filter: brightness(1.05);
          box-shadow: 0 8px 16px -4px currentColor;
        }
        .service-shortcut:active .shortcut-icon-wrapper {
          transform: scale(0.95);
          filter: brightness(1.15);
        }
        .service-shortcut:hover .shortcut-label {
          color: var(--text-primary);
        }
      `}</style>

    </>
  );
}

export default function HomePage() {
  return (
    <div className="page">
      <Suspense fallback={<><SkeletonWallet /><SkeletonServices /><SkeletonList /></>}>
        <HomeContent />
      </Suspense>
    </div>
  );
}

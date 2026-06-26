import { UserCircle, CaretRight, SignOut, Gear, Question, ShieldCheck, Bell, ShareNetwork } from "@phosphor-icons/react/dist/ssr";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SkeletonList } from "@/components/SkeletonLoader";
import Link from "next/link";

const MENU_ITEMS = [
  { label: "Account Settings",    Icon: Gear,         href: "/me/settings"   },
  { label: "Security & Privacy",  Icon: ShieldCheck,  href: "/me/security"   },
  { label: "Notifications",       Icon: Bell,         href: "/me/notifs"     },
  { label: "Refer & Earn",        Icon: ShareNetwork, href: "/me/referral"   },
  { label: "Help & Support",      Icon: Question,     href: "/me/support"    },
];

async function ProfileContent() {
  const user = await getUser();
  if (!user) redirect("/login");

  const name = (user.user_metadata?.full_name as string) ?? user.email ?? "User";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      {/* Avatar + Name */}
      <div className="animate-fade-in" style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.375rem",
            fontWeight: 700,
            color: "#fff",
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: "1.125rem" }}>{name}</p>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{user.email}</p>
          <span className="badge badge-success" style={{ marginTop: "0.25rem" }}>Verified</span>
        </div>
      </div>

      {/* Referral code */}
      <div className="glass-sm" style={{ padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.25rem" }}>
          Your Referral Code
        </p>
        <p style={{ fontWeight: 700, fontSize: "1.25rem", letterSpacing: "0.12em", color: "var(--color-primary)" }}>
          9JP–{user.id.slice(0, 6).toUpperCase()}
        </p>
      </div>

      {/* Menu */}
      <div style={{ marginBottom: "1.5rem" }}>
        {MENU_ITEMS.map(({ label, Icon, href }) => (
          <Link
            key={href}
            href={href}
            className="card"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.875rem",
              padding: "0.9rem 1rem",
              marginBottom: "0.5rem",
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "hsl(221 83% 53% / 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={18} weight="duotone" color="var(--color-primary)" />
            </div>
            <span style={{ flex: 1, fontWeight: 500, color: "var(--text-primary)" }}>{label}</span>
            <CaretRight size={16} weight="bold" color="var(--text-muted)" />
          </Link>
        ))}
      </div>

      {/* Logout */}
      <form action="/api/auth/signout" method="POST">
        <button type="submit" className="btn btn-secondary btn-full" style={{ color: "var(--color-danger)", borderColor: "hsl(0 72% 51% / 0.3)" }}>
          <SignOut size={18} weight="regular" />
          Sign Out
        </button>
      </form>
    </>
  );
}

export default function MePage() {
  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
        <UserCircle size={22} weight="duotone" color="var(--color-primary)" />
        <h1 style={{ fontSize: "1.375rem", fontWeight: 700 }}>My Profile</h1>
      </div>
      <Suspense fallback={<SkeletonList rows={6} />}>
        <ProfileContent />
      </Suspense>
    </div>
  );
}

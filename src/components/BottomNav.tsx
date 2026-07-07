"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dashboard, AppDots, CreditCard, User } from "@duo-icons/react";

const NAV_ITEMS = [
  { label: "Home",     href: "/home",     Icon: Dashboard },
  { label: "Services", href: "/services", Icon: AppDots   },
  { label: "Card",     href: "/card",     Icon: CreditCard },
  { label: "Me",       href: "/me",       Icon: User       },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  // Show bottom navigation ONLY on main shell pages
  const showNav = pathname === "/home" || pathname === "/services" || pathname === "/card" || pathname === "/me";
  if (!showNav) return null;

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {NAV_ITEMS.map(({ label, href, Icon }) => {
        const isActive = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`nav-item${isActive ? " active" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon
              size={18}
              aria-hidden="true"
            />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

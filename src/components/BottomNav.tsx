"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  SquaresFour,
  Gift,
  ClockCounterClockwise,
  UserCircle,
} from "@phosphor-icons/react";

const NAV_ITEMS = [
  { label: "Home",    href: "/home",    Icon: House                   },
  { label: "Cards",   href: "/card",    Icon: SquaresFour             },
  { label: "Rewards", href: "/rewards", Icon: Gift                    },
  { label: "History", href: "/history", Icon: ClockCounterClockwise   },
  { label: "Profile", href: "/me",      Icon: UserCircle              },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/services/")) return null;

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {NAV_ITEMS.map(({ label, href, Icon }, idx) => {
        const isActive = pathname.startsWith(href);
        const isCenter = idx === 2;
        return (
          <Link
            key={href}
            href={href}
            className={isCenter ? `nav-item-center${isActive ? " active" : ""}` : `nav-item${isActive ? " active" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon
              size={isCenter ? 22 : 22}
              weight={isActive ? "fill" : "regular"}
              aria-hidden="true"
            />
            {!isCenter && <span>{label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

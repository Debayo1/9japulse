"use client";

import type { ReactNode, ComponentType } from "react";
import {
  Home, Star, Clock, CreditCard, User, ArrowUp, ArrowDown, Menu, Settings,
} from "lucide-react";
import dynamic from "next/dynamic";

const Lottie = dynamic(() => import("lottie-react").then(mod => mod.default), { ssr: false });

export type IconName =
  | "home"
  | "star"
  | "clock"
  | "credit-card"
  | "user"
  | "arrow-up"
  | "arrow-down"
  | "menu"
  | "settings";

const LUCIDE_ICONS: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  home: Home,
  star: Star,
  clock: Clock,
  "credit-card": CreditCard,
  user: User,
  "arrow-up": ArrowUp,
  "arrow-down": ArrowDown,
  menu: Menu,
  settings: Settings,
};

interface IconProps {
  type: "lucide" | "lottie";
  name?: string;
  animationData?: object;
  size?: number;
  className?: string;
}

export const Icon = ({
  type,
  name,
  animationData,
  size = 24,
  className = "",
}: IconProps): ReactNode => {
  if (type === "lucide") {
    if (!name) throw new Error("`name` is required for lucide icons");
    const LucideComponent = LUCIDE_ICONS[name];
    if (!LucideComponent) throw new Error("Unknown icon: " + name);
    return <LucideComponent size={size} className={className} />;
  }

  if (!animationData) throw new Error("`animationData` is required for lottie icons");
  return (
    <Lottie
      animationData={animationData}
      style={{ width: size, height: size }}
      className={className}
      loop={false}
    />
  );
};

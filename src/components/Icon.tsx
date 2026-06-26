"use client";

import type { ReactNode } from "react";

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

interface IconProps {
  /** "lucide" for static SVG icons, "lottie" for animated ones */
  type: "lucide" | "lottie";
  /** Name of the Lucide icon (required when type="lucide") */
  name?: string;
  /** Lottie animation JSON object (required when type="lottie") */
  animationData?: object;
  /** Desired size in pixels */
  size?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Unified Icon component.
 * - For static UI use the lightweight Lucide icons.
 * - For high-impact actions import a Lottie JSON and pass it via `animationData`.
 *
 * Lottie is dynamically imported to keep SSR bundle lean.
 */
export const Icon = ({
  type,
  name,
  animationData,
  size = 24,
  className = "",
}: IconProps): ReactNode => {
  if (type === "lucide") {
    if (!name) throw new Error("`name` is required for lucide icons");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const LucideComponent = (require("lucide-react") as Record<string, React.ComponentType<{ size: number; className: string }>>)[name];
    return <LucideComponent size={size} className={className} />;
  }

  // Lottie — dynamically imported by consumers via next/dynamic
  if (!animationData) throw new Error("`animationData` is required for lottie icons");

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Lottie = require("lottie-react").default as React.ComponentType<{ animationData: object; style: object; className: string; loop: boolean }>;
  return (
    <Lottie
      animationData={animationData}
      style={{ width: size, height: size }}
      className={className}
      loop={false}
    />
  );
};

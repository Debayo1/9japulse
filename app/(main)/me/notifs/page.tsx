"use client";

import { Bell } from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

export default function NotificationsPage() {
  return (
    <div className="page" style={{ paddingTop: "5rem" }}>
      <Header title="Notifications" showBack />
      <div style={{ textAlign: "center", marginTop: "3rem", opacity: 0.6 }}>
        <Bell size={40} weight="duotone" color="var(--text-muted)" />
        <p style={{ marginTop: "1rem", color: "var(--text-secondary)" }}>
          No notifications yet
        </p>
      </div>
    </div>
  );
}

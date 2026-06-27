"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { promoteUserToAdmin } from "@/lib/admin";
import { UserPlus } from "@phosphor-icons/react";

export default function AdminPromoter() {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  const handlePromote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }

    startTransition(async () => {
      try {
        const res = await promoteUserToAdmin(email);
        if (res.success) {
          toast.success(res.message);
          setEmail("");
        } else {
          toast.error(res.message);
        }
      } catch (err: any) {
        toast.error(err.message || "An error occurred");
      }
    });
  };

  return (
    <div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
      <h2 style={{ marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.1rem", fontWeight: 700 }}>
        <UserPlus size={20} weight="duotone" color="var(--color-primary)" />
        Promote User to Admin
      </h2>
      <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "0.85rem" }}>
        Enter the email of any registered user to promote them to Administrator role.
      </p>
      <form onSubmit={handlePromote} style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="email"
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isPending}
          style={{
            flex: 1,
            padding: "0.65rem 0.85rem",
            borderRadius: "12px",
            border: "1.5px solid var(--border)",
            background: "var(--bg-surface)",
            color: "var(--text-primary)",
            fontSize: "0.875rem",
          }}
        />
        <button
          type="submit"
          disabled={isPending}
          className="btn btn-primary"
          style={{
            padding: "0.65rem 1.25rem",
            fontSize: "0.875rem",
            fontWeight: 700,
            whiteSpace: "nowrap",
            borderRadius: "12px",
            border: "none",
            background: "var(--color-primary)",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          {isPending ? "Promoting..." : "Promote"}
        </button>
      </form>
    </div>
  );
}

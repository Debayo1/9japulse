import { redirect } from "next/navigation";
import Header from "@/components/Header";
import ThemeSettingsCard from "@/components/ThemeSettingsCard";
import { getUser } from "@/lib/auth";

export default async function SettingsPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const name = (user.user_metadata?.full_name as string) ?? user.email ?? "User";

  return (
    <div className="page">
      <Header title="Account Settings" />

      <section className="glass-sm" style={{ padding: "1rem", marginBottom: "1rem", border: "1px solid var(--border)" }}>
        <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
          Signed in as
        </p>
        <h1 style={{ fontSize: "1.25rem", marginTop: "0.25rem" }}>{name}</h1>
        <p style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>{user.email}</p>
      </section>

      <ThemeSettingsCard />
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { getUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabaseServer";
import { ensureDbColumnsExist } from "@/lib/dbAdmin";
import AdminPromoter from "@/components/AdminPromoter";

async function AdminDashboard() {
  const user = await getUser();
  if (!user) redirect("/login");
  await ensureDbColumnsExist();
  if (!(await isAdminUser(user))) redirect("/home");

  const svc = createServiceClient() as any;

  const [{ count: usersCount }, { count: txCount }, { count: vaCount }, { data: recentUsers }, { data: recentTx }, { data: platform }] = await Promise.all([
    svc.from("profiles").select("*", { count: "exact", head: true }),
    svc.from("transactions").select("*", { count: "exact", head: true }),
    svc.from("virtual_accounts").select("*", { count: "exact", head: true }),
    svc.from("profiles").select("id, email, full_name, role, created_at").order("created_at", { ascending: false }).limit(5),
    svc.from("transactions").select("id, service_type, amount, status, created_at").order("created_at", { ascending: false }).limit(8),
    svc.from("platform_settings").select("app_name, deposit_fee, transfer_fee, bank_transfer_fee, theme, app_maintenance, banner_text").maybeSingle(),
  ]);

  const cards = [
    { label: "Users", value: usersCount ?? 0 },
    { label: "Transactions", value: txCount ?? 0 },
    { label: "Virtual Accts", value: vaCount ?? 0 },
    { label: "Live Flags", value: platform?.app_maintenance ? "Maintenance" : "Online" },
  ] as const;

  return (
    <div className="page">
      <Header title="Admin Dashboard" />

      <div className="card" style={{ marginBottom: "1rem", padding: "1rem" }}>
        <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
          Admin access
        </p>
        <h1 style={{ marginTop: "0.25rem" }}>Manage the whole app from one place</h1>
        <p style={{ fontSize: "0.875rem", marginTop: "0.35rem" }}>
          Users, wallet history, virtual accounts, provider keys, and platform settings.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
        {cards.map(({ label, value }) => (
          <div key={label} className="card" style={{ padding: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>{label}</p>
                <h2 style={{ marginTop: "0.25rem" }}>{value}</h2>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
        <h2 style={{ marginBottom: "0.75rem" }}>Platform Setup</h2>
        <div style={{ display: "grid", gap: "0.5rem" }}>
          <p><strong>App:</strong> {platform?.app_name ?? "9jaPulse"}</p>
          <p><strong>Deposit fee:</strong> ₦{Number(platform?.deposit_fee ?? 50).toLocaleString()}</p>
          <p><strong>Transfer fee:</strong> ₦{Number(platform?.transfer_fee ?? 0).toLocaleString()}</p>
          <p><strong>Bank transfer fee:</strong> ₦{Number(platform?.bank_transfer_fee ?? 0).toLocaleString()}</p>
          <p><strong>Theme:</strong> {platform?.theme ?? "system"}</p>
          <p><strong>Banner:</strong> {platform?.banner_text ?? "No banner set"}</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
          <Link href="/admin/keys" className="btn btn-primary">Provider Keys</Link>
          <Link href="/me/settings" className="btn btn-secondary">App Settings</Link>
        </div>
      </div>

      <AdminPromoter />

      <div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
        <h2 style={{ marginBottom: "0.75rem" }}>Recent Users</h2>
        <div style={{ display: "grid", gap: "0.5rem" }}>
          {(recentUsers ?? []).map((item: any) => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
              <div>
                <strong>{item.full_name ?? item.email}</strong>
                <p style={{ fontSize: "0.8125rem" }}>{item.email}</p>
              </div>
              <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{item.role ?? "user"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
        <h2 style={{ marginBottom: "0.75rem" }}>Recent History</h2>
        <div style={{ display: "grid", gap: "0.5rem" }}>
          {(recentTx ?? []).map((item: any) => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
              <div>
                <strong>{item.service_type}</strong>
                <p style={{ fontSize: "0.8125rem" }}>{item.status}</p>
              </div>
              <span>₦{Number(item.amount).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "0.75rem" }}>
        <Link href="/admin/keys" className="card" style={{ padding: "1rem", textDecoration: "none" }}>
          <h3 style={{ marginTop: "0.5rem" }}>Keys</h3>
          <p style={{ fontSize: "0.8125rem" }}>Manage provider credentials.</p>
        </Link>
        <Link href="/me/security" className="card" style={{ padding: "1rem", textDecoration: "none" }}>
          <h3 style={{ marginTop: "0.5rem" }}>Settings</h3>
          <p style={{ fontSize: "0.8125rem" }}>Theme, PIN, and account settings.</p>
        </Link>
        <Link href="/deposit" className="card" style={{ padding: "1rem", textDecoration: "none" }}>
          <h3 style={{ marginTop: "0.5rem" }}>Deposits</h3>
          <p style={{ fontSize: "0.8125rem" }}>Virtual accounts and funding.</p>
        </Link>
      </div>
    </div>
  );
}

export default AdminDashboard;

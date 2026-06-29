import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { getUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabaseServer";
import { ensureDbColumnsExist } from "@/lib/dbAdmin";
import AdminConsole from "@/components/AdminConsole";

export default async function AdminDashboardPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  
  // Make sure database columns exist (catches connection errors internally)
  await ensureDbColumnsExist();

  if (!(await isAdminUser(user))) redirect("/home");

  const svc = createServiceClient() as any;

  // Query all necessary data for initial state
  const [{ data: users }, { data: virtualAccounts }, { data: txns }, { data: settings }, { data: keys }] = await Promise.all([
    svc
      .from("profiles")
      .select("id, email, full_name, role, created_at, wallets(balance_withdrawable)")
      .order("created_at", { ascending: false }),
    svc
      .from("virtual_accounts")
      .select("*"),
    svc
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false }),
    svc
      .from("platform_settings")
      .select("*")
      .maybeSingle(),
    svc
      .from("provider_keys")
      .select("*")
      .eq("is_active", true),
  ]);

  // Map virtual accounts to users locally to avoid PostgREST relationship limitations
  const mappedUsers = (users || []).map((u: any) => ({
    ...u,
    virtual_accounts: (virtualAccounts || []).filter((va: any) => va.user_id === u.id)
  }));

  return (
    <div className="page" style={{ paddingBottom: "2rem" }}>
      <Header title="Admin Console" />
      <AdminConsole
        initialUsers={mappedUsers}
        initialTransactions={txns || []}
        initialSettings={settings}
        initialKeys={keys || []}
      />
    </div>
  );
}


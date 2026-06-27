import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { getUser } from "@/lib/auth";
import { getOrCreateVirtualAccount, getDepositMeta } from "@/lib/virtualAccount";

export default async function DepositPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const [meta, virtualAccount] = await Promise.all([
    getDepositMeta(user.id),
    getOrCreateVirtualAccount(user.id).catch(() => null),
  ]);

  const account = virtualAccount ?? meta.virtualAccount;
  const displayName = (user.user_metadata?.full_name as string) ?? user.email ?? "User";

  return (
    <div className="page">
      <Header title="Deposit" />

      <div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
        <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
          Deposit fee
        </p>
        <h1 style={{ marginTop: "0.25rem" }}>₦{meta.depositFee.toLocaleString()}</h1>
        <p style={{ fontSize: "0.875rem", marginTop: "0.35rem" }}>
          This fee is applied when funding is processed through the virtual account provider.
        </p>
      </div>

      <div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
        <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
          Your virtual account
        </p>
        <h2 style={{ marginTop: "0.25rem" }}>{displayName}</h2>
        {account ? (
          <div style={{ display: "grid", gap: "0.5rem", marginTop: "0.75rem" }}>
            <p><strong>Bank:</strong> {account.bank_name ?? "Palmpay"}</p>
            <p><strong>Account number:</strong> {account.account_number}</p>
            <p><strong>Account name:</strong> {account.account_name}</p>
            <p><strong>Type:</strong> {account.account_type ?? "static"}</p>
            <p><strong>Status:</strong> {account.status}</p>
          </div>
        ) : (
          <p style={{ marginTop: "0.75rem" }}>Virtual account is being prepared. Refresh shortly.</p>
        )}
      </div>

      <div className="card" style={{ padding: "1rem" }}>
        <h2 style={{ marginBottom: "0.5rem" }}>Funding notes</h2>
        <p style={{ fontSize: "0.875rem" }}>
          Send money to the account above. Once the NCWallet webhook confirms the deposit, the wallet balance can be updated from the admin side or your webhook handler.
        </p>
      </div>
    </div>
  );
}

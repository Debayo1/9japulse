import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { getUser } from "@/lib/auth";
import { getOrCreateVirtualAccount, getDepositMeta } from "@/lib/virtualAccount";
import DepositClient from "./DepositClient";

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
      <DepositClient account={account} displayName={displayName} depositFee={meta.depositFee} />
    </div>
  );
}

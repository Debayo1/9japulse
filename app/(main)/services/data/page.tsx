import { getUser } from "@/lib/auth";
import { getWallet } from "@/lib/ledger";
import { redirect } from "next/navigation";
import DataForm from "@/components/DataForm";

export default async function DataPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const wallet = await getWallet(user.id);

  return (
    <DataForm
      walletId={wallet.id}
      initialWithdrawable={Number(wallet.balance_withdrawable)}
    />
  );
}

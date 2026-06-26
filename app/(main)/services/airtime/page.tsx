import { getUser } from "@/lib/auth";
import { getWallet } from "@/lib/ledger";
import { redirect } from "next/navigation";
import AirtimeForm from "@/components/AirtimeForm";

export default async function AirtimePage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const wallet = await getWallet(user.id);

  return (
    <AirtimeForm
      walletId={wallet.id}
      initialWithdrawable={Number(wallet.balance_withdrawable)}
    />
  );
}

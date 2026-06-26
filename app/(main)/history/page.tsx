import { Suspense } from "react";
import HistoryClient from "@/components/HistoryClient";
import { SkeletonList } from "@/components/SkeletonLoader";
import { getWallet, getTransactions } from "@/lib/ledger";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";

async function HistoryContent() {
  const user = await getUser();
  if (!user) redirect("/login");

  const wallet = await getWallet(user.id);
  const { transactions, total } = await getTransactions(wallet.id, 0, 100);

  return <HistoryClient initialTransactions={transactions} totalCount={total} walletId={wallet.id} />;
}

export default function HistoryPage() {
  return (
    <div className="page">
      <Suspense fallback={<SkeletonList rows={8} />}>
        <HistoryContent />
      </Suspense>
    </div>
  );
}

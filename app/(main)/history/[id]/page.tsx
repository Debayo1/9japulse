import { createServiceClient } from "@/lib/supabaseServer";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import ReceiptView from "./ReceiptView";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function TransactionDetailPage({ params }: PageProps) {
  const user = await getUser();
  if (!user) redirect("/login");

  const svc = createServiceClient() as any;
  const { data: txn, error } = await svc
    .from("transactions")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (error || !txn) {
    redirect("/history");
  }

  return <ReceiptView txn={txn} />;
}

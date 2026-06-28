import { createServiceClient } from "@/lib/supabaseServer";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import ReceiptView from "./ReceiptView";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TransactionDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const user = await getUser();
  if (!user) redirect("/login");

  const svc = createServiceClient() as any;
  const { data: txn, error } = await svc
    .from("transactions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !txn) {
    redirect("/history");
  }

  return <ReceiptView txn={txn} />;
}

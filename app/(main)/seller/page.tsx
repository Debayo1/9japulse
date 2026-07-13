import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getSellerByUserId } from "@/lib/seller";
import SellerDashboardClient from "@/components/seller/SellerDashboardClient";

export default async function SellerPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const seller = await getSellerByUserId(user.id);

  return (
    <SellerDashboardClient
      user={{ id: user.id, email: user.email || "", full_name: (user.user_metadata as any)?.full_name || "" }}
      seller={seller}
    />
  );
}

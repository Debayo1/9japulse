"use server";

import { createServiceClient } from "./supabaseServer";
import { getUser } from "./auth";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createGiftCode(amount: number, message?: string) {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");
  if (amount < 100) throw new Error("Minimum amount is ₦100");

  const svc = createServiceClient();
  const code = generateCode();

  const { error } = await (svc as any).from("gift_codes").insert({
    code,
    amount,
    created_by: user.id,
    message: message || null,
    status: "active",
  });

  if (error) throw new Error(error.message);
  return { code, amount };
}

export async function redeemGiftCode(code: string) {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const svc = createServiceClient();

  const { data: gc } = await (svc as any)
    .from("gift_codes")
    .select("*")
    .eq("code", code.toUpperCase().trim())
    .maybeSingle();

  if (!gc) throw new Error("Invalid gift code");
  if (gc.status !== "active") throw new Error("Gift code has already been used");
  if (gc.created_by === user.id) throw new Error("Cannot redeem your own gift code");

  const { data: wallet } = await (svc as any)
    .from("wallets")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!wallet) throw new Error("Wallet not found");

  const ref = `GFT-${Date.now()}`;

  await (svc as any).from("transactions").insert({
    wallet_id: wallet.id,
    service_type: "gift_code",
    amount: gc.amount,
    direction: "credit",
    status: "success",
    description: `Gift code ${gc.code} redeemed`,
    reference: ref,
  });

  await (svc as any)
    .from("gift_codes")
    .update({ status: "redeemed", redeemed_by: user.id, redeemed_at: new Date().toISOString() })
    .eq("id", gc.id);

  return { success: true, amount: gc.amount, code: gc.code };
}

export async function getMyGiftCodes() {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const svc = createServiceClient();

  const [created, redeemed] = await Promise.all([
    (svc as any)
      .from("gift_codes")
      .select("*")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false }),
    (svc as any)
      .from("gift_codes")
      .select("*, profiles!gift_codes_redeemed_by_fkey(full_name)")
      .eq("redeemed_by", user.id)
      .order("redeemed_at", { ascending: false }),
  ]);

  return {
    created: created.data ?? [],
    redeemed: redeemed.data ?? [],
  };
}

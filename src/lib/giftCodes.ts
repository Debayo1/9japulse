"use server";

import { createServiceClient } from "./supabaseServer";
import { getUser } from "./auth";
import { applyTransaction, getWallet } from "./ledger";

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

  const wallet = await getWallet(user.id);
  if (wallet.balance_withdrawable < amount) throw new Error("Insufficient balance");

  const svc = createServiceClient();
  const code = generateCode();
  const ref = `GFT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  await applyTransaction(wallet.id, {
    service_type: "gift_code_purchase",
    amount,
    description: `Gift code ${code} purchased`,
    status: "success",
    reference: ref,
  });

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

  const wallet = await getWallet(user.id);
  const ref = `GFT-RDM-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  await applyTransaction(wallet.id, {
    service_type: "gift_code_redeemed",
    amount: gc.amount,
    description: `Gift code ${gc.code} redeemed`,
    status: "success",
    reference: ref,
  });

  await (svc as any)
    .from("gift_codes")
    .update({ status: "redeemed", redeemed_by: user.id, redeemed_at: new Date().toISOString() })
    .eq("id", gc.id);

  return { success: true, amount: gc.amount, code: gc.code };
}

export async function getMyGiftCodes(limit = 50, offset = 0) {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const svc = createServiceClient();

  const [created, redeemed] = await Promise.all([
    (svc as any)
      .from("gift_codes")
      .select("*")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1),
    (svc as any)
      .from("gift_codes")
      .select("*, profiles!gift_codes_redeemed_by_fkey(full_name)")
      .eq("redeemed_by", user.id)
      .order("redeemed_at", { ascending: false })
      .range(offset, offset + limit - 1),
  ]);

  return {
    created: created.data ?? [],
    redeemed: redeemed.data ?? [],
  };
}

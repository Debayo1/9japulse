"use server";

import { createServiceClient } from "./supabaseServer";
import { ensureDbColumnsExist } from "./dbAdmin";
import { ncwalletCreateVirtualAccount } from "./providers/ncwallet";
import type { Database } from "./database.types";

type VirtualAccountRow = any;

export async function getDepositMeta(userId: string) {
  await ensureDbColumnsExist();
  const svc = createServiceClient() as any;

  const { data: platform } = await svc
    .from("platform_settings")
    .select("deposit_fee, app_name, primary_color, secondary_color, accent_color")
    .maybeSingle();

  const { data: virtualAccount } = await svc
    .from("virtual_accounts")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  return {
    depositFee: Number(platform?.deposit_fee ?? 50),
    platform,
    virtualAccount: virtualAccount as VirtualAccountRow | null,
  };
}

export async function getOrCreateVirtualAccount(userId: string) {
  await ensureDbColumnsExist();
  const svc = createServiceClient() as any;

  const { data: existing } = await svc
    .from("virtual_accounts")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return existing as VirtualAccountRow;

  const { data: profile } = await svc
    .from("profiles")
    .select("full_name, email, phone")
    .eq("id", userId)
    .maybeSingle();

  const accountName = profile?.full_name || profile?.email || "9jaPulse User";
  const email = profile?.email || "";
  const phoneNumber = profile?.phone || "";
  const bvn = process.env.NCWALLET_BVN ?? "";

  if (!bvn) {
    throw new Error("NCWallet BVN is missing. Set NCWALLET_BVN in .env.local or save it as provider key.");
  }

  const created = await ncwalletCreateVirtualAccount({
    accountName,
    email,
    phoneNumber,
    bvn,
  });

  if (!created.success || !created.data) {
    throw new Error(created.message || "Failed to create virtual account");
  }

  const payload = created.data as Record<string, unknown>;
  const accountNumber = String(payload.account_number ?? "");
  const bankName = String(payload.bank_name ?? "Palmpay");
  const bankCode = String(payload.bank_code ?? "palmpay");
  const accountType = String(payload.account_type ?? "static");
  const accountNameFromProvider = String(payload.account_name ?? accountName);
  const webhookUrl = typeof payload.webhook_url === "string" ? payload.webhook_url : null;

  const { data: saved, error } = await svc
    .from("virtual_accounts")
    .upsert({
      user_id: userId,
      provider: "ncwallet",
      provider_reference: created.reference || null,
      account_number: accountNumber,
      account_name: accountNameFromProvider,
      bank_code: bankCode,
      bank_name: bankName,
      account_type: accountType,
      status: "active",
      webhook_url: webhookUrl,
      meta: payload,
    }, { onConflict: "user_id" })
    .select()
    .single();

  if (error || !saved) {
    throw new Error(error?.message ?? "Failed to save virtual account");
  }

  return saved as VirtualAccountRow;
}

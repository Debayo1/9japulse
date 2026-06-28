"use server";

import { createServiceClient } from "./supabaseServer";
import { ensureDbColumnsExist } from "./dbAdmin";
import { getProviderKey } from "./providerKeys";
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
  let bvn = process.env.NCWALLET_BVN ?? "";
  if (!bvn) {
    try {
      bvn = await getProviderKey("ncwallet", "bvn");
    } catch {
      bvn = "";
    }
  }

  let payload: Record<string, any> = {};
  let accountNumber = "";
  let bankName = "Palmpay";
  let bankCode = "palmpay";
  let accountType = "static";
  let accountNameFromProvider = accountName;
  let providerRef: string | null = null;
  let webhookUrl: string | null = null;

  let apiSuccess = false;

  if (bvn) {
    try {
      const created = await ncwalletCreateVirtualAccount({
        accountName,
        email,
        phoneNumber,
        bvn,
      });

      if (created.success && created.data) {
        payload = created.data as Record<string, unknown>;
        accountNumber = String(payload.account_number ?? "");
        bankName = String(payload.bank_name ?? "Palmpay");
        bankCode = String(payload.bank_code ?? "palmpay");
        accountType = String(payload.account_type ?? "static");
        accountNameFromProvider = String(payload.account_name ?? accountName);
        providerRef = created.reference || null;
        webhookUrl = typeof payload.webhook_url === "string" ? payload.webhook_url : null;
        apiSuccess = true;
      }
    } catch (apiErr) {
      console.warn("[9jaPulse] NCWallet API request failed, falling back to local mock virtual account generation:", apiErr);
    }
  } else {
    console.warn("[9jaPulse] NCWallet BVN not configured. Falling back to local mock virtual account generation.");
  }

  // Fallback to local mock virtual account (matching Laravel's local fallback logic)
  if (!apiSuccess) {
    const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
    accountNumber = `80${randomDigits}`;
    bankName = "Palmpay (Mock)";
    bankCode = "palmpay";
    accountType = "static";
    accountNameFromProvider = accountName;
    payload = { mock: true, note: "Generated locally due to missing or failed NCWallet connection." };
  }

  const { data: saved, error } = await svc
    .from("virtual_accounts")
    .upsert({
      user_id: userId,
      provider: "ncwallet",
      provider_reference: providerRef,
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

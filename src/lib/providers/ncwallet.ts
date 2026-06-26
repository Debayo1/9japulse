"use server";

import { supabase } from "../supabaseClient";

// ─── Fetch a provider API key from DB ─────────────────────────────────────────
async function getProviderKey(provider: string, keyName: string): Promise<string> {
  const { data, error } = await supabase
    .from("provider_keys")
    .select("key_value")
    .eq("provider", provider)
    .eq("key_name", keyName)
    .eq("is_active", true)
    .returns<{ key_value: string }[]>()
    .single();

  if (error || !data) throw new Error(`Missing key "${keyName}" for provider "${provider}"`);
  return data.key_value;
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AirtimePurchaseParams {
  network: "MTN" | "Airtel" | "Glo" | "9mobile";
  phone: string;
  amount: number;
}

export interface DataPurchaseParams {
  network: "MTN" | "Airtel" | "Glo" | "9mobile";
  phone: string;
  plan_id: string;
  amount: number;
}

export interface PurchaseResult {
  success: boolean;
  reference: string;
  message: string;
}

// ─── NCWallet Integration ────────────────────────────────────────────────────
export async function ncwalletPurchaseAirtime(
  params: AirtimePurchaseParams
): Promise<PurchaseResult> {
  const apiKey = await getProviderKey("ncwallet", "api_key");
  const baseUrl = process.env.NCWALLET_BASE_URL ?? "https://api.ncwallet.ng";

  const res = await fetch(`${baseUrl}/airtime/purchase`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      network: params.network,
      phone: params.phone,
      amount: params.amount,
    }),
  });

  const json = await res.json();

  if (!res.ok) {
    return { success: false, reference: "", message: json.message ?? "Purchase failed" };
  }

  return {
    success: true,
    reference: json.reference ?? json.request_id,
    message: json.message ?? "Purchase successful",
  };
}

export async function ncwalletPurchaseData(
  params: DataPurchaseParams
): Promise<PurchaseResult> {
  const apiKey = await getProviderKey("ncwallet", "api_key");
  const baseUrl = process.env.NCWALLET_BASE_URL ?? "https://api.ncwallet.ng";

  const res = await fetch(`${baseUrl}/data/purchase`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      network: params.network,
      phone: params.phone,
      plan_id: params.plan_id,
      amount: params.amount,
    }),
  });

  const json = await res.json();

  if (!res.ok) {
    return { success: false, reference: "", message: json.message ?? "Purchase failed" };
  }

  return {
    success: true,
    reference: json.reference ?? json.request_id,
    message: json.message ?? "Data purchase successful",
  };
}

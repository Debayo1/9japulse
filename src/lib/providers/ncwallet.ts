"use server";

import { getProviderKey } from "../providerKeys";

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

export interface VirtualAccountParams {
  accountName: string;
  email: string;
  phoneNumber: string;
  bvn: string;
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

export async function ncwalletCreateVirtualAccount(
  params: VirtualAccountParams
): Promise<{
  success: boolean;
  reference: string;
  message: string;
  data?: Record<string, unknown>;
}> {
  const apiKey = await getProviderKey("ncwallet", "api_key");
  const trnxPin = await getProviderKey("ncwallet", "pin");
  const baseUrl = process.env.NCWALLET_BASE_URL ?? "https://ncwallet.africa/api/v1";
  let bvn = process.env.NCWALLET_BVN ?? "";
  if (!bvn) {
    try {
      bvn = await getProviderKey("ncwallet", "bvn");
    } catch {
      bvn = "";
    }
  }

  if (!bvn) {
    throw new Error("Missing NCWallet BVN. Add NCWALLET_BVN or save ncwallet/bvn in provider keys.");
  }

  const res = await fetch(`${baseUrl}/bank/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "trnx_pin": trnxPin,
      "Authorization": apiKey,
    },
    body: JSON.stringify({
      bank_code: "palmpay",
      account_name: params.accountName,
      email: params.email,
      phone_number: params.phoneNumber,
      account_type: "static",
      validation_type: "BVN",
      validation_number: bvn || params.bvn,
    }),
  });

  const json = await res.json().catch(() => ({}));
  const success = res.ok && String(json.status ?? "").toLowerCase() === "success";

  return {
    success,
    reference: json.ref_id ?? json.request_id ?? "",
    message: json.message ?? (success ? "Virtual account created successfully" : "Virtual account creation failed"),
    data: json.data,
  };
}

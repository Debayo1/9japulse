"use server";

import { createServiceClient } from "../supabaseServer";
import { ensureDbColumnsExist } from "../dbAdmin";

// ─── Fetch GSubz API key from provider_keys table ──────────────────────────────
async function getGSubzApiKey(): Promise<string> {
  await ensureDbColumnsExist();

  const svc = createServiceClient();
  const { data, error } = await (svc as any)
    .from("provider_keys")
    .select("key_value")
    .eq("provider", "gsubz")
    .eq("key_name", "api_key")
    .eq("is_active", true)
    .single();

  if (error || !data) {
    throw new Error("Missing or inactive GSubz API key in provider_keys table.");
  }
  return data.key_value;
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface GSubzAirtimeParams {
  network: string; // e.g. "mtn", "airtel", "glo", "9mobile"
  phone: string;
  amount: number;
  requestID: string;
}

export interface GSubzDataParams {
  network: string; // e.g. "mtn_sme", "airtel_cg", etc.
  phone: string;
  plan_id: string; // plan code (value) from GSubz
  amount: number;
  requestID: string;
}

export interface GSubzElectricityParams {
  meter_number: string;
  disco: string; // e.g. "ikeja-electric"
  phone: string;
  amount: number;
  requestID: string;
}

export interface GSubzCableTVParams {
  card_number: string;
  package_id: string; // plan code
  cable_name: string; // e.g. "gotv"
  phone: string;
  requestID: string;
}

export interface PurchaseResult {
  success: boolean;
  reference: string;
  message: string;
  token?: string; // for electricity tokens
}

// ─── Unified GSubz HTTP Call (matches PHP implementation exactly) ───────────────
async function callGSubzApi(payload: Record<string, any>): Promise<any> {
  const apiKey = await getGSubzApiKey();
  const url = "https://gsubz.com/api/pay/";

  // GSubz expects the API key in both Authorization header and POST body
  payload.api = apiKey;

  // Format as x-www-form-urlencoded matching PHP array post parameters
  const body = new URLSearchParams();
  for (const [key, val] of Object.entries(payload)) {
    body.append(key, String(val));
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error(`GSubz API connection failed with status code ${res.status}`);
  }

  return await res.json();
}

// ─── Airtime ──────────────────────────────────────────────────────────────────
export async function gsubzPurchaseAirtime(
  params: GSubzAirtimeParams
): Promise<PurchaseResult> {
  try {
    const json = await callGSubzApi({
      serviceID: params.network.toLowerCase(),
      amount: params.amount,
      phone: params.phone,
      requestID: params.requestID,
    });

    const status = String(json.status || "").toLowerCase();
    const success = status === "successful" || status === "transaction_successful";

    return {
      success,
      reference: json.transactionID || json.ident || params.requestID,
      message: json.description || json.error || "Transaction processed",
    };
  } catch (err: any) {
    return {
      success: false,
      reference: "",
      message: err.message || "GSubz API connection error",
    };
  }
}

// ─── Data ─────────────────────────────────────────────────────────────────────
export async function gsubzPurchaseData(
  params: GSubzDataParams
): Promise<PurchaseResult> {
  try {
    const json = await callGSubzApi({
      serviceID: params.network.toLowerCase(),
      plan: params.plan_id,
      amount: params.amount,
      phone: params.phone,
      requestID: params.requestID,
    });

    const status = String(json.status || "").toLowerCase();
    const success = status === "successful" || status === "transaction_successful";

    return {
      success,
      reference: json.transactionID || json.ident || params.requestID,
      message: json.description || json.error || "Transaction processed",
    };
  } catch (err: any) {
    return {
      success: false,
      reference: "",
      message: err.message || "GSubz API connection error",
    };
  }
}

// ─── Electricity ──────────────────────────────────────────────────────────────
export async function gsubzBuyElectricity(
  params: GSubzElectricityParams
): Promise<PurchaseResult> {
  try {
    const json = await callGSubzApi({
      serviceID: params.disco,
      amount: params.amount,
      phone: params.phone,
      customerID: params.meter_number,
      requestID: params.requestID,
    });

    const status = String(json.status || "").toLowerCase();
    const success = status === "successful" || status === "transaction_successful";

    return {
      success,
      reference: json.transactionID || json.ident || params.requestID,
      message: json.description || json.error || "Transaction processed",
      token: json.token,
    };
  } catch (err: any) {
    return {
      success: false,
      reference: "",
      message: err.message || "GSubz API connection error",
    };
  }
}

// ─── Cable TV ─────────────────────────────────────────────────────────────────
export async function gsubzRenewCableTV(
  params: GSubzCableTVParams
): Promise<PurchaseResult> {
  try {
    const json = await callGSubzApi({
      serviceID: params.cable_name,
      plan: params.package_id,
      amount: "", // empty as required by GSubz cable verification
      phone: params.phone,
      customerID: params.card_number,
      requestID: params.requestID,
    });

    const status = String(json.status || "").toLowerCase();
    const success = status === "successful" || status === "transaction_successful";

    return {
      success,
      reference: json.transactionID || json.ident || params.requestID,
      message: json.description || json.error || "Transaction processed",
    };
  } catch (err: any) {
    return {
      success: false,
      reference: "",
      message: err.message || "GSubz API connection error",
    };
  }
}

"use server";

import { getProviderKey } from "../providerKeys";

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
type GSubzResponse = {
  status?: string;
  transactionID?: string;
  ident?: string;
  description?: string;
  error?: string;
  token?: string;
  message?: string;
  data?: unknown;
  ref_id?: string;
};

async function callGSubzApi(payload: Record<string, string | number | boolean | null | undefined>): Promise<GSubzResponse> {
  const apiKey = await getProviderKey("gsubz", "api_key");
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

  return (await res.json()) as GSubzResponse;
}

export async function mapGSubzError(codeOrMessage: string): Promise<string> {
  const clean = String(codeOrMessage || "").trim().toUpperCase();

  // Explicit mappings for provider status codes & uppercase raw strings
  const mappings: Record<string, string> = {
    "200": "Transaction Successful",
    "TRANSACTION_SUCCESSFUL": "Transaction Successful",
    "SUCCESSFUL": "Transaction Successful",
    
    "204": "Required details not sent. Please check your form fields.",
    "REQUIRED_CONTENT_NOT_SENT": "Required details not sent. Please check your form fields.",
    
    "206": "Invalid details provided. Please check the recipient number or plan.",
    "INVALID_CONTENT": "Invalid details provided. Please check the recipient number or plan.",
    "INVALID_PHONE": "Invalid phone number provided.",
    
    "401": "Provider authorization failed. Please contact admin support.",
    "AUTHORIZATION_FAILED": "Provider authorization failed. Please contact admin support.",
    
    "402": "Error in payment processing. Please try again.",
    "ERROR_IN_PAYMENT": "Error in payment processing. Please try again.",
    "INSUFFICIENT_BALANCE": "Insufficient provider balance. Please contact admin.",
    
    "404": "The requested plan or service was not found.",
    "CONTENT_NOT_FOUND": "The requested plan or service was not found.",
    
    "405": "Invalid protocol method. Please contact support.",
    "REQUEST_METHOD_NOT_IN_POST": "Invalid protocol method. Please contact support.",
    
    "406": "Transaction not allowed on this account.",
    "NOT_ALLOWED": "Transaction not allowed on this account.",
    
    "502": "Operator gateway error. Please try again later.",
    "GATEWAY_ERROR": "Operator gateway error. Please try again later.",
  };

  if (mappings[clean]) {
    return mappings[clean];
  }

  // Check substring matches
  for (const [key, value] of Object.entries(mappings)) {
    if (clean.includes(key)) {
      return value;
    }
  }

  // Prettify general uppercase keys
  if (clean.includes("_")) {
    return clean.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
  }

  return codeOrMessage || "Transaction failed";
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
    const success = status === "successful" || status === "transaction_successful" || status === "200";
    const rawMsg = json.description || json.error || json.status || json.message || "Transaction processed";

    return {
      success,
      reference: json.transactionID || json.ident || params.requestID,
      message: await mapGSubzError(rawMsg),
    };
  } catch (err: unknown) {
    return {
      success: false,
      reference: "",
      message: err instanceof Error ? await mapGSubzError(err.message) : "GSubz API connection error",
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
    const success = status === "successful" || status === "transaction_successful" || status === "200";
    const rawMsg = json.description || json.error || json.status || json.message || "Transaction processed";

    return {
      success,
      reference: json.transactionID || json.ident || params.requestID,
      message: await mapGSubzError(rawMsg),
    };
  } catch (err: unknown) {
    return {
      success: false,
      reference: "",
      message: err instanceof Error ? await mapGSubzError(err.message) : "GSubz API connection error",
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
    const success = status === "successful" || status === "transaction_successful" || status === "200";
    const rawMsg = json.description || json.error || json.status || json.message || "Transaction processed";

    return {
      success,
      reference: json.transactionID || json.ident || params.requestID,
      message: await mapGSubzError(rawMsg),
      token: json.token,
    };
  } catch (err: unknown) {
    return {
      success: false,
      reference: "",
      message: err instanceof Error ? await mapGSubzError(err.message) : "GSubz API connection error",
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
    const success = status === "successful" || status === "transaction_successful" || status === "200";
    const rawMsg = json.description || json.error || json.status || json.message || "Transaction processed";

    return {
      success,
      reference: json.transactionID || json.ident || params.requestID,
      message: await mapGSubzError(rawMsg),
    };
  } catch (err: unknown) {
    return {
      success: false,
      reference: "",
      message: err instanceof Error ? await mapGSubzError(err.message) : "GSubz API connection error",
    };
  }
}

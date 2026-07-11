import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabaseServer";
import { applyTransaction } from "@/lib/ledger";
import { getProviderKey } from "@/lib/providerKeys";

const HMAC_ALGORITHM = "sha256";

async function verifySignature(payload: string, signature: string): Promise<boolean> {
  try {
    const secret = await getProviderKey("ncwallet", "webhook_secret");
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", encoder.encode(secret),
      { name: "HMAC", hash: HMAC_ALGORITHM },
      false, ["verify"]
    );
    const sigBytes = hexToBytes(signature);
    const dataBytes = encoder.encode(payload);
    return await crypto.subtle.verify("HMAC", key, sigBytes as BufferSource, dataBytes);
  } catch {
    return false;
  }
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

export async function POST(req: NextRequest) {
  try {
    // Verify HMAC signature
    const signature = req.headers.get("x-ncwallet-signature") || "";
    const rawBody = await req.text();
    if (signature) {
      const isValid = await verifySignature(rawBody, signature);
      if (!isValid) {
        console.warn("[9jaPulse Webhook] Invalid HMAC signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } else {
      console.warn("[9jaPulse Webhook] Missing HMAC signature header");
    }

    const data = JSON.parse(rawBody);

    // 1. Required fields validation
    const status = data.status;
    const email = data.email;
    const refId = data.ref_id;
    const amount = data.amount;
    const bankName = data.bank_name || "";

    if (!status || !email || !refId || amount === undefined) {
      console.warn("[9jaPulse Webhook] Missing required fields:", data);
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (String(status).toLowerCase() !== "success" && String(status).toLowerCase() !== "successful") {
      console.info("[9jaPulse Webhook] Ignored non-success transaction:", refId);
      return NextResponse.json({ message: "Ignored non-success status" }, { status: 200 });
    }

    const svc = createServiceClient() as any;

    // 2. Fetch user profile by email
    const { data: profile, error: profErr } = await svc
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (profErr || !profile) {
      console.warn("[9jaPulse Webhook] Profile not found for email:", email);
      return NextResponse.json({ error: "User with email " + email + " not found" }, { status: 404 });
    }

    // 3. Fetch user wallet
    const { data: wallet, error: wallErr } = await svc
      .from("wallets")
      .select("id")
      .eq("user_id", profile.id)
      .maybeSingle();

    if (wallErr || !wallet) {
      console.error("[9jaPulse Webhook] Wallet not found for user:", profile.id);
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    // 4. Prevent double-funding/duplicate requests
    const { data: existingTxn } = await svc
      .from("transactions")
      .select("id")
      .eq("reference", refId)
      .eq("service_type", "deposit")
      .maybeSingle();

    if (existingTxn) {
      console.info("[9jaPulse Webhook] Transaction " + refId + " already processed.");
      return NextResponse.json({ message: "Transaction already processed" }, { status: 200 });
    }

    // 5. Get platform deposit transfer fee
    const { data: platform } = await svc
      .from("platform_settings")
      .select("deposit_fee")
      .maybeSingle();

    const fee = Number(platform?.deposit_fee ?? 50);
    const netAmount = Math.max(0, Number(amount) - fee);

    // 6. Apply credit transaction via ledger
    await applyTransaction(wallet.id, {
      service_type: "deposit",
      amount: netAmount,
      description: "Wallet funding via bank transfer (" + (bankName || "Bank") + ")",
      status: "success",
      reference: refId,
      meta: {
        raw_amount: Number(amount),
        fee_applied: fee,
        bank_name: bankName || null,
      },
    });

    console.info("[9jaPulse Webhook] Funded " + email + " with N" + netAmount + " (fee: N" + fee + ") | Ref: " + refId);
    return NextResponse.json({ status: "ok", message: "Deposit processed successfully" });
  } catch (err: any) {
    console.error("[9jaPulse Webhook] Crash processing callback:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

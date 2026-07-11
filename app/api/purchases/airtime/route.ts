import { NextRequest, NextResponse } from "next/server";
import { createRequestClient, createServiceClient } from "@/lib/supabaseServer";
import { getWallet, applyTransaction } from "@/lib/ledger";
import { gsubzPurchaseAirtime } from "@/lib/providers/gsubz";

const NETWORK_MAP: Record<string, "MTN" | "Airtel" | "Glo" | "9mobile"> = {
  mtn: "MTN",
  airtel: "Airtel",
  glo: "Glo",
  "9mobile": "9mobile",
};

export async function POST(req: NextRequest) {
  try {
    // ── 1. Authenticate the request ──────────────────────────────────────────
    const reqClient = await createRequestClient(req);
    const { user } = reqClient;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
    }

    const { network, phone, amount, pin, idempotency_key } = await req.json();

    // ── 2. Basic validation ──────────────────────────────────────────────────
    if (!network || !phone || typeof amount !== "number" || amount <= 0 || !pin) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    // ── 3. PIN Verification ──────────────────────────────────────────────────
    const { data: profile } = await (reqClient.supabase as any)
      .from("profiles")
      .select("pin")
      .eq("id", user.id)
      .single();

    const storedPin = profile?.pin || user.user_metadata?.transaction_pin;
    if (!storedPin) {
      return NextResponse.json({ error: "Transaction PIN not set. Please update your profile." }, { status: 400 });
    }
    if (String(pin) !== String(storedPin)) {
      return NextResponse.json({ error: "Incorrect transaction PIN" }, { status: 400 });
    }

    const mappedNetwork = NETWORK_MAP[network.toLowerCase()];
    if (!mappedNetwork) {
      return NextResponse.json({ error: "Unsupported operator network" }, { status: 400 });
    }

    // ── 4. Fetch Wallet & Verify Balance ─────────────────────────────────────
    const wallet = await getWallet(user.id);
    if (Number(wallet.balance_withdrawable) < amount) {
      return NextResponse.json({ error: "Insufficient withdrawable balance" }, { status: 400 });
    }

    // ── 5. Generate request_id for idempotency if not provided ───────────────
    const requestId = idempotency_key ?? crypto.randomUUID();
    const svc = createServiceClient();
    const { data: existingReq } = await (svc as any)
      .from("transactions")
      .select("id, status")
      .eq("request_id", requestId)
      .maybeSingle();
    if (existingReq) {
      return NextResponse.json({
        success: existingReq.status === "success",
        reference: existingReq.id,
        idempotent: true,
      });
    }

    // ── 6. Deduct funds atomically (with idempotency) ────────────────────────
    const ledgerRes = await applyTransaction(wallet.id, {
      service_type: "airtime",
      amount,
      description: "Airtime purchase for " + phone + " (" + mappedNetwork + ")",
      status: "pending",
      request_id: requestId,
    });

    const txnId = ledgerRes.transaction.id;

    // If this was an idempotent replay, return the existing result
    if (ledgerRes.idempotent) {
      return NextResponse.json({
        success: true,
        reference: ledgerRes.transaction.reference,
        idempotent: true,
      });
    }

    

    try {
      // ── 7. Call Payment Provider (GSubz) ───────────────────────────────────
      const providerRes = await gsubzPurchaseAirtime({
        network: network.toLowerCase(),
        phone,
        amount,
        requestID: txnId,
      });

      if (providerRes.success) {
        await (svc as any)
          .from("transactions")
          .update({ status: "success", reference: providerRes.reference })
          .eq("id", txnId);

        return NextResponse.json({ success: true, reference: providerRes.reference });
      } else {
        // Provider returned a failure — refund
        await (svc as any)
          .from("transactions")
          .update({ status: "failed", description: "Failed: " + providerRes.message })
          .eq("id", txnId);

        await applyTransaction(wallet.id, {
          service_type: "refund",
          amount,
          description: "Refund: Failed airtime purchase for " + phone,
          status: "success",
          reference: txnId,
          request_id: "refund-" + requestId,
        });

        return NextResponse.json({ error: providerRes.message }, { status: 400 });
      }
    } catch (providerError: unknown) {
      // Network/runtime crash — refund
      const errMsg = (providerError as Error).message ?? "Provider connection error";
      await (svc as any)
        .from("transactions")
        .update({ status: "failed", description: "Failed: " + errMsg })
        .eq("id", txnId);

      await applyTransaction(wallet.id, {
        service_type: "refund",
        amount,
        description: "Refund: Failed airtime purchase for " + phone,
        status: "success",
        reference: txnId,
        request_id: "refund-" + requestId,
      });

      return NextResponse.json({ error: errMsg }, { status: 500 });
    }
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message ?? "Internal server error" }, { status: 500 });
  }
}

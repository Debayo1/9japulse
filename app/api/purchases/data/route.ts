import { NextRequest, NextResponse } from "next/server";
import { createRequestClient, createServiceClient } from "@/lib/supabaseServer";
import { getWallet, applyTransaction } from "@/lib/ledger";
import { gsubzPurchaseData } from "@/lib/providers/gsubz";

const NETWORK_MAP: Record<string, "MTN" | "Airtel" | "Glo" | "9mobile"> = {
  mtn: "MTN",
  airtel: "Airtel",
  glo: "Glo",
  "9mobile": "9mobile",
};

const STATIC_DATA_PLANS: Record<string, { id: string; label: string; price: number; validity: string }[]> = {
  mtn: [
    { id: "mtn-1gb", label: "MTN SME 1.0 GB", price: 250, validity: "30 Days" },
    { id: "mtn-2gb", label: "MTN SME 2.0 GB", price: 500, validity: "30 Days" },
    { id: "mtn-5gb", label: "MTN SME 5.0 GB", price: 1250, validity: "30 Days" },
    { id: "mtn-10gb", label: "MTN SME 10.0 GB", price: 2500, validity: "30 Days" },
    { id: "mtn-1.5gb-gift", label: "MTN Gifting 1.5 GB", price: 350, validity: "30 Days" },
    { id: "mtn-3gb-gift", label: "MTN Gifting 3.0 GB", price: 700, validity: "30 Days" },
  ],
  airtel: [
    { id: "art-1.5gb", label: "Airtel CG 1.5 GB", price: 350, validity: "30 Days" },
    { id: "art-3gb", label: "Airtel CG 3.0 GB", price: 700, validity: "30 Days" },
    { id: "art-5gb", label: "Airtel CG 5.0 GB", price: 1150, validity: "30 Days" },
    { id: "art-10gb", label: "Airtel CG 10.0 GB", price: 2300, validity: "30 Days" },
  ],
  glo: [
    { id: "glo-1.35gb", label: "Glo CG 1.35 GB", price: 290, validity: "14 Days" },
    { id: "glo-2.9gb", label: "Glo CG 2.9 GB", price: 580, validity: "30 Days" },
    { id: "glo-5.8gb", label: "Glo CG 5.8 GB", price: 1160, validity: "30 Days" },
    { id: "glo-10gb", label: "Glo CG 10.0 GB", price: 2000, validity: "30 Days" },
  ],
  "9mobile": [
    { id: "9mob-1gb", label: "9mobile CG 1.0 GB", price: 300, validity: "30 Days" },
    { id: "9mob-2gb", label: "9mobile CG 2.0 GB", price: 600, validity: "30 Days" },
    { id: "9mob-5gb", label: "9mobile CG 5.0 GB", price: 1400, validity: "30 Days" },
    { id: "9mob-10gb", label: "9mobile CG 10.0 GB", price: 2800, validity: "30 Days" },
  ],
};

export async function POST(req: NextRequest) {
  try {
    // ── 1. Authenticate the request ──────────────────────────────────────────
    const reqClient = await createRequestClient(req);
    const { user } = reqClient;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
    }

    const { network, phone, planId, amount, pin, idempotency_key } = await req.json();

    // ── 2. Basic validation ──────────────────────────────────────────────────
    if (!network || !phone || !planId || typeof amount !== "number" || amount <= 0 || !pin) {
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

    // ── 3.5. Determine dynamic or static plan settings ──────────────────────
    let serviceID = network.toLowerCase();
    let planValue = planId;
    let purchaseAmount = amount;
    let planLabel = planId;

    const isDbPlan = /^\d+$/.test(String(planId));
    if (isDbPlan) {
      const svc = createServiceClient() as any;
      const { data: dbPlan, error: dbPlanErr } = await svc
        .from("data_plans")
        .select("*")
        .eq("id", planId)
        .maybeSingle();

      if (dbPlanErr || !dbPlan) {
        return NextResponse.json({ error: "Invalid data plan selected from database" }, { status: 400 });
      }

      serviceID = dbPlan.service;
      planValue = dbPlan.plan_value;
      purchaseAmount = Number(dbPlan.price);
      planLabel = dbPlan.display_name || (dbPlan.full_service_name || dbPlan.service) + " - " + dbPlan.plan_value;
    } else {
      const staticList = STATIC_DATA_PLANS[network.toLowerCase()] || [];
      const staticPlan = staticList.find((p) => p.id === planId);
      if (staticPlan) {
        purchaseAmount = staticPlan.price;
        planLabel = staticPlan.label;
      }
    }

    // ── 4. Fetch Wallet & Verify Balance ─────────────────────────────────────
    const wallet = await getWallet(user.id);
    if (Number(wallet.balance_withdrawable) < purchaseAmount) {
      return NextResponse.json({ error: "Insufficient withdrawable balance" }, { status: 400 });
    }

    // ── 5. Generate request_id for idempotency ───────────────────────────────
    const requestId = idempotency_key ?? crypto.randomUUID();

    // ── 6. Deduct funds atomically (with idempotency) ────────────────────────
    const ledgerRes = await applyTransaction(wallet.id, {
      service_type: "data",
      amount: purchaseAmount,
      description: "Data subscription: " + planLabel + " for " + phone,
      status: "pending",
      request_id: requestId,
    });

    const txnId = ledgerRes.transaction.id;

    if (ledgerRes.idempotent) {
      return NextResponse.json({
        success: true,
        reference: ledgerRes.transaction.reference,
        idempotent: true,
      });
    }

    const svc = createServiceClient();

    try {
      // ── 7. Call Payment Provider (GSubz) ─────────────────────────────────
      const providerRes = await gsubzPurchaseData({
        network: serviceID,
        phone,
        plan_id: planValue,
        amount: purchaseAmount,
        requestID: txnId,
      });

      if (providerRes.success) {
        await (svc as any)
          .from("transactions")
          .update({ status: "success", reference: providerRes.reference })
          .eq("id", txnId);

        return NextResponse.json({ success: true, reference: providerRes.reference });
      } else {
        await (svc as any)
          .from("transactions")
          .update({ status: "failed", description: "Failed: " + providerRes.message })
          .eq("id", txnId);

        await applyTransaction(wallet.id, {
          service_type: "refund",
          amount: purchaseAmount,
          description: "Refund: Failed data purchase for " + phone,
          status: "success",
          reference: txnId,
          request_id: "refund-" + requestId,
        });

        return NextResponse.json({ error: providerRes.message }, { status: 400 });
      }
    } catch (providerError: unknown) {
      const errMsg = (providerError as Error).message ?? "Provider connection error";
      await (svc as any)
        .from("transactions")
        .update({ status: "failed", description: "Failed: " + errMsg })
        .eq("id", txnId);

      await applyTransaction(wallet.id, {
        service_type: "refund",
        amount: purchaseAmount,
        description: "Refund: Failed data purchase for " + phone,
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

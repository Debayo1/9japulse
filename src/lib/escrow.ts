import { createServiceClient } from "./supabaseServer";

export async function lockFunds(
  orderId: string,
  sellerId: string,
  amount: number,
  commissionRate: number
) {
  const supabase = createServiceClient() as any;
  const commission = amount * (commissionRate / 100);
  const sellerPayout = amount - commission;

  const { error: walletErr } = await supabase
    .from("seller_wallets")
    .upsert(
      {
        seller_id: sellerId,
        balance_available: 0,
        balance_held: sellerPayout,
        total_earned: 0,
      },
      { onConflict: "seller_id" }
    );

  if (walletErr) {
    const { data: existing } = await supabase
      .from("seller_wallets")
      .select("balance_held")
      .eq("seller_id", sellerId)
      .single();

    if (existing) {
      const { error: updateErr } = await supabase
        .from("seller_wallets")
        .update({
          balance_held: Number(existing.balance_held) + sellerPayout,
          updated_at: new Date().toISOString(),
        })
        .eq("seller_id", sellerId);

      if (updateErr) throw new Error(updateErr.message);
    } else {
      throw new Error(walletErr.message);
    }
  }

  const { error: orderErr } = await supabase
    .from("seller_orders")
    .update({
      commission,
      seller_payout: sellerPayout,
      status: "funded",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (orderErr) throw new Error(orderErr.message);

  return { success: true, commission, sellerPayout };
}

export async function releaseFunds(orderId: string) {
  const supabase = createServiceClient() as any;

  const { data: order, error: fetchErr } = await supabase
    .from("seller_orders")
    .select("seller_id, seller_payout")
    .eq("id", orderId)
    .single();

  if (fetchErr || !order) throw new Error("Order not found");

  const sellerPayout = Number(order.seller_payout);

  const { error: walletErr } = await supabase
    .from("seller_wallets")
    .update({
      balance_held: Math.max(0, 0),
      balance_available: sellerPayout,
      updated_at: new Date().toISOString(),
    })
    .eq("seller_id", order.seller_id);

  if (walletErr) {
    const { data: wallet } = await supabase
      .from("seller_wallets")
      .select("balance_held, balance_available")
      .eq("seller_id", order.seller_id)
      .single();

    if (wallet) {
      const { error: retryErr } = await supabase
        .from("seller_wallets")
        .update({
          balance_held: Math.max(0, Number(wallet.balance_held) - sellerPayout),
          balance_available: Number(wallet.balance_available) + sellerPayout,
          updated_at: new Date().toISOString(),
        })
        .eq("seller_id", order.seller_id);

      if (retryErr) throw new Error(retryErr.message);
    } else {
      throw new Error(walletErr.message);
    }
  }

  const { error: orderErr } = await supabase
    .from("seller_orders")
    .update({
      status: "released",
      released_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (orderErr) throw new Error(orderErr.message);

  return { success: true, sellerPayout };
}

export async function confirmDelivery(orderId: string) {
  const supabase = createServiceClient() as any;

  const { error } = await supabase
    .from("seller_orders")
    .update({
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) throw new Error(error.message);

  return { success: true };
}

export async function getEscrowStatus(orderId: string) {
  const supabase = createServiceClient() as any;

  const { data, error } = await supabase
    .from("seller_orders")
    .select("id, status, commission, seller_payout, confirmed_at, released_at, created_at")
    .eq("id", orderId)
    .single();

  if (error || !data) throw new Error("Order not found");

  return data;
}

export async function autoReleaseExpired(legacyDbUrl?: string) {
  const supabase = createServiceClient() as any;

  const { data: settings } = await supabase
    .from("platform_settings")
    .select("seller_auto_release_days")
    .maybeSingle();

  const autoReleaseDays = Number(settings?.seller_auto_release_days ?? 7);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - autoReleaseDays);

  const { data: orders, error } = await supabase
    .from("seller_orders")
    .select("id")
    .eq("status", "confirmed")
    .lte("confirmed_at", cutoffDate.toISOString());

  if (error || !orders || orders.length === 0) return { success: true, count: 0 };

  let count = 0;
  for (const order of orders) {
    try {
      await releaseFunds(order.id);
      count++;
    } catch (err) {
      console.error(`[9jaPulse] autoRelease: failed to release order ${order.id}:`, err);
    }
  }

  return { success: true, count };
}

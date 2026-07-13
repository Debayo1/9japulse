"use server";

import { createServiceClient } from "./supabaseServer";
import type { SellerRow, SellerProductRow, SellerOrderRow } from "./database.types";

export async function applyAsSeller(
  userId: string,
  displayName: string,
  description?: string,
  phone?: string,
  email?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = createServiceClient() as any;

    const { data: existing } = await supabase
      .from("sellers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      return { success: false, message: "You have already applied as a seller." };
    }

    const { error } = await supabase.from("sellers").insert({
      user_id: userId,
      display_name: displayName,
      description: description ?? null,
      phone: phone ?? null,
      email: email ?? null,
      status: "pending",
    });

    if (error) throw new Error(error.message);

    return { success: true, message: "Seller application submitted successfully." };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to apply as seller." };
  }
}

export async function getSellerByUserId(userId: string): Promise<SellerRow | null> {
  const supabase = createServiceClient() as any;

  const { data, error } = await supabase
    .from("sellers")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as SellerRow;
}

export async function getSellerProducts(sellerId: string): Promise<SellerProductRow[]> {
  const supabase = createServiceClient() as any;

  const { data, error } = await supabase
    .from("seller_products")
    .select("*")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as SellerProductRow[];
}

export async function addSellerProduct(
  sellerId: string,
  product: {
    title: string;
    description?: string;
    price: number;
    category: string;
    stock_quantity: number;
    image_url?: string;
  }
): Promise<{ success: boolean; product: SellerProductRow | null }> {
  try {
    const supabase = createServiceClient() as any;

    const { data, error } = await supabase
      .from("seller_products")
      .insert({
        seller_id: sellerId,
        title: product.title,
        description: product.description ?? null,
        price: product.price,
        category: product.category,
        stock_quantity: product.stock_quantity,
        image_url: product.image_url ?? null,
        images: product.image_url ? [product.image_url] : [],
        is_active: true,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return { success: true, product: data as SellerProductRow };
  } catch (err: any) {
    return { success: false, product: null };
  }
}

export async function updateSellerProduct(
  productId: string,
  updates: Partial<{
    title: string;
    description: string;
    price: number;
    category: string;
    stock_quantity: number;
    image_url: string;
    is_active: boolean;
  }>
): Promise<{ success: boolean }> {
  try {
    const supabase = createServiceClient() as any;

    const payload: Record<string, any> = { ...updates, updated_at: new Date().toISOString() };

    const { error } = await supabase
      .from("seller_products")
      .update(payload)
      .eq("id", productId);

    if (error) throw new Error(error.message);

    return { success: true };
  } catch (err: any) {
    return { success: false };
  }
}

export async function deleteSellerProduct(productId: string): Promise<{ success: boolean }> {
  try {
    const supabase = createServiceClient() as any;

    const { error } = await supabase
      .from("seller_products")
      .delete()
      .eq("id", productId);

    if (error) throw new Error(error.message);

    return { success: true };
  } catch (err: any) {
    return { success: false };
  }
}

export async function getSellerOrders(sellerId: string): Promise<SellerOrderRow[]> {
  const supabase = createServiceClient() as any;

  const { data, error } = await supabase
    .from("seller_orders")
    .select("*")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as SellerOrderRow[];
}

export async function approveSeller(sellerId: string): Promise<{ success: boolean }> {
  try {
    const supabase = createServiceClient() as any;

    const { error: updateErr } = await supabase
      .from("sellers")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", sellerId);

    if (updateErr) throw new Error(updateErr.message);

    const { error: walletErr } = await supabase
      .from("seller_wallets")
      .upsert(
        {
          seller_id: sellerId,
          balance_available: 0,
          balance_held: 0,
          total_earned: 0,
        },
        { onConflict: "seller_id" }
      );

    if (walletErr) throw new Error(walletErr.message);

    return { success: true };
  } catch (err: any) {
    return { success: false };
  }
}

export async function getSellerStats(sellerId: string) {
  const supabase = createServiceClient() as any;

  const { count: totalProducts } = await supabase
    .from("seller_products")
    .select("*", { count: "exact", head: true })
    .eq("seller_id", sellerId);

  const { count: totalOrders } = await supabase
    .from("seller_orders")
    .select("*", { count: "exact", head: true })
    .eq("seller_id", sellerId);

  const { count: pendingOrders } = await supabase
    .from("seller_orders")
    .select("*", { count: "exact", head: true })
    .eq("seller_id", sellerId)
    .in("status", ["funded", "pending"]);

  const { data: completedOrders } = await supabase
    .from("seller_orders")
    .select("seller_payout")
    .eq("seller_id", sellerId)
    .in("status", ["released", "confirmed"]);

  const totalRevenue = (completedOrders ?? []).reduce(
    (sum: number, o: any) => sum + Number(o.seller_payout || 0),
    0
  );

  const { data: wallet } = await supabase
    .from("seller_wallets")
    .select("balance_available, balance_held")
    .eq("seller_id", sellerId)
    .maybeSingle();

  return {
    totalProducts: totalProducts ?? 0,
    totalOrders: totalOrders ?? 0,
    pendingOrders: pendingOrders ?? 0,
    totalRevenue,
    availableBalance: Number(wallet?.balance_available ?? 0),
    heldBalance: Number(wallet?.balance_held ?? 0),
  };
}

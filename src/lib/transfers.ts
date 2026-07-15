"use server";

import { createServerClient, createServiceClient } from "./supabaseServer";
import { getUser } from "./auth";
import { applyTransaction, getWallet } from "./ledger";

export async function lookupUser(username: string) {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const svc = createServiceClient();
  const { data } = await (svc as any)
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .eq("username", username.toLowerCase().trim())
    .maybeSingle();

  if (!data) throw new Error("User not found");
  return data;
}

export async function transferFunds(recipientUsername: string, amount: number, pin: string) {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const svc = createServiceClient();

  const { data: profile } = await (svc as any)
    .from("profiles")
    .select("pin")
    .eq("id", user.id)
    .single();

  if (!profile || String(profile.pin) !== String(pin)) {
    throw new Error("Incorrect transaction PIN");
  }

  const { data: recipient } = await (svc as any)
    .from("profiles")
    .select("id, full_name")
    .eq("username", recipientUsername.toLowerCase().trim())
    .maybeSingle();

  if (!recipient) throw new Error("Recipient not found");
  if (recipient.id === user.id) throw new Error("Cannot transfer to yourself");

  const wallet = await getWallet(user.id);
  if (wallet.balance_total < amount) throw new Error("Insufficient balance");

  const { data: rw } = await (svc as any)
    .from("wallets")
    .select("id")
    .eq("user_id", recipient.id)
    .single();
  if (!rw) throw new Error("Recipient wallet not found");

  const ref = `TRF-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  await applyTransaction(wallet.id, {
    service_type: "transfer",
    amount,
    description: `Transfer to @${recipientUsername}`,
    status: "success",
    reference: ref,
  });

  await applyTransaction(rw.id, {
    service_type: "transfer",
    amount,
    description: `Transfer from ${user.email ?? "user"}`,
    status: "success",
    reference: ref,
  });

  return { success: true, reference: ref };
}

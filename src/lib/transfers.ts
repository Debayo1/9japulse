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
  if (data.id === user.id) throw new Error("That's your own username");
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
  if (wallet.balance_withdrawable < amount) throw new Error("Insufficient balance");

  const { data: rw } = await (svc as any)
    .from("wallets")
    .select("id")
    .eq("user_id", recipient.id)
    .single();
  if (!rw) throw new Error("Recipient wallet not found");

  const ref = `TRF-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  await applyTransaction(wallet.id, {
    service_type: "p2p_transfer",
    amount,
    description: `Transfer to @${recipientUsername}`,
    status: "success",
    reference: ref,
  });

  await applyTransaction(rw.id, {
    service_type: "p2p_received",
    amount,
    description: `Transfer from @${profile.full_name ?? user.email ?? "user"}`,
    status: "success",
    reference: ref,
  });

  return { success: true, reference: ref };
}

export async function refundTransaction(walletId: string, transactionId: string, adminUserId: string) {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const svc = createServiceClient();
  const { data: txn } = await (svc as any)
    .from("transactions")
    .select("*")
    .eq("id", transactionId)
    .single();

  if (!txn) throw new Error("Transaction not found");
  if (txn.status === "success") throw new Error("Transaction already succeeded");

  const ref = `REF-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  await applyTransaction(walletId, {
    service_type: "refund",
    amount: txn.amount,
    description: `Refund for ${txn.reference ?? "failed transaction"}`,
    status: "success",
    reference: ref,
  });

  return { success: true, reference: ref };
}

import { createServiceClient } from "./supabaseServer";
import type { Database } from "./database.types";

// Service-role client — bypasses RLS for trusted server ledger operations
const supabase = createServiceClient();

type Transaction   = Database["public"]["Tables"]["transactions"]["Insert"];
type Wallet        = Database["public"]["Tables"]["wallets"]["Row"];
type WalletUpdate  = Database["public"]["Tables"]["wallets"]["Update"];

// ---
const CREDIT_SERVICE_TYPES = new Set([
  "wallet_funding", "cashback", "referral_bonus", "contest_payout",
  "refund", "deposit", "reward",
]);

const HELD_SERVICE_TYPES = new Set([
  "cashback", "referral_bonus", "contest_payout", "reward",
]);

// ---
export async function applyTransaction(
  walletId: string,
  txn: {
    service_type: string;
    amount: number;
    description?: string | null;
    status?: "pending" | "success" | "failed";
    reference?: string | null;
    meta?: any;
    request_id?: string | null;
  }
) {
  const isCredit = CREDIT_SERVICE_TYPES.has(txn.service_type);
  const isHeld   = HELD_SERVICE_TYPES.has(txn.service_type);
  const direction: "credit" | "debit" = isCredit ? "credit" : "debit";

  // Use the atomic RPC function that locks the wallet row with FOR UPDATE
  const { data, error } = await (supabase as any).rpc("apply_transaction_safe", {
    p_wallet_id: walletId,
    p_service_type: txn.service_type,
    p_amount: txn.amount,
    p_direction: direction,
    p_status: txn.status ?? "pending",
    p_description: txn.description ?? null,
    p_reference: txn.reference ?? null,
    p_meta: txn.meta ?? null,
    p_request_id: txn.request_id ?? null,
  });

  if (error) {
    throw new Error(error.message ?? "Ledger transaction failed");
  }

  // Parse the JSON result
  const result = typeof data === "string" ? JSON.parse(data) : data;

  return {
    transaction: result.transaction as Database["public"]["Tables"]["transactions"]["Row"],
    balance_total: Number(result.balance_total),
    balance_withdrawable: Number(result.balance_withdrawable),
    idempotent: Boolean(result.idempotent),
  };
}

// ---
export async function moveFunds(
  walletId: string,
  amount: number,
  toWithdrawable: boolean
) {
  // Use atomic RPC with FOR UPDATE lock to prevent race conditions
  const { data, error } = await (supabase as any).rpc("move_funds_safe", {
    p_wallet_id: walletId,
    p_amount: amount,
    p_to_withdrawable: toWithdrawable,
  });

  if (error) {
    throw new Error(error.message ?? "Failed to move funds");
  }

  const result = typeof data === "string" ? JSON.parse(data) : data;
  return {
    balance_total: Number(result.balance_total),
    balance_withdrawable: Number(result.balance_withdrawable),
  };
}

// ---
export async function getWallet(userId: string): Promise<Wallet> {
  // Use the stored procedure for idempotent profile+wallet creation
  try {
    const { data, error } = await (supabase as any).rpc("ensure_profile_and_wallet", {
      p_user_id: userId,
    });

    if (!error && data) {
      const result = typeof data === "string" ? JSON.parse(data) : data;
      if (result.wallet) {
        return result.wallet as Wallet;
      }
    }
  } catch (err: any) {
    console.warn("[9jaPulse] Self-healing RPC failed, falling back to manual:", err.message);
  }

  // Fallback: manual wallet lookup
  const { data, error } = await (supabase as any)
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .single() as { data: Wallet | null; error: any };

  if (error || !data) {
    console.warn("[9jaPulse] Wallet not found for user " + userId + ", creating one...");
    const { data: newWallet, error: createError } = await (supabase as any)
      .from("wallets")
      .insert({ user_id: userId, balance_total: 0, balance_withdrawable: 0 })
      .select()
      .single();

    if (createError) {
      console.error("[9jaPulse] Wallet self-healing insert error:", createError.message);
      throw new Error(createError.message);
    }
    return newWallet as Wallet;
  }
  return data;
}

// ---
export async function getTransactions(walletId: string, page = 0, limit = 20) {
  const from = page * limit;
  const to   = from + limit - 1;

  type TxRow = Database["public"]["Tables"]["transactions"]["Row"];

  const { data, error, count } = await (supabase as any)
    .from("transactions")
    .select("*", { count: "exact" })
    .eq("wallet_id", walletId)
    .order("created_at", { ascending: false })
    .range(from, to) as { data: TxRow[] | null; error: any; count: number | null };

  if (error) throw new Error(error.message);
  return { transactions: data ?? [], total: count ?? 0 };
}

import { createServiceClient } from "./supabaseServer";

// Service-role client — bypasses RLS for trusted server ledger operations
const supabase = createServiceClient();
import type { Database } from "./database.types";

type Transaction   = Database["public"]["Tables"]["transactions"]["Insert"];
type Wallet        = Database["public"]["Tables"]["wallets"]["Row"];
type WalletUpdate  = Database["public"]["Tables"]["wallets"]["Update"];

// ─── Credit / Debit decision ─────────────────────────────────────────────────
const CREDIT_SERVICE_TYPES = new Set([
  "wallet_funding", "cashback", "referral_bonus", "contest_payout",
  "refund", "deposit", "reward",
]);

const HELD_SERVICE_TYPES = new Set([
  "cashback", "referral_bonus", "contest_payout", "reward",
]);

// ─── Apply a transaction to a wallet ─────────────────────────────────────────
export async function applyTransaction(
  walletId: string,
  txn: {
    service_type: string;
    amount: number;
    description?: string | null;
    status?: "pending" | "success" | "failed";
    reference?: string | null;
    meta?: any;
  }
) {
  const isCredit = CREDIT_SERVICE_TYPES.has(txn.service_type);
  const isHeld   = HELD_SERVICE_TYPES.has(txn.service_type);
  const direction: "credit" | "debit" = isCredit ? "credit" : "debit";

  // 1. Record transaction row
  const { data: insertedTxn, error: txnError } = await (supabase as any)
    .from("transactions")
    .insert({
      wallet_id: walletId,
      service_type: txn.service_type,
      amount: txn.amount,
      description: txn.description ?? null,
      status: txn.status ?? "pending",
      reference: txn.reference ?? null,
      meta: txn.meta ?? null,
      direction,
    })
    .select()
    .single();

  if (txnError) throw new Error(txnError.message);

  // 2. Fetch current wallet balances
  const { data: wallet, error: walletError } = await (supabase as any)
    .from("wallets")
    .select("balance_total, balance_withdrawable")
    .eq("id", walletId)
    .single() as { data: Pick<Wallet, "balance_total" | "balance_withdrawable"> | null; error: any };

  if (walletError || !wallet) throw new Error(walletError?.message ?? "Wallet not found");

  let newTotal = wallet.balance_total;
  let newWithdrawable = wallet.balance_withdrawable;

  if (direction === "credit") {
    newTotal += txn.amount;
    if (!isHeld) newWithdrawable += txn.amount;
  } else {
    newTotal -= txn.amount;
    newWithdrawable = Math.max(0, newWithdrawable - txn.amount);
  }

  // 3. Update wallet balances
  const payload: WalletUpdate = {
    balance_total: newTotal,
    balance_withdrawable: newWithdrawable,
  };

  const { error: updateError } = await (supabase as any)
    .from("wallets")
    .update(payload)
    .eq("id", walletId);

  if (updateError) throw new Error(updateError.message);

  return {
    transaction: insertedTxn as Database["public"]["Tables"]["transactions"]["Row"],
    balance_total: newTotal,
    balance_withdrawable: newWithdrawable,
  };
}

// ─── Move funds (user-initiated only – no automatic cron) ────────────────────
export async function moveFunds(
  walletId: string,
  amount: number,
  toWithdrawable: boolean
) {
  const { data: wallet, error: walletError } = await (supabase as any)
    .from("wallets")
    .select("balance_total, balance_withdrawable")
    .eq("id", walletId)
    .single() as { data: Pick<Wallet, "balance_total" | "balance_withdrawable"> | null; error: any };

  if (walletError || !wallet) throw new Error(walletError?.message ?? "Wallet not found");

  let { balance_total: newTotal, balance_withdrawable: newWithdrawable } = wallet;

  if (toWithdrawable) {
    const held = newTotal - newWithdrawable;
    if (amount > held) throw new Error("Insufficient held funds to move");
    newWithdrawable += amount;
  } else {
    if (amount > newWithdrawable) throw new Error("Insufficient withdrawable funds");
    newWithdrawable -= amount;
  }

  const payload: WalletUpdate = {
    balance_withdrawable: newWithdrawable,
  };

  const { error: updateError } = await (supabase as any)
    .from("wallets")
    .update(payload)
    .eq("id", walletId);

  if (updateError) throw new Error(updateError.message);

  return { balance_total: newTotal, balance_withdrawable: newWithdrawable };
}

// ─── Get wallet for user (with automatic database self-healing for profiles/wallets) ───
export async function getWallet(userId: string): Promise<Wallet> {
  // 1. Ensure profile exists first
  try {
    const { data: profile } = await (supabase as any)
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (!profile) {
      console.warn(`[9jaPulse] Profile not found for user ${userId}, recreating profile row...`);
      // Fetch user information from Auth using admin client
      const { data: authUser, error: authErr } = await supabase.auth.admin.getUserById(userId);
      if (!authErr && authUser?.user) {
        const u = authUser.user;
        const { error: profileErr } = await (supabase as any)
          .from("profiles")
          .insert({
            id: userId,
            email: u.email!,
            full_name: u.user_metadata?.full_name || null,
            phone: u.user_metadata?.phone || null,
            pin: u.user_metadata?.transaction_pin || null
          });
        if (profileErr) {
          console.error("[9jaPulse] Profile self-healing insert error:", profileErr.message);
        }
      } else {
        console.error("[9jaPulse] Profile self-healing failed to fetch auth user:", authErr?.message);
      }
    }
  } catch (err: any) {
    console.error("[9jaPulse] Profile self-healing check error:", err.message || err);
  }

  // 2. Fetch or create wallet
  const { data, error } = await (supabase as any)
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .single() as { data: Wallet | null; error: any };

  if (error || !data) {
    console.warn(`[9jaPulse] Wallet not found for user ${userId}, creating one...`);
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

// ─── Get paginated transactions ───────────────────────────────────────────────
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

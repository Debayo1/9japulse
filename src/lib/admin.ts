"use server";

import type { User } from "@supabase/supabase-js";
import { createServiceClient } from "./supabaseServer";
import { getUser } from "./auth";

const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
);

export async function isAdminUser(user: User | null | undefined): Promise<boolean> {
  if (!user) return false;

  // 1. Check if email is in the ADMIN_EMAILS environment variable
  if (ADMIN_EMAILS.has((user.email ?? "").toLowerCase())) return true;

  const svc = createServiceClient() as any;

  // 2. Check if this user is explicitly set as admin in profiles table
  try {
    const { data } = await svc
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (String(data?.role ?? "").toLowerCase() === "admin") return true;
  } catch (err) {
    console.error("[9jaPulse] Error looking up user admin role:", err);
  }

  // 3. Bootstrap mode: If there are NO admin users in the database at all,
  // allow the current user to be treated as admin so they can configure it.
  try {
    const { count, error } = await svc
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");

    if (!error && count === 0) {
      console.warn(`[9jaPulse] No admin users found in database. Enabling bootstrap mode for user: ${user.email}`);
      return true;
    }
  } catch (err) {
    console.error("[9jaPulse] Error during admin bootstrap count check:", err);
  }

  return false;
}

export async function checkAdminStatus(): Promise<boolean> {
  try {
    const user = await getUser();
    return await isAdminUser(user);
  } catch {
    return false;
  }
}

export async function promoteUserToAdmin(email: string): Promise<{ success: boolean; message: string }> {
  try {
    const caller = await getUser();
    if (!caller) throw new Error("Unauthorized");

    const callerIsAdmin = await isAdminUser(caller);
    if (!callerIsAdmin) throw new Error("Unauthorized admin access required");

    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail) throw new Error("Email address is required");

    const svc = createServiceClient() as any;

    // Verify user profile exists
    const { data: targetProfile, error: profileErr } = await svc
      .from("profiles")
      .select("id")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (profileErr || !targetProfile) {
      throw new Error(`User with email "${cleanEmail}" does not exist in profiles table.`);
    }

    const { error: updateErr } = await svc
      .from("profiles")
      .update({ role: "admin" })
      .eq("email", cleanEmail);

    if (updateErr) throw new Error(updateErr.message);

    return {
      success: true,
      message: `User ${cleanEmail} has been promoted to Admin successfully!`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to promote user to Admin",
    };
  }
}

export async function updatePlatformSettingsAdminAction(settings: {
  app_name: string;
  deposit_fee: number;
  transfer_fee: number;
  bank_transfer_fee: number;
  app_maintenance: boolean;
  banner_text: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const caller = await getUser();
    if (!caller || !(await isAdminUser(caller))) throw new Error("Unauthorized");

    const svc = createServiceClient() as any;
    
    const { data: existing } = await svc
      .from("platform_settings")
      .select("id")
      .maybeSingle();

    let err;
    if (existing) {
      const { error } = await svc
        .from("platform_settings")
        .update({
          app_name: settings.app_name,
          deposit_fee: Number(settings.deposit_fee),
          transfer_fee: Number(settings.transfer_fee),
          bank_transfer_fee: Number(settings.bank_transfer_fee),
          app_maintenance: Boolean(settings.app_maintenance),
          banner_text: settings.banner_text,
          updated_at: new Date().toISOString()
        })
        .eq("id", existing.id);
      err = error;
    } else {
      const { error } = await svc
        .from("platform_settings")
        .insert({
          app_name: settings.app_name,
          deposit_fee: Number(settings.deposit_fee),
          transfer_fee: Number(settings.transfer_fee),
          bank_transfer_fee: Number(settings.bank_transfer_fee),
          app_maintenance: Boolean(settings.app_maintenance),
          banner_text: settings.banner_text
        });
      err = error;
    }

    if (err) throw new Error(err.message);
    return { success: true, message: "Platform settings updated successfully!" };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to update settings" };
  }
}

export async function updateUserBalanceAdminAction(
  userId: string,
  newBalance: number
): Promise<{ success: boolean; message: string }> {
  try {
    const caller = await getUser();
    if (!caller || !(await isAdminUser(caller))) throw new Error("Unauthorized");

    const svc = createServiceClient() as any;

    const { error } = await svc
      .from("wallets")
      .update({ balance_withdrawable: Number(newBalance), updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (error) throw new Error(error.message);
    return { success: true, message: "User balance updated successfully!" };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to update user balance" };
  }
}

export async function updateTransactionStatusAdminAction(
  txnId: string,
  status: string
): Promise<{ success: boolean; message: string }> {
  try {
    const caller = await getUser();
    if (!caller || !(await isAdminUser(caller))) throw new Error("Unauthorized");

    const svc = createServiceClient() as any;

    const { error } = await svc
      .from("transactions")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", txnId);

    if (error) throw new Error(error.message);
    return { success: true, message: `Transaction status changed to ${status}!` };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to update transaction status" };
  }
}

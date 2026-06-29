"use server";

import type { User } from "@supabase/supabase-js";
import { createServiceClient } from "./supabaseServer";
import { getUser } from "./auth";
import { getProviderKey } from "./providerKeys";

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

export async function updateUserVirtualAccountAdminAction(
  userId: string,
  params: {
    account_number?: string;
    bank_name?: string;
    bank_code?: string;
    account_to_lookup?: string;
    create_new?: boolean;
  }
): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    const caller = await getUser();
    if (!caller || !(await isAdminUser(caller))) throw new Error("Unauthorized");

    const svc = createServiceClient() as any;

    // Fetch user details
    const { data: profile } = await svc
      .from("profiles")
      .select("full_name, email, phone")
      .eq("id", userId)
      .maybeSingle();

    if (!profile) throw new Error("User profile not found");

    const trnxPin = await getProviderKey("ncwallet", "pin");
    const apiKey = await getProviderKey("ncwallet", "api_key");
    const baseUrl = "https://ncwallet.africa/api/v1";

    let payload: any = {};
    let accountNumber = params.account_number ?? "";
    let bankName = params.bank_name ?? "Palmpay";
    let bankCode = params.bank_code ?? "palmpay";
    let accountType = "static";
    let accountName = profile.full_name || profile.email || "User";
    let providerRef: string | null = null;
    let webhookUrl: string | null = null;

    // Case 1: Lookup existing account number
    if (params.account_to_lookup) {
      const res = await fetch(`${baseUrl}/bank/account-number/${params.account_to_lookup}`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "trnx_pin": trnxPin,
          "Authorization": apiKey,
        }
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && String(json.status ?? "").toLowerCase() === "success" && json.data) {
        payload = json.data;
        accountNumber = String(payload.account_number);
        bankName = String(payload.bank_name ?? "Palmpay");
        bankCode = String(payload.bank_code ?? "palmpay");
        accountName = String(payload.account_name ?? accountName);
        providerRef = json.ref_id || null;
      } else {
        throw new Error(json.message || "Lookup failed or account not found on NCWallet");
      }
    }
    // Case 2: Create brand new from NCWallet
    else if (params.create_new) {
      let bvn = process.env.NCWALLET_BVN ?? "";
      if (!bvn) {
        try {
          bvn = await getProviderKey("ncwallet", "bvn");
        } catch {
          bvn = "";
        }
      }
      if (!bvn) throw new Error("Missing NCWallet BVN. Please set NCWALLET_BVN.");

      const res = await fetch(`${baseUrl}/bank/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "trnx_pin": trnxPin,
          "Authorization": apiKey,
        },
        body: JSON.stringify({
          bank_code: "palmpay",
          account_name: accountName,
          email: profile.email,
          phone_number: profile.phone || "",
          account_type: "static",
          validation_type: "BVN",
          validation_number: bvn,
        }),
      });

      const json = await res.json().catch(() => ({}));
      const success = res.ok && String(json.status ?? "").toLowerCase() === "success";
      if (success && json.data) {
        payload = json.data;
        accountNumber = String(payload.account_number);
        bankName = String(payload.bank_name ?? "Palmpay");
        bankCode = String(payload.bank_code ?? "palmpay");
        accountName = String(payload.account_name ?? accountName);
        providerRef = json.ref_id || null;
        webhookUrl = typeof payload.webhook_url === "string" ? payload.webhook_url : null;
      } else {
        throw new Error(json.message || "Failed to create virtual account on NCWallet");
      }
    }

    // Save/Upsert in supabase virtual_accounts table
    const { data: saved, error } = await svc
      .from("virtual_accounts")
      .upsert({
        user_id: userId,
        provider: params.create_new || params.account_to_lookup ? "ncwallet" : "manual",
        provider_reference: providerRef,
        account_number: accountNumber,
        account_name: accountName,
        bank_code: bankCode,
        bank_name: bankName,
        account_type: accountType,
        status: "active",
        webhook_url: webhookUrl,
        meta: payload,
      }, { onConflict: "user_id" })
      .select()
      .single();

    if (error || !saved) {
      throw new Error(error?.message ?? "Failed to save virtual account record");
    }

    return {
      success: true,
      message: "Virtual account details synced successfully!",
      data: saved
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to sync virtual account"
    };
  }
}

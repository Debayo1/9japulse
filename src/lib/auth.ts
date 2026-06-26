"use server";

import { supabase } from "./supabaseClient";
import { createServerClient } from "./supabaseServer";
import { ensureDbColumnsExist } from "./dbAdmin";

// ─── Sign Up ─────────────────────────────────────────────────────────────────
export async function signUp(
  email: string,
  password: string,
  fullName: string,
  phone: string,
  pin: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone, transaction_pin: pin },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`,
    },
  });

  if (error) throw new Error(error.message);
  return data;
}

// ─── Sign In ─────────────────────────────────────────────────────────────────
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new Error(error.message);
  return data;
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

// ─── Reset Password ───────────────────────────────────────────────────────────
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/reset-confirm`,
  });

  if (error) throw new Error(error.message);
}

// ─── Confirm Password Reset ───────────────────────────────────────────────────
export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}

// ─── Update Transaction PIN ───────────────────────────────────────────────────
export async function updateTransactionPin(currentPin: string | null, newPin: string) {
  try {
    await ensureDbColumnsExist();
    const { client, accessToken } = await createServerClient();
    if (!accessToken) throw new Error("Unauthorized");

    const { data: { user }, error: userError } = await client.auth.getUser(accessToken);
    if (userError || !user) throw new Error("Unauthorized");

    let storedPin: string | null = null;
    try {
      const { data: profile } = await (client as any)
        .from("profiles")
        .select("pin")
        .eq("id", user.id)
        .single();
      storedPin = profile?.pin || null;
    } catch (e) {
      console.warn("[9jaPulse] profiles.pin column missing or PostgREST cache stale during select:", e);
    }

    if (!storedPin) {
      storedPin = user.user_metadata?.transaction_pin || null;
    }

    if (storedPin && String(currentPin) !== String(storedPin)) {
      throw new Error("Incorrect current PIN");
    }

    const { error: dbError } = await (client as any)
      .from("profiles")
      .update({ pin: newPin })
      .eq("id", user.id);
      
    if (dbError) {
      const isMissingColumn = dbError.code === "PGRST100" || 
                              dbError.message?.includes("column") || 
                              dbError.message?.includes("cache") ||
                              dbError.message?.includes("not find");
      if (!isMissingColumn) {
        throw new Error(dbError.message);
      }
      console.warn("[9jaPulse] profiles.pin column missing or PostgREST cache stale. Storing PIN in auth metadata only.");
    }

    const { error: authError } = await client.auth.updateUser({
      data: { transaction_pin: newPin }
    });
    if (authError) throw new Error(authError.message);

    return { success: true };
  } catch (err: any) {
    throw new Error(err.message || "Failed to update transaction PIN");
  }
}


// ─── Get Current Session ──────────────────────────────────────────────────────
export async function getSession() {
  try {
    const { client, accessToken, refreshToken } = await createServerClient();
    if (!accessToken) return null;
    const { data, error } = await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken ?? "",
    });
    if (error) throw new Error(error.message);
    return data.session;
  } catch {
    return null;
  }
}

// ─── Get Current User ─────────────────────────────────────────────────────────
export async function getUser() {
  try {
    const { client, accessToken } = await createServerClient();
    if (!accessToken) return null;
    const { data, error } = await client.auth.getUser(accessToken);
    if (error) return null;
    return data.user;
  } catch {
    return null;
  }
}

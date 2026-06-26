"use server";

import { supabase } from "./supabaseClient";
import { createServerClient } from "./supabaseServer";

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

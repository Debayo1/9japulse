"use server";

import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import { createServerClient, createServiceClient } from "./supabaseServer";
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
export async function updateTransactionPin(
  currentPin: string | null,
  newPin: string,
  accessTokenOverride?: string,
  refreshTokenOverride?: string
) {
  try {
    await ensureDbColumnsExist();
    const { client, accessToken, refreshToken } = await createServerClient(
      accessTokenOverride ?? null,
      refreshTokenOverride ?? null
    );
    if (!accessToken) throw new Error("Unauthorized");

    if (refreshToken) {
      const { error: sessionError } = await client.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError) throw new Error(sessionError.message);
    }

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
  } catch (err: unknown) {
    throw new Error(err instanceof Error ? err.message : "Failed to update transaction PIN");
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

    const fallbackUser = decodeUserFromJwt(accessToken);
    try {
      const { data, error } = await client.auth.getUser(accessToken);
      if (!error && data.user) return data.user;
    } catch (error) {
      console.warn("[9jaPulse] Supabase auth lookup failed, falling back to cookie JWT:", error);
    }

    return fallbackUser;
  } catch {
    return null;
  }
}

function decodeUserFromJwt(token: string): User | null {
  const payload = parseJwtPayload(token);
  if (!payload?.sub) return null;

  return {
    id: payload.sub,
    aud: typeof payload.aud === "string" ? payload.aud : "authenticated",
    role: typeof payload.role === "string" ? payload.role : "authenticated",
    email: typeof payload.email === "string" ? payload.email : null,
    phone: typeof payload.phone === "string" ? payload.phone : null,
    created_at: new Date((typeof payload.iat === "number" ? payload.iat : 0) * 1000).toISOString(),
    updated_at: new Date((typeof payload.iat === "number" ? payload.iat : 0) * 1000).toISOString(),
    last_sign_in_at: null,
    app_metadata: (payload.app_metadata as Record<string, unknown>) ?? {},
    user_metadata: (payload.user_metadata as Record<string, unknown>) ?? {},
    identities: [],
  } as unknown as User;
}

function parseJwtPayload(token: string): Record<string, unknown> | null {
  const [, payload] = token.split(".");
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// ─── App Lock Passcode Actions ────────────────────────────────────────────────
export async function updateAppPasscode(
  currentPasscode: string | null,
  newPasscode: string,
  accessTokenOverride?: string,
  refreshTokenOverride?: string
): Promise<{ success: boolean }> {
  try {
    const { client, accessToken, refreshToken } = await createServerClient(
      accessTokenOverride ?? null,
      refreshTokenOverride ?? null
    );
    if (!accessToken) throw new Error("Unauthorized");

    if (refreshToken) {
      await client.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }

    const { data: { user }, error: userError } = await client.auth.getUser(accessToken);
    if (userError || !user) throw new Error("Unauthorized");

    const svc = createServiceClient() as any;

    if (currentPasscode) {
      const { data: profile } = await svc
        .from("profiles")
        .select("passcode")
        .eq("id", user.id)
        .single();
      
      if (profile?.passcode && String(profile.passcode) !== String(currentPasscode)) {
        throw new Error("Current passcode is incorrect");
      }
    }

    const { error } = await svc
      .from("profiles")
      .update({ passcode: newPasscode })
      .eq("id", user.id);

    if (error) throw new Error(error.message);
    return { success: true };
  } catch (err: any) {
    throw new Error(err.message || "Failed to update passcode");
  }
}

export async function verifyAppPasscodeAction(passcode: string): Promise<{ success: boolean; message: string }> {
  try {
    const { client, accessToken } = await createServerClient();
    if (!accessToken) throw new Error("Unauthorized");

    const { data: { user }, error: userError } = await client.auth.getUser(accessToken);
    if (userError || !user) throw new Error("Unauthorized");

    const svc = createServiceClient() as any;
    const { data: profile, error } = await svc
      .from("profiles")
      .select("passcode")
      .eq("id", user.id)
      .single();

    if (error || !profile) {
      throw new Error("Failed to load user profile passcode");
    }

    if (!profile.passcode) {
      return { success: true, message: "Passcode not set" };
    }

    if (String(passcode) === String(profile.passcode)) {
      return { success: true, message: "Passcode correct" };
    } else {
      return { success: false, message: "Incorrect passcode" };
    }
  } catch (err: any) {
    return { success: false, message: err.message || "Passcode verification failed" };
  }
}

export async function checkHasPasscodeAction(): Promise<{ success: boolean; hasPasscode: boolean }> {
  try {
    const { client, accessToken } = await createServerClient();
    if (!accessToken) return { success: false, hasPasscode: false };

    const { data: { user } } = await client.auth.getUser(accessToken);
    if (!user) return { success: false, hasPasscode: false };

    const svc = createServiceClient() as any;
    const { data: profile } = await svc
      .from("profiles")
      .select("passcode")
      .eq("id", user.id)
      .maybeSingle();

    return { success: true, hasPasscode: !!profile?.passcode };
  } catch {
    return { success: false, hasPasscode: false };
  }
}


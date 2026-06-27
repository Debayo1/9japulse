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

"use server";

import type { User } from "@supabase/supabase-js";
import { createServiceClient } from "./supabaseServer";

const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
);

export async function isAdminUser(user: User | null | undefined) {
  if (!user) return false;

  const metadataRole = String(user.user_metadata?.role ?? user.app_metadata?.role ?? "").toLowerCase();
  if (metadataRole === "admin") return true;

  if (ADMIN_EMAILS.has((user.email ?? "").toLowerCase())) return true;

  const svc = createServiceClient() as any;
  const { data } = await svc
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return String(data?.role ?? "").toLowerCase() === "admin";
}

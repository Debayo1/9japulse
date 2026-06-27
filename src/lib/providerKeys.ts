"use server";

import { createServiceClient } from "./supabaseServer";
import { ensureDbColumnsExist } from "./dbAdmin";

export async function getProviderKey(provider: string, keyName: string): Promise<string> {
  await ensureDbColumnsExist();

  const svc = createServiceClient() as any;
  const { data, error } = await svc
    .from("provider_keys")
    .select("key_value")
    .eq("provider", provider)
    .eq("key_name", keyName)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    throw new Error(`Missing or inactive key "${keyName}" for provider "${provider}".`);
  }

  return data.key_value;
}

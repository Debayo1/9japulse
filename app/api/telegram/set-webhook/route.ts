import { NextResponse } from "next/server";
import { Bot } from "grammy";
import { createServiceClient } from "../../../../src/lib/supabaseServer";

export async function POST() {
  try {
    const svc = createServiceClient() as any;

    let botToken = process.env.TELEGRAM_BOT_TOKEN || "";

    const { data: keyRow } = await svc
      .from("provider_keys")
      .select("key_value")
      .eq("provider", "telegram")
      .eq("key_name", "bot_token")
      .maybeSingle();

    if (keyRow?.key_value) {
      botToken = keyRow.key_value;
    }

    if (!botToken) throw new Error("Telegram bot token not found. Save it in Provider Keys first.");

    const url = process.env.NEXT_PUBLIC_APP_URL;
    if (!url) throw new Error("NEXT_PUBLIC_APP_URL is not set");

    const bot = new Bot(botToken);
    await bot.api.setWebhook(url + "/api/telegram", {
      secret_token: process.env.TELEGRAM_WEBHOOK_SECRET,
    });

    return NextResponse.json({ success: true, url: url + "/api/telegram" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

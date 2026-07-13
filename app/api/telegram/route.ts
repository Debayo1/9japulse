import { NextRequest, NextResponse } from "next/server";
import { processTelegramUpdate } from "../../../bot/src/telegram";
import { createServiceClient } from "../../../src/lib/supabaseServer";
import { Bot } from "grammy";

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-telegram-bot-api-secret-token");
    if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const body = await req.json();

    await processTelegramUpdate(body, botToken);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[9jaPulse Telegram] Webhook error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", bot: "9jaPulse" });
}

export async function setTelegramWebhook() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) throw new Error("TELEGRAM_BOT_TOKEN is not set");

  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (!url) throw new Error("NEXT_PUBLIC_APP_URL is not set");

  const bot = new Bot(botToken);
  await bot.api.setWebhook(url + "/api/telegram", {
    secret_token: process.env.TELEGRAM_WEBHOOK_SECRET,
  });

  return { success: true, url: url + "/api/telegram" };
}

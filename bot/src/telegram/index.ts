import { Bot, Context } from "grammy";
import { chat } from "../ai";
import { createServiceClient } from "../../../src/lib/supabaseServer";

const APP_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://9japulse.com";

const WELCOME_MESSAGE = [
  "Welcome to 9jaPulse Pulse! ",
  "I'm your AI assistant for airtime, data, bills, and marketplace shopping.",
  "",
  "Here's what I can do:",
  "/balance - Check your wallet balance",
  "/plans - View available data plans",
  "/help - See all commands",
  "",
  "Or just send me a message to chat!",
].join("\n");

const HELP_MESSAGE = [
  "Available Commands:",
  "",
  "/start - Welcome message & getting started",
  "/help - Show this help message",
  "/balance - Check your wallet balance",
  "/plans - Browse available data plans",
  "",
  "You can also just type anything to chat with Pulse AI.",
  "I can help you buy airtime, data, browse products, and more!",
].join("\n");

const NOT_LINKED_MESSAGE = [
  "You haven't linked your 9jaPulse account yet.",
  "",
  "Link your account to start using Pulse:",
  `${APP_URL}/link-telegram`,
  "",
  "Once linked, you can check your balance, buy airtime/data, and more!",
].join("\n");

async function getLinkedUserId(telegramUserId: string): Promise<string | null> {
  const supabase = createServiceClient();
  const { data } = await (supabase as any)
    .from("chat_conversations")
    .select("user_id")
    .eq("channel", "telegram")
    .eq("channel_user_id", telegramUserId)
    .limit(1)
    .single();
  return data?.user_id ?? null;
}

function registerHandlers(bot: Bot) {
  bot.command("start", async (ctx: Context) => {
    try {
      const telegramUserId = String(ctx.from?.id || "");
      const linkedUserId = await getLinkedUserId(telegramUserId);

      if (!linkedUserId) {
        await ctx.reply(NOT_LINKED_MESSAGE);
        return;
      }

      await ctx.reply(WELCOME_MESSAGE);
    } catch {
      await ctx.reply("Something went wrong. Please try again.");
    }
  });

  bot.command("help", async (ctx: Context) => {
    try {
      await ctx.reply(HELP_MESSAGE);
    } catch {
      await ctx.reply("Something went wrong. Please try again.");
    }
  });

  bot.command("balance", async (ctx: Context) => {
    try {
      const telegramUserId = String(ctx.from?.id || "");
      const linkedUserId = await getLinkedUserId(telegramUserId);

      if (!linkedUserId) {
        await ctx.reply(NOT_LINKED_MESSAGE);
        return;
      }

      const response = await chat(
        linkedUserId,
        [{ role: "user", content: "Check my wallet balance" }],
        "telegram"
      );
      await ctx.reply(response);
    } catch {
      await ctx.reply("Could not check your balance. Please try again.");
    }
  });

  bot.command("plans", async (ctx: Context) => {
    try {
      const telegramUserId = String(ctx.from?.id || "");
      const linkedUserId = await getLinkedUserId(telegramUserId);

      if (!linkedUserId) {
        await ctx.reply(NOT_LINKED_MESSAGE);
        return;
      }

      const response = await chat(
        linkedUserId,
        [{ role: "user", content: "Show me available data plans" }],
        "telegram"
      );
      await ctx.reply(response);
    } catch {
      await ctx.reply("Could not load data plans. Please try again.");
    }
  });

  bot.on("message:text", async (ctx: Context) => {
    try {
      const telegramUserId = String(ctx.from?.id || "");
      const messageText = ctx.message?.text || "";
      const linkedUserId = await getLinkedUserId(telegramUserId);

      if (!linkedUserId) {
        await ctx.reply(NOT_LINKED_MESSAGE);
        return;
      }

      await ctx.reply("Thinking...");

      const response = await chat(
        linkedUserId,
        [{ role: "user", content: messageText }],
        "telegram"
      );
      await ctx.reply(response);
    } catch {
      await ctx.reply("Something went wrong. Please try again.");
    }
  });
}

export function initTelegramBot(token: string): Bot {
  const bot = new Bot(token);
  registerHandlers(bot);
  return bot;
}

export async function processTelegramUpdate(body: any, token: string) {
  const bot = initTelegramBot(token);
  await bot.handleUpdate(body);
  return { ok: true };
}

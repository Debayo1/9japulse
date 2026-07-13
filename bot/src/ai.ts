import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createServiceClient } from "../../src/lib/supabaseServer";
import { applyTransaction, getWallet } from "../../src/lib/ledger";
import {
  ncwalletPurchaseAirtime,
  ncwalletPurchaseData,
} from "../../src/lib/providers/ncwallet";
import { getSystemPrompt } from "./prompts";
import {
  checkBalance as baseCheckBalance,
  buyAirtime as baseBuyAirtime,
  buyData as baseBuyData,
  getPlans as baseGetPlans,
  searchProducts as baseSearchProducts,
  listMyProducts as baseListMyProducts,
  addProduct as baseAddProduct,
  getOrders as baseGetOrders,
} from "./tools";

const NETWORK_MAP: Record<string, string> = {
  mtn: "MTN",
  airtel: "Airtel",
  glo: "Glo",
  "9mobile": "9mobile",
};

async function verifyPin(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  pin: string
): Promise<boolean> {
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("pin")
    .eq("id", userId)
    .single();

  let storedPin = profile?.pin;

  if (!storedPin) {
    const {
      data: { user },
    } = await supabase.auth.admin.getUserById(userId);
    storedPin = user?.user_metadata?.transaction_pin;
  }

  return !!storedPin && String(storedPin) === String(pin);
}

export async function chat(
  userId: string,
  messages: Array<{ role: string; content: string }>,
  channel: string
): Promise<string> {
  const supabase = createServiceClient();

  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!profile) {
    return "Your profile was not found. Please log in and try again.";
  }

  const { data: settings } = await (supabase as any)
    .from("platform_settings")
    .select("*")
    .limit(1)
    .single();

  if (!settings) {
    return "Platform settings could not be loaded. Please try again later.";
  }

  if (settings.bot_enabled === false) {
    return "The 9jaPulse assistant is currently disabled. Please check back later.";
  }

  if (settings.app_maintenance) {
    return "9jaPulse is currently under maintenance. Please try again soon.";
  }

  let { data: subscription } = await (supabase as any)
    .from("bot_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("channel", channel)
    .single();

  if (!subscription) {
    const { data: created } = await (supabase as any)
      .from("bot_subscriptions")
      .insert({
        user_id: userId,
        channel,
        plan: "free",
        messages_used: 0,
        messages_limit: settings.bot_free_messages_per_day ?? 50,
      })
      .select()
      .single();
    subscription = created;
  }

  if (!subscription) {
    return "Could not initialise your chat session. Please try again.";
  }

  const isPaid =
    subscription.plan !== "free" &&
    (!subscription.expires_at || new Date(subscription.expires_at) > new Date());

  if (!isPaid) {
    if (
      subscription.plan === "free" &&
      subscription.messages_used >= (subscription.messages_limit ?? 0)
    ) {
      return "You've used all your free messages for today! Upgrade to a paid plan to keep chatting with Pulse.";
    }
  } else {
    if (subscription.expires_at && new Date(subscription.expires_at) < new Date()) {
      return "Your subscription has expired. Please renew to continue using Pulse.";
    }
  }

  const { data: seller } = await (supabase as any)
    .from("sellers")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "approved")
    .single();

  const sellerApproved = !!seller;
  const sellerId = seller?.id ?? null;

  let googleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "";
  if (!googleApiKey) {
    try {
      const { data: keyData } = await (supabase as any)
        .from("provider_keys")
        .select("key_value")
        .eq("provider", "google")
        .eq("key_name", "api_key")
        .eq("is_active", true)
        .single();
      googleApiKey = keyData?.key_value ?? "";
    } catch {
      /* key not in DB */
    }
  }

  if (!googleApiKey) {
    return "Pulse is not configured yet — the AI provider key is missing. Please contact support.";
  }

  const google = createGoogleGenerativeAI({ apiKey: googleApiKey });
  const systemPrompt = getSystemPrompt(
    profile.full_name || profile.email || "there",
    isPaid,
    sellerApproved
  );

  const tools = {
    checkBalance: {
      ...baseCheckBalance,
      execute: async () => {
        try {
          const { data: wallet } = await (supabase as any)
            .from("wallets")
            .select("balance_total, balance_withdrawable")
            .eq("user_id", userId)
            .single();

          if (!wallet) {
            return { success: false, message: "Wallet not found." };
          }

          return {
            success: true,
            totalBalance: wallet.balance_total,
            withdrawableBalance: wallet.balance_withdrawable,
            message: `Your wallet balance is ₦${Number(wallet.balance_total).toLocaleString("en-NG", { minimumFractionDigits: 2 })} (withdrawable: ₦${Number(wallet.balance_withdrawable).toLocaleString("en-NG", { minimumFractionDigits: 2 })})`,
          };
        } catch {
          return { success: false, message: "Could not load your wallet. Please try again." };
        }
      },
    },

    buyAirtime: {
      ...baseBuyAirtime,
      execute: async ({ network, amount, phone, pin }: { network: string; amount: number; phone: string; pin: string }) => {
        try {
          const pinValid = await verifyPin(supabase, userId, pin);
          if (!pinValid) {
            return { success: false, message: "Incorrect transaction PIN. Please try again." };
          }

          const wallet = await getWallet(userId);

          if (wallet.balance_withdrawable < amount) {
            return {
              success: false,
              message: `Insufficient balance. You need ₦${amount.toLocaleString()} but your withdrawable balance is ₦${wallet.balance_withdrawable.toLocaleString("en-NG", { minimumFractionDigits: 2 })}.`,
            };
          }

          const providerNetwork = NETWORK_MAP[network] ?? network;
          const result = await ncwalletPurchaseAirtime({
            network: providerNetwork as "MTN" | "Airtel" | "Glo" | "9mobile",
            phone,
            amount,
          });

          if (!result.success) {
            return { success: false, message: result.message };
          }

          const reference = result.reference || `BOT-AT-${Date.now()}`;

          await applyTransaction(wallet.id, {
            service_type: "airtime_purchase",
            amount,
            description: `Airtime ₦${amount} to ${phone} (${providerNetwork})`,
            status: "success",
            reference,
            meta: { network, phone, amount, provider: "ncwallet" },
          });

          return {
            success: true,
            message: `₦${amount.toLocaleString()} ${providerNetwork} airtime sent to ${phone} successfully!`,
            reference,
          };
        } catch (err: any) {
          return {
            success: false,
            message: err?.message ?? "Airtime purchase failed. Please try again.",
          };
        }
      },
    },

    buyData: {
      ...baseBuyData,
      execute: async ({ network, plan, phone, pin }: { network: string; plan: string; phone: string; pin: string }) => {
        try {
          const pinValid = await verifyPin(supabase, userId, pin);
          if (!pinValid) {
            return { success: false, message: "Incorrect transaction PIN. Please try again." };
          }

          const { data: planRow } = await (supabase as any)
            .from("data_plans")
            .select("*")
            .eq("plan_value", plan)
            .single();

          if (!planRow) {
            return {
              success: false,
              message: `Data plan "${plan}" not found. Use getPlans to see available plans.`,
            };
          }

          const amount = Number(planRow.price);
          const wallet = await getWallet(userId);

          if (wallet.balance_withdrawable < amount) {
            return {
              success: false,
              message: `Insufficient balance. This plan costs ₦${amount.toLocaleString()} but your withdrawable balance is ₦${wallet.balance_withdrawable.toLocaleString("en-NG", { minimumFractionDigits: 2 })}.`,
            };
          }

          const providerNetwork = NETWORK_MAP[network] ?? network;
          const result = await ncwalletPurchaseData({
            network: providerNetwork as "MTN" | "Airtel" | "Glo" | "9mobile",
            phone,
            plan_id: plan,
            amount,
          });

          if (!result.success) {
            return { success: false, message: result.message };
          }

          const reference = result.reference || `BOT-DT-${Date.now()}`;

          await applyTransaction(wallet.id, {
            service_type: "data_purchase",
            amount,
            description: `Data ${planRow.display_name || plan} to ${phone} (${providerNetwork})`,
            status: "success",
            reference,
            meta: { network, phone, plan, amount, provider: "ncwallet" },
          });

          return {
            success: true,
            message: `${planRow.display_name || plan} data sent to ${phone} successfully! ₦${amount.toLocaleString()} was deducted.`,
            reference,
          };
        } catch (err: any) {
          return {
            success: false,
            message: err?.message ?? "Data purchase failed. Please try again.",
          };
        }
      },
    },

    getPlans: {
      ...baseGetPlans,
      execute: async ({ network }: { network?: string }) => {
        try {
          let query = (supabase as any)
            .from("data_plans")
            .select("service, display_name, plan_value, price, full_service_name")
            .order("price", { ascending: true });

          if (network) {
            const n = network.toLowerCase();
            if (n === "9mobile") {
              query = query.or("service.ilike.%etisalat%,service.ilike.%9mobile%");
            } else {
              query = query.ilike("service", `${n}%`);
            }
          }

          const { data, error } = await query;

          if (error) {
            return { success: false, message: "Could not load data plans.", plans: [] };
          }

          if (!data || data.length === 0) {
            return {
              success: true,
              message: network ? `No data plans found for ${network}.` : "No data plans available.",
              plans: [],
            };
          }

          const plans = data.map((p: any) => ({
            network: p.service,
            name: p.display_name || p.full_service_name || p.plan_value,
            plan_value: p.plan_value,
            price: Number(p.price),
          }));

          return {
            success: true,
            message: `Found ${plans.length} data plan(s).`,
            plans,
          };
        } catch {
          return { success: false, message: "Could not load data plans.", plans: [] };
        }
      },
    },

    searchProducts: {
      ...baseSearchProducts,
      execute: async ({ query, category }: { query?: string; category?: string }) => {
        try {
          let q = (supabase as any)
            .from("marketplace_products")
            .select("id, title, description, price, category, stock_quantity, rating")
            .eq("is_active", true)
            .order("created_at", { ascending: false });

          if (category) {
            q = q.ilike("category", category);
          }
          if (query) {
            q = q.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
          }

          q = q.limit(10);

          const { data, error } = await q;

          if (error || !data || data.length === 0) {
            return {
              success: true,
              message: "No products found matching your search.",
              products: [],
            };
          }

          const products = data.map((p: any) => ({
            id: p.id,
            title: p.title,
            price: Number(p.price),
            category: p.category,
            stock: p.stock_quantity,
            rating: p.rating,
          }));

          return {
            success: true,
            message: `Found ${products.length} product(s).`,
            products,
          };
        } catch {
          return { success: false, message: "Could not search products.", products: [] };
        }
      },
    },

    listMyProducts: {
      ...baseListMyProducts,
      execute: async () => {
        if (!sellerId) {
          return { success: false, message: "You are not an approved seller.", products: [] };
        }

        try {
          const { data, error } = await (supabase as any)
            .from("seller_products")
            .select("id, title, price, category, stock_quantity, is_active, created_at")
            .eq("seller_id", sellerId)
            .order("created_at", { ascending: false });

          if (error) {
            return { success: false, message: "Could not load your products.", products: [] };
          }

          if (!data || data.length === 0) {
            return { success: true, message: "You have no products yet.", products: [] };
          }

          const products = data.map((p: any) => ({
            id: p.id,
            title: p.title,
            price: Number(p.price),
            category: p.category,
            stock: p.stock_quantity,
            active: p.is_active,
          }));

          return {
            success: true,
            message: `You have ${products.length} product(s).`,
            products,
          };
        } catch {
          return { success: false, message: "Could not load your products.", products: [] };
        }
      },
    },

    addProduct: {
      ...baseAddProduct,
      execute: async ({ title, description, price, category, stock }: { title: string; description: string; price: number; category: string; stock: number }) => {
        if (!sellerId) {
          return { success: false, message: "You are not an approved seller." };
        }

        try {
          const { data, error } = await (supabase as any)
            .from("seller_products")
            .insert({
              seller_id: sellerId,
              title,
              description,
              price,
              category,
              stock_quantity: stock,
              images: [],
              is_active: true,
            })
            .select("id, title")
            .single();

          if (error) {
            return { success: false, message: `Failed to add product: ${error.message}` };
          }

          return {
            success: true,
            message: `Product "${data.title}" added successfully!`,
            productId: data.id,
          };
        } catch (err: any) {
          return {
            success: false,
            message: err?.message ?? "Failed to add product.",
          };
        }
      },
    },

    getOrders: {
      ...baseGetOrders,
      execute: async () => {
        if (!sellerId) {
          return { success: false, message: "You are not an approved seller.", orders: [] };
        }

        try {
          const { data, error } = await (supabase as any)
            .from("seller_orders")
            .select(
              "id, product_title, quantity, amount, status, shipping_name, shipping_phone, shipping_address, created_at"
            )
            .eq("seller_id", sellerId)
            .order("created_at", { ascending: false })
            .limit(20);

          if (error) {
            return { success: false, message: "Could not load orders.", orders: [] };
          }

          if (!data || data.length === 0) {
            return { success: true, message: "You have no orders yet.", orders: [] };
          }

          const orders = data.map((o: any) => ({
            id: o.id,
            product: o.product_title,
            quantity: o.quantity,
            amount: Number(o.amount),
            status: o.status,
            buyer: o.shipping_name,
            phone: o.shipping_phone,
            address: o.shipping_address,
            date: o.created_at,
          }));

          return {
            success: true,
            message: `You have ${orders.length} order(s).`,
            orders,
          };
        } catch {
          return { success: false, message: "Could not load orders.", orders: [] };
        }
      },
    },
  };

  let result;
  try {
    result = await generateText({
      model: google("gemini-2.0-flash"),
      system: systemPrompt,
      messages: messages as any,
      tools,
    });
  } catch (err: any) {
    console.error("[9jaPulse Bot] AI generation failed:", err);
    return "Something went wrong on my end. Please try again in a moment.";
  }

  const newUsage = (subscription.messages_used ?? 0) + 1;
  await (supabase as any)
    .from("bot_subscriptions")
    .update({ messages_used: newUsage })
    .eq("user_id", userId)
    .eq("channel", channel);

  let { data: conversation } = await (supabase as any)
    .from("chat_conversations")
    .select("id")
    .eq("user_id", userId)
    .eq("channel", channel)
    .eq("channel_user_id", userId)
    .single();

  if (!conversation) {
    const { data: created } = await (supabase as any)
      .from("chat_conversations")
      .insert({
        user_id: userId,
        channel,
        channel_user_id: userId,
      })
      .select("id")
      .single();
    conversation = created;
  }

  if (conversation) {
    const lastUser = messages.filter((m) => m.role === "user").pop();
    if (lastUser) {
      await (supabase as any).from("chat_messages").insert({
        conversation_id: conversation.id,
        role: "user",
        content: lastUser.content,
      });
    }
    await (supabase as any).from("chat_messages").insert({
      conversation_id: conversation.id,
      role: "assistant",
      content: result.text,
    });
  }

  return result.text;
}

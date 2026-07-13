import { tool, zodSchema } from "ai";
import { z } from "zod";

export const checkBalance = tool({
  description: "Check the user's 9jaPulse wallet balance. Shows total balance and withdrawable balance.",
  inputSchema: zodSchema(z.object({})),
});

export const buyAirtime = tool({
  description: "Purchase airtime for a phone number on any Nigerian network. Requires the user's transaction PIN.",
  inputSchema: zodSchema(z.object({
    network: z.enum(["mtn", "airtel", "glo", "9mobile"]).describe("Network provider"),
    amount: z.number().min(50).max(50000).describe("Amount in Naira"),
    phone: z.string().min(11).max(14).describe("Recipient phone number"),
    pin: z.string().length(4).describe("User's 4-digit transaction PIN"),
  })),
});

export const buyData = tool({
  description: "Purchase a data plan for a phone number. Use getPlans first to find available plan_value codes.",
  inputSchema: zodSchema(z.object({
    network: z.string().describe("Network provider (e.g. mtn, airtel, glo, 9mobile)"),
    plan: z.string().describe("The plan_value code from getPlans"),
    phone: z.string().min(11).max(14).describe("Recipient phone number"),
    pin: z.string().length(4).describe("User's 4-digit transaction PIN"),
  })),
});

export const getPlans = tool({
  description: "Get available data plans. Can filter by network. Returns plan names, prices, and plan_value codes needed for buyData.",
  inputSchema: zodSchema(z.object({
    network: z.string().optional().describe("Filter by network: mtn, airtel, glo, 9mobile"),
  })),
});

export const searchProducts = tool({
  description: "Search the 9jaPulse marketplace for products by keyword or category.",
  inputSchema: zodSchema(z.object({
    query: z.string().optional().describe("Search keyword to match product titles and descriptions"),
    category: z.string().optional().describe("Filter by product category"),
  })),
});

export const listMyProducts = tool({
  description: "List all products owned by the current seller. Only available to approved sellers.",
  inputSchema: zodSchema(z.object({})),
});

export const addProduct = tool({
  description: "Add a new product to the seller's marketplace store. Only available to approved sellers.",
  inputSchema: zodSchema(z.object({
    title: z.string().min(1).describe("Product title"),
    description: z.string().min(1).describe("Product description"),
    price: z.number().min(100).describe("Price in Naira"),
    category: z.string().min(1).describe("Product category"),
    stock: z.number().min(0).describe("Stock quantity"),
  })),
});

export const getOrders = tool({
  description: "View all incoming orders for the seller's products. Only available to approved sellers.",
  inputSchema: zodSchema(z.object({})),
});

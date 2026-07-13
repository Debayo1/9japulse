import { NextRequest, NextResponse } from "next/server";
import { chat } from "../../../bot/src/ai";
import { createRequestClient } from "../../../src/lib/supabaseServer";

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const { user } = await createRequestClient(req);

    if (!user) {
      return NextResponse.json(
        { error: "Please log in to use the chatbot." },
        { status: 401 }
      );
    }

    const messages: Array<{ role: string; content: string }> = [];

    if (Array.isArray(history)) {
      for (const msg of history.slice(-20)) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    messages.push({ role: "user", content: message });

    const reply = await chat(user.id, messages, "web");

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error("[9jaPulse] Chat API error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

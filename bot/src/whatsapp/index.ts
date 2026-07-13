import { chat } from "../ai";

export async function handleWhatsAppMessage(
  message: any,
  userId: string
): Promise<string> {
  try {
    const text = message.body || message.text || "";
    if (!text) return "";

    const response = await chat(
      userId,
      [{ role: "user", content: text }],
      "whatsapp"
    );

    return formatWhatsAppResponse(response);
  } catch {
    return "Something went wrong. Please try again.";
  }
}

export function formatWhatsAppResponse(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "*$1*")
    .replace(/__(.*?)__/g, "_$1_")
    .replace(/~~(.*?)~~/g, "~$1~")
    .replace(/```([\s\S]*?)```/g, "```\n$1\n```")
    .replace(/^#{1,6}\s+/gm, "*")
    .replace(/^\s*[-*]\s+/gm, "- ")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1: $2");
}

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChatCircleDots, Robot, PaperPlaneRight, User, WhatsappLogo, TelegramLogo } from "@phosphor-icons/react/dist/ssr";
import Header from "@/components/Header";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<"chat" | "channels">("channels");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg: Message = { id: generateId(), role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: messages.slice(-20).map(m => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      const assistantMsg: Message = {
        id: generateId(),
        role: "assistant",
        content: data.reply || data.message || "Something went wrong. Please try again.",
      };
      setMessages([...updated, assistantMsg]);
    } catch {
      setMessages([...updated, { id: generateId(), role: "assistant", content: "Network error. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, messages]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="page" style={{ paddingTop: "5rem" }}>
      <Header title="Help & Support" showBack />

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", marginBottom: "1rem" }}>
        <button
          onClick={() => setActiveTab("channels")}
          style={{
            flex: 1, height: 42, borderRadius: 12, border: "none", cursor: "pointer",
            background: activeTab === "channels" ? "linear-gradient(135deg, #10b981, #14b8a6)" : "var(--bg-surface)",
            color: activeTab === "channels" ? "#fff" : "var(--text-secondary)",
            fontWeight: 700, fontSize: "0.8125rem", transition: "all 0.2s",
          }}
        >
          Contact Us
        </button>
        <button
          onClick={() => setActiveTab("chat")}
          style={{
            flex: 1, height: 42, borderRadius: 12, border: "none", cursor: "pointer",
            background: activeTab === "chat" ? "linear-gradient(135deg, #10b981, #14b8a6)" : "var(--bg-surface)",
            color: activeTab === "chat" ? "#fff" : "var(--text-secondary)",
            fontWeight: 700, fontSize: "0.8125rem", transition: "all 0.2s",
          }}
        >
          Chat with Pulse
        </button>
      </div>

      {activeTab === "channels" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <a
            href="https://wa.me/234XXXXXXXXXX"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", gap: "1rem",
              padding: "1rem 1.25rem", borderRadius: 16,
              background: "var(--bg-surface)", border: "1px solid var(--border)",
              textDecoration: "none", transition: "all 0.2s",
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: "rgba(37, 211, 102, 0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <WhatsappLogo size={26} weight="fill" color="#25D366" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-primary)", margin: 0 }}>
                WhatsApp
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
                Chat with Pulse on WhatsApp
              </p>
            </div>
          </a>

          <a
            href="https://t.me/YourTelegramBot"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", gap: "1rem",
              padding: "1rem 1.25rem", borderRadius: 16,
              background: "var(--bg-surface)", border: "1px solid var(--border)",
              textDecoration: "none", transition: "all 0.2s",
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: "rgba(0, 136, 204, 0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <TelegramLogo size={26} weight="fill" color="#0088CC" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-primary)", margin: 0 }}>
                Telegram
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
                Chat with Pulse on Telegram
              </p>
            </div>
          </a>

          <a
            href="mailto:support@9japulse.app"
            style={{
              display: "flex", alignItems: "center", gap: "1rem",
              padding: "1rem 1.25rem", borderRadius: 16,
              background: "var(--bg-surface)", border: "1px solid var(--border)",
              textDecoration: "none", transition: "all 0.2s",
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: "color-mix(in srgb, var(--color-primary) 12%, transparent)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ChatCircleDots size={26} weight="duotone" color="var(--color-primary)" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-primary)", margin: 0 }}>
                Email Support
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
                support@9japulse.app — reply within 24hrs
              </p>
            </div>
          </a>
        </div>
      )}

      {activeTab === "chat" && (
        <div style={{
          display: "flex", flexDirection: "column",
          background: "var(--bg-surface)", borderRadius: 16,
          border: "1px solid var(--border)", overflow: "hidden",
          height: "calc(100dvh - 12rem)",
        }}>
          <div style={{
            padding: "0.875rem 1rem", borderBottom: "1px solid var(--border)",
            display: "flex", alignItems: "center", gap: "0.625rem",
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: "linear-gradient(135deg, #10b981, #14b8a6)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Robot size={18} weight="fill" color="#fff" />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: "0.8125rem", color: "var(--text-primary)", margin: 0 }}>Pulse Assistant</p>
              <p style={{ fontSize: "0.625rem", color: isTyping ? "#10b981" : "var(--text-muted)", margin: 0 }}>
                {isTyping ? "Typing..." : "Online"}
              </p>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {messages.length === 0 && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "1.5rem" }}>
                <Robot size={32} weight="duotone" color="var(--text-muted)" />
                <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--text-primary)", margin: "0.75rem 0 0.25rem 0" }}>
                  Hi there!
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                  Ask me anything about 9jaPulse services, payments, or your account.
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", gap: "6px" }}>
                {msg.role === "assistant" && (
                  <div style={{
                    width: 26, height: 26, borderRadius: 8, flexShrink: 0, marginTop: 2,
                    background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center",
                    border: "1px solid var(--border)",
                  }}>
                    <Robot size={14} weight="duotone" color="var(--text-secondary)" />
                  </div>
                )}
                <div style={{
                  maxWidth: "78%", padding: "8px 12px", borderRadius: 14, fontSize: "0.8125rem", lineHeight: 1.5,
                  ...(msg.role === "user"
                    ? { background: "linear-gradient(135deg, #10b981, #14b8a6)", color: "#fff", borderBottomRightRadius: 4 }
                    : { background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border)", borderBottomLeftRadius: 4 }),
                }}>
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div style={{
                    width: 26, height: 26, borderRadius: 8, flexShrink: 0, marginTop: 2,
                    background: "linear-gradient(135deg, #10b981, #14b8a6)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <User size={14} weight="fill" color="#fff" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 8,
                  background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center",
                  border: "1px solid var(--border)",
                }}>
                  <Robot size={14} weight="duotone" color="var(--text-secondary)" />
                </div>
                <div style={{
                  padding: "8px 14px", borderRadius: 14,
                  background: "var(--bg-elevated)", border: "1px solid var(--border)",
                  display: "flex", gap: "4px", alignItems: "center",
                }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: "50%", background: "var(--text-muted)",
                      animation: `support-dot 1.2s ease-in-out ${i * 0.15}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div style={{
            padding: "0.625rem 0.75rem", borderTop: "1px solid var(--border)",
            display: "flex", gap: "0.5rem", alignItems: "center",
          }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              style={{
                flex: 1, height: 40, padding: "0 12px", borderRadius: 12,
                border: "1px solid var(--border)", background: "var(--bg-elevated)",
                color: "var(--text-primary)", fontSize: "0.8125rem", outline: "none",
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              style={{
                width: 40, height: 40, borderRadius: 12, border: "none", cursor: input.trim() && !isTyping ? "pointer" : "default",
                background: input.trim() && !isTyping ? "linear-gradient(135deg, #10b981, #14b8a6)" : "var(--bg-elevated)",
                display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s",
              }}
            >
              <PaperPlaneRight size={18} weight="fill" color={input.trim() && !isTyping ? "#fff" : "var(--text-muted)"} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes support-dot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

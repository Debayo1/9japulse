"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  ChatCircle,
  X,
  PaperPlaneRight,
  Robot,
  User,
} from "@phosphor-icons/react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const STORAGE_KEY = "9japulse_chat_messages";
const FREE_LIMIT = 20;

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function loadMessages(): Message[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMessages(msgs: Message[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-100)));
  } catch {}
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hitLimit, setHitLimit] = useState(false);
  const [msgCount, setMsgCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = loadMessages();
    setMessages(saved);
    setMsgCount(saved.filter((m) => m.role === "user").length);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    if (msgCount >= FREE_LIMIT) {
      setHitLimit(true);
      return;
    }

    const userMsg: Message = {
      id: generateId(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    saveMessages(updated);
    setInput("");
    setIsTyping(true);
    setMsgCount((c) => c + 1);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();

      if (res.status === 429 || data.limitReached) {
        setHitLimit(true);
        const limitMsg: Message = {
          id: generateId(),
          role: "assistant",
          content: "You've reached the free daily message limit. Upgrade to continue chatting!",
          timestamp: Date.now(),
        };
        const afterLimit = [...updated, limitMsg];
        setMessages(afterLimit);
        saveMessages(afterLimit);
      } else {
        const assistantMsg: Message = {
          id: generateId(),
          role: "assistant",
          content: data.reply || data.message || "I couldn't process that. Please try again.",
          timestamp: Date.now(),
        };
        const afterReply = [...updated, assistantMsg];
        setMessages(afterReply);
        saveMessages(afterReply);
      }
    } catch {
      const errMsg: Message = {
        id: generateId(),
        role: "assistant",
        content: "Network error. Please check your connection and try again.",
        timestamp: Date.now(),
      };
      const afterErr = [...updated, errMsg];
      setMessages(afterErr);
      saveMessages(afterErr);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, messages, msgCount]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          e.preventDefault();
          toast.error("Image pasting is not supported. Please send text only.");
          return;
        }
      }
    }
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open chat"
          style={{
            position: "fixed",
            bottom: 88,
            right: 20,
            zIndex: 150,
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #10b981, #14b8a6)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 20px rgba(16,185,129,0.4)",
            transition: "transform 0.2s var(--ease-spring), box-shadow 0.2s",
            animation: "chat-pulse 2s ease-in-out infinite",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.08)";
            e.currentTarget.style.boxShadow = "0 6px 28px rgba(16,185,129,0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 4px 20px rgba(16,185,129,0.4)";
          }}
        >
          <ChatCircle size={26} weight="fill" color="#fff" />
        </button>
      )}

      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: 88,
            right: 20,
            zIndex: 200,
            width: 350,
            maxWidth: "calc(100vw - 40px)",
            height: 500,
            maxHeight: "calc(100vh - 160px)",
            borderRadius: 20,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
            animation: "chat-slide-up 0.25s var(--ease-smooth)",
          }}
        >
          <div style={{
            padding: "14px 16px",
            background: "linear-gradient(135deg, #10b981, #14b8a6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: "rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Robot size={18} weight="fill" color="#fff" />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "#fff", margin: 0 }}>Chat with Pulse</p>
                <p style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.75)", margin: "1px 0 0 0" }}>
                  {isTyping ? "Typing..." : "Online"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                width: 30, height: 30, borderRadius: 8,
                background: "rgba(255,255,255,0.2)", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#fff",
              }}
            >
              <X size={16} weight="bold" />
            </button>
          </div>

          <div style={{
            flex: 1, overflowY: "auto", padding: "12px",
            display: "flex", flexDirection: "column", gap: "8px",
            scrollbarWidth: "none",
          }}>
            {messages.length === 0 && (
              <div style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                textAlign: "center", padding: "1.5rem",
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: "color-mix(in srgb, #10b981 12%, transparent)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: "0.75rem",
                }}>
                  <Robot size={24} weight="duotone" color="#10b981" />
                </div>
                <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--text-primary)", margin: "0 0 4px 0" }}>
                  Hi there! 👋
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                  I&apos;m Pulse, your assistant. Ask me anything about 9jaPulse services, payments, or account help.
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  gap: "6px",
                  animation: "fade-in 0.15s ease",
                }}
              >
                {msg.role === "assistant" && (
                  <div style={{
                    width: 26, height: 26, borderRadius: 8, flexShrink: 0, marginTop: 2,
                    background: "var(--bg-surface)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: "1px solid var(--border)",
                  }}>
                    <Robot size={14} weight="duotone" color="var(--text-secondary)" />
                  </div>
                )}
                <div style={{
                  maxWidth: "75%", padding: "8px 12px", borderRadius: 14,
                  fontSize: "0.8125rem", lineHeight: 1.5,
                  ...(msg.role === "user"
                    ? {
                        background: "linear-gradient(135deg, #10b981, #14b8a6)",
                        color: "#fff",
                        borderBottomRightRadius: 4,
                      }
                    : {
                        background: "var(--bg-surface)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border)",
                        borderBottomLeftRadius: 4,
                      }),
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
                  background: "var(--bg-surface)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "1px solid var(--border)",
                }}>
                  <Robot size={14} weight="duotone" color="var(--text-secondary)" />
                </div>
                <div style={{
                  padding: "8px 14px", borderRadius: 14,
                  background: "var(--bg-surface)", border: "1px solid var(--border)",
                  display: "flex", gap: "4px", alignItems: "center",
                }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: "var(--text-muted)",
                      animation: `chat-dot 1.2s ease-in-out ${i * 0.15}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {hitLimit && (
            <div style={{
              padding: "10px 14px",
              background: "hsl(38 92% 50% / 0.08)",
              borderTop: "1px solid hsl(38 92% 50% / 0.2)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexShrink: 0,
            }}>
              <p style={{ fontSize: "0.6875rem", color: "var(--color-warning)", margin: 0, fontWeight: 600 }}>
                Free limit reached
              </p>
              <button
                style={{
                  padding: "4px 10px", borderRadius: 8, fontSize: "0.625rem",
                  fontWeight: 700, border: "none",
                  background: "linear-gradient(135deg, #10b981, #14b8a6)",
                  color: "#fff", cursor: "pointer",
                }}
              >
                Upgrade
              </button>
            </div>
          )}

          <div style={{
            padding: "10px 12px",
            borderTop: "1px solid var(--border)",
            display: "flex", gap: "8px", alignItems: "center",
            flexShrink: 0,
          }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={hitLimit ? "Upgrade to continue..." : "Type a message..."}
              disabled={hitLimit}
              style={{
                flex: 1, height: 40, padding: "0 12px",
                borderRadius: 12, border: "1px solid var(--border)",
                background: "var(--bg-surface)", color: "var(--text-primary)",
                fontSize: "0.8125rem", outline: "none",
                opacity: hitLimit ? 0.5 : 1,
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping || hitLimit}
              style={{
                width: 40, height: 40, borderRadius: 12,
                background: input.trim() && !isTyping && !hitLimit
                  ? "linear-gradient(135deg, #10b981, #14b8a6)"
                  : "var(--bg-surface)",
                border: "none", cursor: input.trim() && !isTyping && !hitLimit ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.2s",
              }}
            >
              <PaperPlaneRight
                size={18}
                weight="fill"
                color={input.trim() && !isTyping && !hitLimit ? "#fff" : "var(--text-muted)"}
              />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes chat-pulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(16,185,129,0.4); }
          50% { box-shadow: 0 4px 28px rgba(16,185,129,0.6); }
        }
        @keyframes chat-slide-up {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes chat-dot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
}

"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { Send, Sparkles, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api, readSSEStream } from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "oracle";
  text: string;
  timestamp: number;
}

const STORAGE_KEY = "oracle-widget-messages";

function safeGetLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function loadMessages(): Message[] {
  const storage = safeGetLocalStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (m: unknown): m is Message =>
          typeof m === "object" &&
          m !== null &&
          typeof (m as Message).id === "string" &&
          typeof (m as Message).text === "string" &&
          ((m as Message).role === "user" || (m as Message).role === "oracle") &&
          typeof (m as Message).timestamp === "number",
      )
      .map((m) => ({
        id: m.id,
        role: m.role,
        text: m.text,
        timestamp: m.timestamp,
      }));
  } catch {
    return [];
  }
}

function persistMessages(messages: Message[]): void {
  const storage = safeGetLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    /* ignore */
  }
}

function clearMessages(): void {
  const storage = safeGetLocalStorage();
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

let nextId = 0;
function msgId(): string {
  return `msg-${Date.now()}-${++nextId}`;
}

export default function OracleWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [imgError, setImgError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelTitleId = useId();
  const hydratedRef = useRef(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const persisted = loadMessages();
    if (persisted.length > 0) {
      setMessages(persisted);
    }
  }, []);

  // Persist on change
  useEffect(() => {
    if (!hydratedRef.current) return;
    persistMessages(messages);
  }, [messages]);

  // Clear on logout
  useEffect(() => {
    if (!hydratedRef.current) return;
    if (!user) {
      clearMessages();
      setMessages([]);
    }
  }, [user]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input on open; return focus on close
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else if (document.activeElement instanceof HTMLElement && triggerRef.current) {
      triggerRef.current.focus({ preventScroll: true });
    }
  }, [isOpen]);

  // Escape closes
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  // Cmd+K toggle
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.metaKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: msgId(),
      role: "user",
      text,
      timestamp: Date.now(),
    };

    setInput("");
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const history = [...messages, userMsg].slice(-20).map((m) => ({
        role: m.role,
        content: m.text,
      }));

      const stream = await api.oracle.chatStream({ messages: history });
      const oracleMsgId = msgId();

      setMessages((prev) => [
        ...prev,
        {
          id: oracleMsgId,
          role: "oracle",
          text: "",
          timestamp: Date.now(),
        },
      ]);

      for await (const delta of readSSEStream(stream)) {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.id === oracleMsgId) {
            return [...prev.slice(0, -1), { ...last, text: last.text + delta }];
          }
          return prev;
        });
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: msgId(),
          role: "oracle",
          text: "I'm having trouble connecting right now. Try again in a moment.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  if (!user) return null;

  const visibleMessages = messages.slice(-5);

  return (
    <>
      {/* Collapsed trigger */}
      {!isOpen && (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen(true)}
          aria-expanded={false}
          aria-haspopup="dialog"
          aria-controls={panelTitleId}
          aria-label={hasUnread ? "Open Oracle assistant (new activity)" : "Open Oracle assistant"}
          className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-atlas-teal to-teal-600 text-white shadow-lg shadow-atlas-teal/30 transition-transform hover:scale-105 active:scale-95"
        >
          {imgError ? (
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Image
              src="/images/oracle-avatar.png"
              alt=""
              width={28}
              height={28}
              className="rounded-full"
              onError={() => setImgError(true)}
            />
          )}
          {hasUnread && (
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-atlas-error border-2 border-atlas-nav" />
          )}
        </button>
      )}

      {/* Expanded panel */}
      {isOpen && (
        <div
          id={panelTitleId}
          role="dialog"
          aria-modal="false"
          aria-labelledby={`${panelTitleId}-heading`}
          className="fixed bottom-6 right-6 z-50 flex w-80 max-h-[420px] flex-col rounded-2xl border border-glass-border bg-atlas-nav shadow-2xl shadow-black/40 animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-glass-border px-4 py-3">
            <div className="relative h-8 w-8 shrink-0">
              {imgError ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-atlas-surface text-atlas-teal text-sm font-bold">O</div>
              ) : (
                <Image
                  src="/images/oracle-avatar.png"
                  alt=""
                  width={32}
                  height={32}
                  className="rounded-full"
                  onError={() => setImgError(true)}
                />
              )}
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-atlas-nav bg-atlas-teal" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p id={`${panelTitleId}-heading`} className="text-sm font-medium text-atlas-text">Oracle</p>
              <p className="text-[10px] text-atlas-text-muted">Ask me anything</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-atlas-text-muted hover:text-atlas-text"
              aria-label="Close Oracle"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Messages */}
          <div
            role="log"
            aria-live="polite"
            aria-relevant="additions text"
            aria-label="Oracle conversation"
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[160px] max-h-[260px]"
          >
            {visibleMessages.length === 0 && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed bg-atlas-surface text-atlas-text-secondary">
                  Need help? Ask me anything about Atlas.
                </div>
              </div>
            )}

            {visibleMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-atlas-teal/20 text-atlas-text"
                      : "bg-atlas-surface text-atlas-text-secondary"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm bg-atlas-surface text-atlas-text-muted">
                  <span className="inline-flex gap-1">
                    <span className="animate-oracle-dot">·</span>
                    <span className="animate-oracle-dot" style={{ animationDelay: "0.2s" }}>·</span>
                    <span className="animate-oracle-dot" style={{ animationDelay: "0.4s" }}>·</span>
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-glass-border px-4 py-3">
            <label htmlFor={`${panelTitleId}-input`} className="sr-only">
              Ask Oracle
            </label>
            <input
              id={`${panelTitleId}-input`}
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              placeholder="Ask Oracle..."
              aria-label="Ask Oracle"
              className="flex-1 bg-transparent text-sm text-atlas-text placeholder:text-atlas-text-muted outline-none"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="text-atlas-teal disabled:text-atlas-text-muted disabled:opacity-40"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

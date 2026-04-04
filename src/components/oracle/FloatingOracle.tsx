"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { X, Send, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface NudgeMessage {
  text: string;
  action?: { label: string; href: string };
}

function getNudge(pathname: string, stats: { draftsCreated?: number; draftsPosted?: number }): NudgeMessage {
  const drafted = stats.draftsCreated ?? 0;
  const posted = stats.draftsPosted ?? 0;

  if (pathname === "/dashboard") {
    if (drafted > 0 && posted === 0) {
      return {
        text: `You've crafted ${drafted} drafts but haven't posted any yet. Ready to ship one?`,
        action: { label: "Go to Crafting", href: "/crafting" },
      };
    }
    return {
      text: "Welcome back. What would you like to work on today?",
    };
  }
  if (pathname === "/crafting") {
    return { text: "Drop an article or hot take above. I'll help you turn it into a thread." };
  }
  if (pathname === "/voice-profiles") {
    return { text: "Your voice dimensions shape how Atlas writes for you. Tweak them until it feels right." };
  }
  if (pathname === "/analytics") {
    return { text: "Track what's working. Your best posts share a pattern \u2014 can you spot it?" };
  }
  if (pathname === "/alerts" || pathname === "/alerts/") {
    return { text: "Signals are live topics worth posting about. Pick one and draft a take." };
  }
  if (pathname === "/arena") {
    return { text: "The Arena ranks analysts by output, engagement, and consistency. Climb the board." };
  }
  if (pathname === "/team-library") {
    return { text: "These are approved team styles. Use one as a starting point for your next draft." };
  }
  if (pathname === "/telegram") {
    return { text: "Link Telegram to get alerts pushed to your phone. It takes 30 seconds." };
  }
  return { text: "Need help? Ask me anything about Atlas." };
}

const QUICK_ACTIONS = [
  { label: "Draft a tweet", href: "/crafting" },
  { label: "Check analytics", href: "/analytics" },
  { label: "View signals", href: "/alerts" },
  { label: "Tune my voice", href: "/voice-profiles" },
];

interface ChatMessage {
  id: string;
  role: "oracle" | "user";
  text: string;
  action?: { label: string; href: string };
}

export default function FloatingOracle() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [imgError, setImgError] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate contextual nudge when page changes
  useEffect(() => {
    const nudge = getNudge(pathname, {});
    setMessages([
      {
        id: `nudge-${pathname}`,
        role: "oracle",
        text: nudge.text,
        action: nudge.action,
      },
    ]);
    if (!isOpen) setHasUnread(true);
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleCommand = useCallback(
    (text: string) => {
      const lower = text.toLowerCase().trim();

      // Navigation commands
      const navMap: Record<string, string> = {
        dashboard: "/dashboard",
        crafting: "/crafting",
        "draft a tweet": "/crafting",
        analytics: "/analytics",
        voice: "/voice-profiles",
        "voice profiles": "/voice-profiles",
        alerts: "/alerts",
        signals: "/alerts",
        arena: "/arena",
        leaderboard: "/arena",
        library: "/team-library",
        telegram: "/telegram",
        briefing: "/briefing",
        search: "/search",
        admin: "/admin/qa",
        qa: "/admin/qa",
        testing: "/admin/qa",
        onboarding: "/onboarding",
      };

      for (const [key, href] of Object.entries(navMap)) {
        if (lower.includes(key)) {
          setMessages((prev) => [
            ...prev,
            {
              id: `nav-${Date.now()}`,
              role: "oracle",
              text: `Taking you to ${key}.`,
              action: { label: `Go to ${key}`, href },
            },
          ]);
          setTimeout(() => router.push(href), 600);
          return;
        }
      }

      // Keyword-based smart responses
      const smartResponses: { pattern: RegExp; text: string; action?: { label: string; href: string } }[] = [
        { pattern: /help|what can you do|commands/, text: "Here's what I can do:\n\n• Navigate anywhere — \"take me to crafting\"\n• Quick actions — \"draft a tweet\", \"check analytics\"\n• Toggle demo mode — \"demo mode\"\n• Show signals — \"what's trending\"\n• Team info — \"show leaderboard\"\n\nOr just tell me what you need!" },
        { pattern: /engag|metrics|performance|how.*(doing|going)/, text: "Check your engagement trends and prediction accuracy in Analytics. Your voice dimensions directly impact how well drafts land.", action: { label: "View Analytics", href: "/analytics" } },
        { pattern: /draft|write|tweet|post|compose/, text: "Head to the Crafting Station to draft a new post. Drop in an article, report, or hot take and Atlas will match your voice.", action: { label: "Start Drafting", href: "/crafting" } },
        { pattern: /team|who|people|colleague/, text: "The Arena shows your team's rankings, output, and engagement scores. See who's leading and where you stand.", action: { label: "View Arena", href: "/arena" } },
        { pattern: /trend|hot|market|what.*happening/, text: "The Signals feed shows live market moves, competitor mentions, and trending topics you should post about.", action: { label: "View Signals", href: "/alerts" } },
        { pattern: /voice|tone|style|blend/, text: "Your voice profile controls how Atlas writes for you. Adjust humor, formality, brevity, and contrarian tone to match your style.", action: { label: "Edit Voice", href: "/voice-profiles" } },
        { pattern: /demo|mock|sample|test data/, text: "Toggling demo mode fills every page with realistic sample data. Use Cmd+K and search \"demo\" to toggle it.", action: { label: "Toggle via Cmd+K", href: "#" } },
        { pattern: /telegram|bot|notif/, text: "Link your Telegram to get alerts pushed to your phone. It takes 30 seconds — just message @AtlasDelphiBot.", action: { label: "Setup Guide", href: "/telegram" } },
      ];

      for (const { pattern, text, action } of smartResponses) {
        if (pattern.test(lower)) {
          setMessages((prev) => [
            ...prev,
            { id: `smart-${Date.now()}`, role: "oracle", text, action },
          ]);
          return;
        }
      }

      // Fallback
      setMessages((prev) => [
        ...prev,
        {
          id: `reply-${Date.now()}`,
          role: "oracle",
          text: "I'm not sure about that yet, but I can help you navigate Atlas, draft tweets, check analytics, or tune your voice. Type \"help\" to see everything I can do.",
        },
      ]);
    },
    [router],
  );

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;

    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: "user", text },
    ]);
    setInput("");
    setTimeout(() => handleCommand(text), 400);
  }, [input, handleCommand]);

  if (!user) return null;

  return (
    <>
      {/* Floating bubble */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-atlas-nav border-2 border-atlas-teal/40 shadow-lg shadow-atlas-teal/20 transition-transform hover:scale-105 active:scale-95"
          aria-label="Open Oracle assistant"
        >
          {imgError ? (
            <Sparkles className="h-6 w-6 text-atlas-teal" />
          ) : (
            <Image
              src="/images/oracle-avatar.png"
              alt="The Oracle"
              width={40}
              height={40}
              className="rounded-full"
              onError={() => setImgError(true)}
            />
          )}
          {hasUnread && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-atlas-teal border-2 border-atlas-nav" />
          )}
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex w-[360px] max-h-[520px] flex-col rounded-2xl border border-glass-border bg-atlas-nav shadow-2xl shadow-black/40">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-glass-border px-4 py-3">
            <div className="relative h-8 w-8 shrink-0">
              {imgError ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-atlas-surface text-atlas-teal text-sm font-bold">
                  O
                </div>
              ) : (
                <Image
                  src="/images/oracle-avatar.png"
                  alt="The Oracle"
                  width={32}
                  height={32}
                  className="rounded-full"
                  onError={() => setImgError(true)}
                />
              )}
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-atlas-nav bg-atlas-teal" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-atlas-text">The Oracle</p>
              <p className="text-[10px] text-atlas-text-muted">Your Atlas guide</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-atlas-text-muted hover:text-atlas-text"
              aria-label="Close Oracle"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px] max-h-[340px]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-atlas-teal/20 text-atlas-text"
                      : "bg-atlas-surface text-atlas-text-secondary"
                  }`}
                >
                  {msg.text}
                  {msg.action && (
                    <button
                      type="button"
                      onClick={() => router.push(msg.action!.href)}
                      className="mt-1.5 block text-xs font-medium text-atlas-teal hover:underline"
                    >
                      {msg.action.label} &rarr;
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick actions */}
          <div className="flex gap-1.5 overflow-x-auto px-4 py-2 border-t border-glass-border/50">
            {QUICK_ACTIONS.map((qa) => (
              <button
                key={qa.label}
                type="button"
                onClick={() => router.push(qa.href)}
                className="shrink-0 rounded-full border border-glass-border px-3 py-1 text-[11px] text-atlas-text-secondary hover:border-atlas-teal/40 hover:text-atlas-teal transition-colors"
              >
                {qa.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-glass-border px-4 py-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              placeholder="Ask Oracle anything..."
              className="flex-1 bg-transparent text-sm text-atlas-text placeholder:text-atlas-text-muted outline-none"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim()}
              className="text-atlas-teal disabled:text-atlas-text-muted disabled:opacity-40"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useState, useRef, useEffect, useCallback, useId } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { X, Send, Sparkles, Check, XCircle, Minus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useOracleAgent } from "@/lib/oracle-agent";
import { useOracleUI } from "@/lib/oracle-ui";

interface NudgeMessage {
  text: string;
}

function getNudge(pathname: string): NudgeMessage {
  if (pathname === "/dashboard") return { text: "Welcome back. What would you like to work on today?" };
  if (pathname === "/crafting") return { text: "Drop an article or hot take above. I’ll help you turn it into a thread." };
  if (pathname === "/voice-profiles") return { text: "Your voice dimensions shape how Atlas writes for you. Tweak them until it feels right." };
  if (pathname === "/analytics") return { text: "Track what’s working. Your best posts share a pattern — can you spot it?" };
  if (pathname === "/alerts") return { text: "Signals are live topics worth posting about. Pick one and draft a take." };
  if (pathname === "/arena") return { text: "The Arena ranks analysts by output, engagement, and consistency. Climb the board." };
  if (pathname === "/team-library") return { text: "These are approved team styles. Use one as a starting point for your next draft." };
  if (pathname === "/telegram") return { text: "Link Telegram to get alerts pushed to your phone. It takes 30 seconds." };
  return { text: "Need help? Ask me anything about Atlas." };
}

const QUICK_ACTIONS = [
  { label: "Draft a tweet", prompt: "Draft a tweet for me" },
  { label: "Check analytics", prompt: "Show me my analytics" },
  { label: "View signals", prompt: "What’s trending right now?" },
  { label: "Tune my voice", prompt: "Show me my voice profile" },
];

export default function FloatingOracle() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { messages: agentMessages, isThinking, pendingActions, send, confirmAction, rejectAction } = useOracleAgent();
  const { view, open, minimize, close } = useOracleUI();

  const [input, setInput] = useState("");
  const [imgError, setImgError] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [nudge, setNudge] = useState<NudgeMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelTitleId = useId();

  // Contextual nudge on page change
  useEffect(() => {
    setNudge(getNudge(pathname));
    if (view !== "open") setHasUnread(true);
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [agentMessages, pendingActions]);

  // Focus input on open; return focus to trigger on minimize
  useEffect(() => {
    if (view === "open") {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else if (view === "minimized") {
      if (document.activeElement instanceof HTMLElement && triggerRef.current) {
        triggerRef.current.focus({ preventScroll: true });
      }
    }
  }, [view]);

  // Escape minimizes the panel when open
  useEffect(() => {
    if (view !== "open") return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        minimize();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [view, minimize]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isThinking) return;
    setInput("");
    send(text);
  }, [input, isThinking, send]);

  const handleQuickAction = useCallback(
    (prompt: string) => {
      send(prompt);
    },
    [send],
  );

  if (!user || view === "closed") return null;

  return (
    <>
      <style jsx global>{`
        @keyframes subtle-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>

      {/* Floating bubble */}
      {view !== "open" && (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => {
            open();
            try { localStorage.setItem("atlas_discovered_oracle", "1"); } catch {}
          }}
          data-tour="oracle-widget"
          aria-expanded={false}
          aria-haspopup="dialog"
          aria-controls={panelTitleId}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-atlas-nav border-2 border-atlas-teal/40 shadow-lg shadow-atlas-teal/20 transition-transform hover:scale-105 active:scale-95 animate-[subtle-bounce_3s_ease-in-out_infinite_2s]"
          aria-label={hasUnread ? "Open Oracle assistant (new activity)" : "Open Oracle assistant"}
        >
          {imgError ? (
            <Sparkles className="h-6 w-6 text-atlas-teal" aria-hidden="true" />
          ) : (
            <Image
              src="/images/oracle-avatar.png"
              alt=""
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
      {view === "open" && (
        <div
          id={panelTitleId}
          role="dialog"
          aria-modal="false"
          aria-labelledby={`${panelTitleId}-heading`}
          className="fixed bottom-6 right-6 z-50 flex w-[calc(100vw-2rem)] max-w-[360px] max-h-[520px] flex-col rounded-2xl border border-glass-border bg-atlas-nav shadow-2xl shadow-black/40"
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-glass-border px-4 py-3">
            <div className="relative h-8 w-8 shrink-0">
              {imgError ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-atlas-surface text-atlas-teal text-sm font-bold">O</div>
              ) : (
                <Image src="/images/oracle-avatar.png" alt="" width={32} height={32} className="rounded-full" onError={() => setImgError(true)} />
              )}
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-atlas-nav bg-atlas-teal" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p id={`${panelTitleId}-heading`} className="text-sm font-medium text-atlas-text">The Oracle</p>
              <p className="text-[10px] text-atlas-text-muted">Your Atlas copilot</p>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={minimize} className="p-1 text-atlas-text-muted hover:text-atlas-text" aria-label="Minimize Oracle">
                <Minus className="h-4 w-4" aria-hidden="true" />
              </button>
              <button type="button" onClick={close} className="p-1 text-atlas-text-muted hover:text-atlas-text" aria-label="Close Oracle">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Messages — aria-live so screen readers announce Oracle replies as they arrive */}
          <div
            role="log"
            aria-live="polite"
            aria-relevant="additions text"
            aria-label="Oracle conversation"
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px] max-h-[340px]"
          >
            {/* Contextual nudge (always first) */}
            {nudge && agentMessages.length === 0 && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed bg-atlas-surface text-atlas-text-secondary">
                  {nudge.text}
                </div>
              </div>
            )}

            {/* Agent messages */}
            {agentMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-atlas-teal/20 text-atlas-text"
                    : msg.actionResults
                      ? "bg-atlas-teal/5 border border-atlas-teal/20 text-atlas-text-secondary"
                      : "bg-atlas-surface text-atlas-text-secondary"
                }`}>
                  {msg.text}
                  {/* Show action labels as chips */}
                  {msg.actions && msg.actions.length > 0 && !msg.actionResults && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {msg.actions.map((a) => (
                        <span key={a.id} className="inline-flex items-center gap-1 rounded-full bg-atlas-teal/10 px-2 py-0.5 text-[10px] font-medium text-atlas-teal">
                          {a.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Pending confirmation actions */}
            {pendingActions.length > 0 && (
              <div className="space-y-2">
                {pendingActions.map((action) => (
                  <div key={action.id} className="rounded-xl border border-atlas-warning/30 bg-atlas-warning/5 px-3.5 py-2.5">
                    <p className="text-xs font-medium text-atlas-warning mb-2">Confirm: {action.label}</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => confirmAction(action.id)}
                        className="flex items-center gap-1 rounded-lg bg-atlas-teal/20 px-3 py-1.5 text-xs font-medium text-atlas-teal hover:bg-atlas-teal/30"
                      >
                        <Check className="h-3 w-3" aria-hidden="true" /> Yes, do it
                      </button>
                      <button
                        type="button"
                        onClick={() => rejectAction(action.id)}
                        className="flex items-center gap-1 rounded-lg bg-atlas-surface px-3 py-1.5 text-xs text-atlas-text-muted hover:text-atlas-text"
                      >
                        <XCircle className="h-3 w-3" aria-hidden="true" /> Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Thinking indicator */}
            {isThinking && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm bg-atlas-surface text-atlas-text-muted">
                  <span className="inline-flex gap-1">
                    <span className="animate-pulse">·</span>
                    <span className="animate-pulse" style={{animationDelay: "0.2s"}}>·</span>
                    <span className="animate-pulse" style={{animationDelay: "0.4s"}}>·</span>
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick actions */}
          <div
            role="group"
            aria-label="Oracle quick actions"
            className="flex gap-1.5 overflow-x-auto px-4 py-2 border-t border-glass-border/50"
          >
            {QUICK_ACTIONS.map((qa) => (
              <button
                key={qa.label}
                type="button"
                onClick={() => handleQuickAction(qa.prompt)}
                className="shrink-0 rounded-full border border-glass-border px-3 py-1 text-[11px] text-atlas-text-secondary hover:border-atlas-teal/40 hover:text-atlas-teal transition-colors"
              >
                {qa.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-glass-border px-4 py-3">
            <label htmlFor={`${panelTitleId}-input`} className="sr-only">
              Ask Oracle anything
            </label>
            <input
              id={`${panelTitleId}-input`}
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
              placeholder="Ask Oracle anything..."
              aria-label="Ask Oracle anything"
              className="flex-1 bg-transparent text-sm text-atlas-text placeholder:text-atlas-text-muted outline-none"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || isThinking}
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

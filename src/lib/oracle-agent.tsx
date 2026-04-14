"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { executeAction, summarizeResult } from "@/lib/oracle-action-executor";
import type {
  AgentChatMessage,
  InspectableEntity,
  OracleAgentAction,
  OracleActionResult,
} from "@/lib/oracle-agent-types";
import { synthesizeInspectorNarration } from "@/lib/oracle-narration";

interface OracleAgentContextValue {
  messages: AgentChatMessage[];
  isThinking: boolean;
  pendingActions: OracleAgentAction[];
  send: (text: string) => Promise<void>;
  confirmAction: (actionId: string) => Promise<void>;
  rejectAction: (actionId: string) => void;
  reset: () => void;
  /**
   * Fire-and-forget ambient narration. Oracle observes an entity the
   * user just touched and emits a single thinking-style line without
   * waiting for a backend round-trip. The synthesized text is returned
   * synchronously so inline UI (OracleInspector) can render it
   * immediately; the same line is also appended to the transcript as
   * an `ambient` message so the floating widget stays in sync.
   */
  narrate: (tag: "inspect" | "observe", entity: InspectableEntity) => string;
}

const OracleAgentContext = createContext<OracleAgentContextValue>({
  messages: [],
  isThinking: false,
  pendingActions: [],
  send: async () => {},
  confirmAction: async () => {},
  rejectAction: () => {},
  reset: () => {},
  narrate: () => "",
});

export function useOracleAgent() {
  return useContext(OracleAgentContext);
}

let nextId = 0;
function msgId() {
  return `msg-${Date.now()}-${++nextId}`;
}

// ── Persistent session storage ───────────────────────────────────
// The backend /api/oracle/agent endpoint is currently stateless, so we
// persist conversation history in localStorage so the floating widget
// survives page reloads. The sessionId is forwarded to the backend on
// every call so the server can start persisting per-session state
// without a frontend change later.

const STORAGE_KEY_MESSAGES = "atlas_oracle_messages";
const STORAGE_KEY_SESSION = "atlas_oracle_session_id";
// Keep the transcript bounded — we only need enough context for the
// user to recognise the thread, and the agent itself slices to the
// last 20 messages when it calls the backend.
const MAX_PERSISTED_MESSAGES = 50;

function generateSessionId(): string {
  // Avoid crypto.randomUUID typings inside SSR — fall back to Date+random.
  if (
    typeof globalThis !== "undefined" &&
    typeof (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
      ?.randomUUID === "function"
  ) {
    try {
      return (
        globalThis as { crypto: { randomUUID: () => string } }
      ).crypto.randomUUID();
    } catch {
      /* fall through */
    }
  }
  return `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function safeGetLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function loadPersistedMessages(): AgentChatMessage[] {
  const storage = safeGetLocalStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(STORAGE_KEY_MESSAGES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Shape-check each entry defensively — localStorage is untrusted.
    return parsed
      .filter(
        (m: unknown): m is AgentChatMessage =>
          typeof m === "object" &&
          m !== null &&
          typeof (m as AgentChatMessage).id === "string" &&
          typeof (m as AgentChatMessage).text === "string" &&
          ((m as AgentChatMessage).role === "user" ||
            (m as AgentChatMessage).role === "oracle") &&
          typeof (m as AgentChatMessage).timestamp === "number",
      )
      // Strip any stale pending actions — confirmation flow cannot
      // resume across reloads, so we only keep the textual record.
      .map((m) => ({
        id: m.id,
        role: m.role,
        text: m.text,
        timestamp: m.timestamp,
        actionResults: m.actionResults,
      }));
  } catch {
    return [];
  }
}

function persistMessages(messages: AgentChatMessage[]): void {
  const storage = safeGetLocalStorage();
  if (!storage) return;
  try {
    const trimmed = messages.slice(-MAX_PERSISTED_MESSAGES);
    storage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(trimmed));
  } catch {
    /* quota or serialization error — silently skip persistence */
  }
}

function loadOrCreateSessionId(): string {
  const storage = safeGetLocalStorage();
  if (!storage) return generateSessionId();
  try {
    const existing = storage.getItem(STORAGE_KEY_SESSION);
    if (existing && existing.length > 0) return existing;
    const fresh = generateSessionId();
    storage.setItem(STORAGE_KEY_SESSION, fresh);
    return fresh;
  } catch {
    return generateSessionId();
  }
}

function clearPersistedSession(): void {
  const storage = safeGetLocalStorage();
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY_MESSAGES);
    storage.removeItem(STORAGE_KEY_SESSION);
  } catch {
    /* ignore */
  }
}

export function OracleAgentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [messages, setMessages] = useState<AgentChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [pendingActions, setPendingActions] = useState<OracleAgentAction[]>([]);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const sessionIdRef = useRef<string | null>(null);
  const hydratedRef = useRef(false);

  // Hydrate from localStorage on mount. Any failure silently falls back
  // to a fresh session so the widget is never blocked on startup.
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    sessionIdRef.current = loadOrCreateSessionId();
    const persisted = loadPersistedMessages();
    if (persisted.length > 0) {
      setMessages(persisted);
    }
  }, []);

  // Persist messages on every change so a reload loses at most one tick.
  useEffect(() => {
    if (!hydratedRef.current) return;
    persistMessages(messages);
  }, [messages]);

  const executeActions = useCallback(
    async (actions: OracleAgentAction[]): Promise<OracleActionResult[]> => {
      const results: OracleActionResult[] = [];
      for (const action of actions) {
        const result = await executeAction(action, { router });
        results.push(result);

        // Add a status message for each executed action
        const summary = summarizeResult(action, result);
        setMessages((prev) => [
          ...prev,
          {
            id: msgId(),
            role: "oracle" as const,
            text: summary,
            actionResults: [result],
            timestamp: Date.now(),
          },
        ]);
      }
      return results;
    },
    [router],
  );

  const send = useCallback(
    async (text: string) => {
      const userMsg: AgentChatMessage = {
        id: msgId(),
        role: "user",
        text,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsThinking(true);

      try {
        const history = [...messagesRef.current, userMsg]
          .slice(-20)
          .map((m) => ({ role: m.role, content: m.text }));

        const res = await api.oracle.agent({
          messages: history,
          page: pathname,
          sessionId: sessionIdRef.current ?? undefined,
        });

        const oracleActions = (res.actions ?? []) as OracleAgentAction[];

        if (res.text) {
          setMessages((prev) => [
            ...prev,
            {
              id: msgId(),
              role: "oracle",
              text: res.text,
              actions: oracleActions.length > 0 ? oracleActions : undefined,
              timestamp: Date.now(),
            },
          ]);
        }

        const needsConfirm = oracleActions.filter((a) => a.requiresConfirmation);
        const autoExec = oracleActions.filter((a) => !a.requiresConfirmation);

        if (needsConfirm.length > 0) {
          setPendingActions(needsConfirm);
        }

        if (autoExec.length > 0) {
          const results = await executeActions(autoExec);

          if (results.some((r) => r.data)) {
            const continuationHistory = [
              ...history,
              { role: "oracle" as const, content: res.text || "" },
              {
                role: "user" as const,
                content: `[Action results: ${results.map((r) => `${r.type}=${r.success ? "ok" : "fail"}`).join(", ")}]`,
              },
            ];

            try {
              const continuation = await api.oracle.agent({
                messages: continuationHistory,
                page: pathname,
                sessionId: sessionIdRef.current ?? undefined,
                actionResults: results.map((r) => ({
                  actionId: r.actionId,
                  type: r.type,
                  success: r.success,
                  data: r.data,
                  error: r.error,
                })),
              });

              if (continuation.text) {
                setMessages((prev) => [
                  ...prev,
                  {
                    id: msgId(),
                    role: "oracle",
                    text: continuation.text,
                    timestamp: Date.now(),
                  },
                ]);
              }

              const followUpActions = (continuation.actions ?? []) as OracleAgentAction[];
              const followUpConfirm = followUpActions.filter((a) => a.requiresConfirmation);
              if (followUpConfirm.length > 0) {
                setPendingActions((prev) => [...prev, ...followUpConfirm]);
              }
            } catch {
              // Continuation failed — non-fatal
            }
          }
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: msgId(),
            role: "oracle",
            text: "I\u2019m having trouble connecting right now. Try again in a moment.",
            timestamp: Date.now(),
          },
        ]);
      } finally {
        setIsThinking(false);
      }
    },
    [pathname, executeActions],
  );

  const confirmAction = useCallback(
    async (actionId: string) => {
      const action = pendingActions.find((a) => a.id === actionId);
      if (!action) return;
      setPendingActions((prev) => prev.filter((a) => a.id !== actionId));
      setIsThinking(true);

      try {
        const results = await executeActions([action]);

        // Send results back to backend for continuation narration
        const history = messagesRef.current
          .slice(-20)
          .map((m) => ({ role: m.role, content: m.text }));

        try {
          const continuation = await api.oracle.agent({
            messages: [
              ...history,
              {
                role: "user" as const,
                content: `[User confirmed action: ${action.label}. Result: ${results[0]?.success ? "success" : "failed"}]`,
              },
            ],
            page: pathname,
            sessionId: sessionIdRef.current ?? undefined,
            actionResults: results.map((r) => ({
              actionId: r.actionId,
              type: r.type,
              success: r.success,
              data: r.data,
              error: r.error,
            })),
          });

          if (continuation.text) {
            setMessages((prev) => [
              ...prev,
              {
                id: msgId(),
                role: "oracle" as const,
                text: continuation.text,
                timestamp: Date.now(),
              },
            ]);
          }

          // Handle follow-up actions from continuation
          const followUp = (continuation.actions ?? []) as OracleAgentAction[];
          const needsConfirm = followUp.filter((a) => a.requiresConfirmation);
          const autoExec = followUp.filter((a) => !a.requiresConfirmation);

          if (needsConfirm.length > 0) {
            setPendingActions((prev) => [...prev, ...needsConfirm]);
          }
          if (autoExec.length > 0) {
            await executeActions(autoExec);
          }
        } catch {
          // Continuation failed — non-fatal
        }
      } finally {
        setIsThinking(false);
      }
    },
    [pendingActions, executeActions, pathname],
  );

  const rejectAction = useCallback((actionId: string) => {
    setPendingActions((prev) => prev.filter((a) => a.id !== actionId));
  }, []);

  const narrate = useCallback(
    (tag: "inspect" | "observe", entity: InspectableEntity): string => {
      // Synthesize the narration locally so Inspector renders even if
      // the backend is cold. This is the demo hot-path — we optimize
      // for "fast + reliable" over "clever".
      const text = synthesizeInspectorNarration(tag, entity);
      if (!text) return "";

      // Append an ambient transcript entry. We dedupe against the very
      // last message: if the same ambient line was just written (e.g.
      // Inspector re-rendered under React StrictMode) we skip the push
      // instead of doubling the transcript.
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (
          last &&
          last.role === "oracle" &&
          last.ambient === true &&
          last.text === text
        ) {
          return prev;
        }
        return [
          ...prev,
          {
            id: msgId(),
            role: "oracle" as const,
            text,
            timestamp: Date.now(),
            ambient: true,
          },
        ];
      });

      return text;
    },
    [],
  );

  const reset = useCallback(() => {
    setMessages([]);
    setPendingActions([]);
    setIsThinking(false);
    clearPersistedSession();
    // Rotate the session id so the backend treats the next turn as a
    // brand-new thread instead of continuing the prior one.
    sessionIdRef.current = loadOrCreateSessionId();
  }, []);

  return (
    <OracleAgentContext.Provider
      value={{
        messages,
        isThinking,
        pendingActions,
        send,
        confirmAction,
        rejectAction,
        reset,
        narrate,
      }}
    >
      {children}
    </OracleAgentContext.Provider>
  );
}

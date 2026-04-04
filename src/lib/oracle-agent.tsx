"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { executeAction, summarizeResult } from "@/lib/oracle-action-executor";
import type {
  AgentChatMessage,
  OracleAgentAction,
  OracleActionResult,
} from "@/lib/oracle-agent-types";

interface OracleAgentContextValue {
  messages: AgentChatMessage[];
  isThinking: boolean;
  pendingActions: OracleAgentAction[];
  send: (text: string) => Promise<void>;
  confirmAction: (actionId: string) => Promise<void>;
  rejectAction: (actionId: string) => void;
  reset: () => void;
}

const OracleAgentContext = createContext<OracleAgentContextValue>({
  messages: [],
  isThinking: false,
  pendingActions: [],
  send: async () => {},
  confirmAction: async () => {},
  rejectAction: () => {},
  reset: () => {},
});

export function useOracleAgent() {
  return useContext(OracleAgentContext);
}

let nextId = 0;
function msgId() {
  return `msg-${Date.now()}-${++nextId}`;
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
        });

        const oracleActions = (res.actions ?? []) as OracleAgentAction[];

        // Add Oracle's text response
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

        // Separate confirmation-required from auto-execute
        const needsConfirmation = oracleActions.filter(
          (a) => a.requiresConfirmation,
        );
        const autoExecute = oracleActions.filter(
          (a) => !a.requiresConfirmation,
        );

        if (needsConfirmation.length > 0) {
          setPendingActions(needsConfirmation);
        }

        // Auto-execute non-confirmation actions
        if (autoExecute.length > 0) {
          const results = await executeActions(autoExecute);

          // Send results back to backend for continuation/narration
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

              // Handle any follow-up actions from continuation
              const followUpActions = (continuation.actions ?? []) as OracleAgentAction[];
              const followUpConfirm = followUpActions.filter((a) => a.requiresConfirmation);
              if (followUpConfirm.length > 0) {
                setPendingActions((prev) => [...prev, ...followUpConfirm]);
              }
            } catch {
              // Continuation failed — non-fatal, Oracle already spoke
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
      await executeActions([action]);
    },
    [pendingActions, executeActions],
  );

  const rejectAction = useCallback((actionId: string) => {
    setPendingActions((prev) => prev.filter((a) => a.id !== actionId));
  }, []);

  const reset = useCallback(() => {
    setMessages([]);
    setPendingActions([]);
    setIsThinking(false);
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
      }}
    >
      {children}
    </OracleAgentContext.Provider>
  );
}

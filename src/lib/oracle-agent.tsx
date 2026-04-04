"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import type {
  AgentChatMessage,
  OracleAgentAction,
  OracleActionResult,
} from "@/lib/oracle-agent-types";

interface OracleAgentContextValue {
  /** All messages in the agent conversation. */
  messages: AgentChatMessage[];
  /** Whether the agent is processing a request. */
  isThinking: boolean;
  /** Actions awaiting user confirmation. */
  pendingActions: OracleAgentAction[];
  /** Send a user message to the Oracle agent. */
  send: (text: string) => Promise<void>;
  /** Confirm a pending action. */
  confirmAction: (actionId: string) => Promise<void>;
  /** Reject a pending action. */
  rejectAction: (actionId: string) => void;
  /** Reset the conversation. */
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
  const pathname = usePathname();
  const [messages, setMessages] = useState<AgentChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [pendingActions, setPendingActions] = useState<OracleAgentAction[]>([]);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const send = useCallback(
    async (text: string) => {
      // Add user message
      const userMsg: AgentChatMessage = {
        id: msgId(),
        role: "user",
        text,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsThinking(true);

      try {
        // Build conversation history for the API (last 20 messages)
        const history = [...messagesRef.current, userMsg]
          .slice(-20)
          .map((m) => ({ role: m.role, content: m.text }));

        const res = await api.oracle.agent({
          messages: history,
          page: pathname,
        });

        // Process actions — separate server-resolved from frontend-needed
        const oracleActions = (res.actions ?? []) as OracleAgentAction[];
        const needsConfirmation = oracleActions.filter(
          (a) => a.requiresConfirmation,
        );
        const autoExecute = oracleActions.filter(
          (a) => !a.requiresConfirmation,
        );

        // Build oracle response message
        const oracleMsg: AgentChatMessage = {
          id: msgId(),
          role: "oracle",
          text: res.text || "Done.",
          actions: oracleActions.length > 0 ? oracleActions : undefined,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, oracleMsg]);

        // Queue confirmation-required actions
        if (needsConfirmation.length > 0) {
          setPendingActions(needsConfirmation);
        }

        // Log auto-executable actions for Phase 2 (executor will handle these)
        if (autoExecute.length > 0) {
          console.log(
            "[Oracle Agent] Actions to execute:",
            autoExecute.map((a) => `${a.type}: ${a.label}`),
          );
        }
      } catch (err) {
        const errorMsg: AgentChatMessage = {
          id: msgId(),
          role: "oracle",
          text: "I\u2019m having trouble connecting right now. Try again in a moment.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsThinking(false);
      }
    },
    [pathname],
  );

  const confirmAction = useCallback(async (actionId: string) => {
    // Phase 3: Execute the confirmed action
    setPendingActions((prev) => prev.filter((a) => a.id !== actionId));
    console.log("[Oracle Agent] Action confirmed:", actionId);
  }, []);

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

"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/oracle-types";
import OracleAvatar from "./OracleAvatar";
import OracleMessage from "./OracleMessage";
import TypingIndicator from "./TypingIndicator";
import ActionZone from "./ActionZone";
import NavBar from "@/components/ui/NavBar";

// Hardcoded test messages for Phase 1 shell
const TEST_MESSAGES: ChatMessage[] = [
  {
    id: "sys-1",
    role: "system",
    content: "Initializing DELPHI OS...",
    timestamp: Date.now() - 5000,
  },
  {
    id: "oracle-1",
    role: "oracle",
    content:
      "Welcome. I am The Oracle.\n\nI'm going to learn how you write so I can help you craft tweets that sound like you — but sharper.",
    timestamp: Date.now() - 4000,
  },
  {
    id: "oracle-2",
    role: "oracle",
    content: "How would you like to get started?",
    actions: [
      { label: "Connect X", value: "track-a", variant: "primary" },
      { label: "Set up manually", value: "track-b", variant: "secondary" },
    ],
    timestamp: Date.now() - 3000,
  },
];

export default function OracleChat() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messages = TEST_MESSAGES;
  const isTyping = false;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-atlas-bg via-atlas-nav to-atlas-bg">
      <NavBar variant="onboarding" />

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-glass-border bg-atlas-nav/50 backdrop-blur-xl">
        <OracleAvatar size="md" />
        <div>
          <h1 className="font-heading font-bold text-sm text-atlas-text">
            The Oracle
          </h1>
          <p className="text-xs text-atlas-teal">DELPHI OS</p>
        </div>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((msg, i) => (
          <OracleMessage
            key={msg.id}
            message={msg}
            isLast={i === messages.length - 1}
            onAction={(value) => {
              console.log("Action:", value);
            }}
          />
        ))}

        {isTyping && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Action zone */}
      <ActionZone
        disabled={isTyping}
        onAction={(value) => {
          console.log("ActionZone:", value);
        }}
      />
    </div>
  );
}

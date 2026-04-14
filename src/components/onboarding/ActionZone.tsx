"use client";

import { useState } from "react";
import type { ChatMessage } from "@/lib/oracle-types";
import GradientButton from "@/components/ui/GradientButton";
import { Send } from "lucide-react";

interface ActionZoneProps {
  actions?: ChatMessage["actions"];
  showTextInput?: boolean;
  textInputPlaceholder?: string;
  disabled?: boolean;
  canGoBack?: boolean;
  onAction: (value: string) => void;
  onTextSubmit?: (text: string) => void;
  onGoBack?: () => void;
}

export default function ActionZone({
  actions,
  showTextInput = false,
  textInputPlaceholder = "Type a message...",
  disabled = false,
  canGoBack = false,
  onAction,
  onTextSubmit,
  onGoBack,
}: ActionZoneProps) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onTextSubmit?.(trimmed);
    setText("");
  };

  return (
    <div
      className={`bg-atlas-nav/95 backdrop-blur-xl border-t border-glass-border px-4 sm:px-6 py-3 ${
        disabled ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      {showTextInput ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder={textInputPlaceholder}
            aria-label={textInputPlaceholder}
            className="flex-1 rounded-lg border border-glass-border bg-atlas-surface px-4 py-2.5 text-sm text-atlas-text placeholder-atlas-text-secondary focus:border-atlas-teal focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!text.trim()}
            aria-label="Send message"
            className="rounded-lg bg-atlas-teal px-3 py-2.5 text-white transition-colors hover:bg-atlas-teal/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 justify-center items-center">
          {canGoBack && (
            <button
              type="button"
              onClick={onGoBack}
              className="rounded-lg px-3 py-2.5 text-sm text-atlas-text-secondary hover:text-atlas-text transition-colors"
            >
              ← Back
            </button>
          )}
          {actions?.map((action) => (
            <GradientButton
              key={action.value}
              variant={
                action.variant === "primary"
                  ? "primary"
                  : "outline"
              }
              onClick={() => onAction(action.value)}
            >
              {action.label}
            </GradientButton>
          ))}
        </div>
      )}
    </div>
  );
}

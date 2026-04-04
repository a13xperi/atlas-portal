"use client";

import type { ReactNode } from "react";
import type { ChatMessage } from "@/lib/oracle-types";
import OracleAvatar from "./OracleAvatar";
import GradientButton from "@/components/ui/GradientButton";

interface OracleMessageProps {
  message: ChatMessage;
  isLast?: boolean;
  renderComponent?: (
    type: string,
    props?: Record<string, unknown>
  ) => ReactNode;
  onAction?: (value: string) => void;
}

export default function OracleMessage({
  message,
  isLast = false,
  renderComponent,
  onAction,
}: OracleMessageProps) {
  if (message.role === "system") {
    return (
      <div className="text-center py-2">
        <span className="text-xs text-atlas-text-muted">{message.content}</span>
      </div>
    );
  }

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-atlas-teal/10 border border-atlas-teal/20 rounded-2xl rounded-tr-sm px-4 py-3">
          <p className="text-sm text-atlas-text whitespace-pre-line">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  // Oracle message
  return (
    <div className="flex items-start gap-3">
      <OracleAvatar size="sm" />
      <div className="flex-1 min-w-0 space-y-3">
        <div className="bg-glass border border-glass-border border-l-2 border-l-atlas-teal/40 rounded-2xl rounded-tl-sm px-4 py-3">
          <p className="text-sm text-atlas-text leading-relaxed whitespace-pre-line">
            {message.content}
          </p>
        </div>

        {/* Inline component */}
        {message.component && renderComponent && (
          <div className="ml-0">
            {renderComponent(message.component.type, message.component.props)}
          </div>
        )}

        {/* Action buttons (only on the last Oracle message) */}
        {isLast && message.actions && message.actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {message.actions.map((action) => (
              <GradientButton
                key={action.value}
                variant={
                  action.variant === "primary"
                    ? "primary"
                    : action.variant === "secondary"
                      ? "outline"
                      : "outline"
                }
                size="sm"
                onClick={() => onAction?.(action.value)}
              >
                {action.label}
              </GradientButton>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

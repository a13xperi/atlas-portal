"use client";

import type { ChatAction } from "@/lib/oracle";
import GradientButton from "@/components/ui/GradientButton";

interface ActionZoneProps {
  actions: ChatAction[];
  onAction: (value: string) => void;
  disabled?: boolean;
}

export default function ActionZone({
  actions,
  onAction,
  disabled,
}: ActionZoneProps) {
  if (actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3 justify-center pt-2">
      {actions.map((action) => {
        if (action.variant === "primary") {
          return (
            <GradientButton
              key={action.value}
              onClick={() => onAction(action.value)}
              disabled={disabled}
            >
              {action.label}
            </GradientButton>
          );
        }

        if (action.variant === "secondary") {
          return (
            <button
              key={action.value}
              type="button"
              onClick={() => onAction(action.value)}
              disabled={disabled}
              className="rounded-lg border border-atlas-teal/30 bg-atlas-teal/10 px-5 py-2.5 text-sm font-medium text-atlas-teal transition-colors hover:border-atlas-teal hover:bg-atlas-teal/15 disabled:opacity-50"
            >
              {action.label}
            </button>
          );
        }

        return (
          <button
            key={action.value}
            type="button"
            onClick={() => onAction(action.value)}
            disabled={disabled}
            className="rounded-lg px-5 py-2.5 text-sm font-medium text-atlas-text-secondary transition-colors hover:text-atlas-text disabled:opacity-50"
          >
            {action.label}
          </button>
        );
      })}
    </div>
  );
}

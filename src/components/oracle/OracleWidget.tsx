"use client";

import { useState } from "react";
import Image from "next/image";

interface OracleWidgetProps {
  message: string;
  context?: "dashboard" | "crafting" | "alerts" | "voice-profiles";
  actionLabel?: string;
  onAction?: () => void;
  dismissible?: boolean;
}

export default function OracleWidget({
  message,
  context = "dashboard",
  actionLabel,
  onAction,
  dismissible = true,
}: OracleWidgetProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative flex items-start gap-4 rounded-2xl border border-atlas-teal/20 bg-gradient-to-r from-atlas-teal/5 to-transparent p-4">
      <div className="relative h-10 w-10 flex-shrink-0">
        <Image
          src="/images/oracle-avatar.jpg"
          alt="The Oracle"
          width={40}
          height={40}
          className="rounded-full ring-2 ring-atlas-teal/30"
        />
        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-atlas-bg bg-atlas-teal" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-atlas-teal">The Oracle</p>
        <p className="mt-1 text-sm leading-relaxed text-atlas-text-secondary">
          {message}
        </p>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="mt-2 text-xs font-medium text-atlas-teal hover:underline"
          >
            {actionLabel} →
          </button>
        )}
      </div>

      {dismissible && (
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss Oracle message"
          className="flex-shrink-0 text-atlas-text-muted hover:text-atlas-text-secondary"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Check, Loader2, Trash2, CheckCircle2 } from "lucide-react";
import type { TweetDraft } from "@/lib/api";

export interface AngleDraftItem {
  id: string;
  draft: TweetDraft;
  angleLabel: string;
  discarded: boolean;
}

interface TweetAngleCardProps {
  item: AngleDraftItem;
  selected: boolean;
  disabled: boolean;
  isApproving: boolean;
  onToggleSelect: () => void;
  onChangeContent: (content: string) => void;
  onApprove: () => void;
  onDiscard: () => void;
}

const ANGLE_COLORS: Record<string, string> = {
  Contrarian: "bg-orange-500/15 text-orange-300 border-orange-500/25",
  Bullish: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  Educational: "bg-violet-500/15 text-violet-300 border-violet-500/25",
  "Data-led": "bg-blue-500/15 text-blue-300 border-blue-500/25",
  Narrative: "bg-teal-500/15 text-teal-300 border-teal-500/25",
};

export function TweetAngleCard({
  item,
  selected,
  disabled,
  isApproving,
  onToggleSelect,
  onChangeContent,
  onApprove,
  onDiscard,
}: TweetAngleCardProps) {
  const [localContent, setLocalContent] = useState(item.draft.content);
  const angleClass =
    ANGLE_COLORS[item.angleLabel] ??
    "bg-atlas-text-muted/15 text-atlas-text-muted border-atlas-text-muted/25";

  const charCount = localContent.length;
  const isOverLimit = charCount > 280;

  const handleBlur = () => {
    if (localContent !== item.draft.content) {
      onChangeContent(localContent);
    }
  };

  if (item.discarded) {
    return null;
  }

  return (
    <div className="relative rounded-2xl border border-glass-border bg-glass p-5 backdrop-blur-xl transition-colors hover:border-atlas-teal/20">
      {/* Header: checkbox + badge + actions */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onToggleSelect}
            disabled={disabled}
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
              selected
                ? "border-atlas-teal bg-atlas-teal"
                : "border-white/20 bg-transparent hover:border-white/40"
            } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
            aria-label={selected ? "Deselect draft" : "Select draft"}
          >
            {selected && (
              <Check className="h-3.5 w-3.5 text-white" aria-hidden="true" />
            )}
          </button>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${angleClass}`}
          >
            {item.angleLabel}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onApprove}
            disabled={disabled || isApproving}
            className="inline-flex items-center gap-1 rounded-lg border border-atlas-teal/30 px-2.5 py-1 text-[11px] font-medium text-atlas-teal transition-colors hover:bg-atlas-teal/10 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Approve to queue"
          >
            {isApproving ? (
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
            )}
            Approve
          </button>
          <button
            type="button"
            onClick={onDiscard}
            disabled={disabled}
            className="rounded-lg p-1.5 text-atlas-text-muted transition-colors hover:text-atlas-error disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Discard draft"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Editable content */}
      <textarea
        value={localContent}
        onChange={(e) => setLocalContent(e.target.value)}
        onBlur={handleBlur}
        disabled={disabled}
        rows={5}
        className="w-full resize-none rounded-lg border border-glass-border bg-atlas-surface/60 px-3 py-2.5 text-sm leading-relaxed text-atlas-text placeholder:text-atlas-text-muted focus:border-atlas-teal focus:outline-none disabled:opacity-60"
      />

      {/* Footer: char count */}
      <div className="mt-2 flex items-center justify-between">
        <span
          className={`text-xs font-mono ${
            isOverLimit
              ? "text-atlas-error"
              : charCount > 250
                ? "text-atlas-warning"
                : "text-atlas-text-muted"
          }`}
        >
          {charCount}/280
        </span>
        {isOverLimit && (
          <span className="text-xs text-atlas-error">
            {charCount - 280} over limit
          </span>
        )}
      </div>
    </div>
  );
}

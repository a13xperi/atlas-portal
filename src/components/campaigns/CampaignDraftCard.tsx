"use client";

import { useState } from "react";
import { X, Clock, User, ChevronDown, ChevronUp } from "lucide-react";
import type { ContentFormat, TimingRecommendation, AnalystSuggestion } from "@/lib/campaign-recommendations";

interface CampaignDraftCardProps {
  draft: { id: string; content: string; angle: string; qualityScore: number };
  onContentChange: (id: string, next: string) => void;
  onDiscard: (id: string) => void;
  timing: TimingRecommendation;
  analysts: AnalystSuggestion[];
  format: ContentFormat;
}

const ANGLE_COLORS: Record<string, string> = {
  "contrarian take": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "data highlight": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  prediction: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  "practical advice": "bg-green-500/20 text-green-400 border-green-500/30",
  "narrative arc": "bg-teal-500/20 text-teal-400 border-teal-500/30",
  "hot take": "bg-red-500/20 text-red-400 border-red-500/30",
  explainer: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
};

const FORMAT_LABELS: Record<ContentFormat, string> = {
  "one-liner": "One-liner",
  thread: "Thread",
  article: "Article",
};

const FORMAT_COLORS: Record<ContentFormat, string> = {
  "one-liner": "bg-pink-500/20 text-pink-400 border-pink-500/30",
  thread: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  article: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

export default function CampaignDraftCard({
  draft,
  onContentChange,
  onDiscard,
  timing,
  analysts,
  format,
}: CampaignDraftCardProps) {
  const [showTimingReason, setShowTimingReason] = useState(false);

  const angleClass =
    ANGLE_COLORS[draft.angle] ||
    "bg-atlas-text-muted/20 text-atlas-text-muted border-atlas-text-muted/30";

  return (
    <div className="rounded-2xl border border-glass-border bg-glass p-6 backdrop-blur-xl">
      {/* Badges row */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${angleClass}`}
          >
            {draft.angle}
          </span>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${FORMAT_COLORS[format]}`}
          >
            {FORMAT_LABELS[format]}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Quality bar */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-atlas-text-muted">Quality</span>
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-atlas-surface">
              <div
                className="h-full rounded-full bg-atlas-teal"
                style={{ width: `${Math.min(100, draft.qualityScore)}%` }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => onDiscard(draft.id)}
            className="rounded-lg p-1.5 text-atlas-text-muted transition-colors hover:text-atlas-error"
            aria-label="Discard draft"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Timing recommendation */}
      <div className="mb-3 rounded-lg border border-glass-border bg-atlas-surface/50 px-3 py-2">
        <button
          type="button"
          onClick={() => setShowTimingReason((s) => !s)}
          className="flex w-full items-center justify-between text-left"
          aria-expanded={showTimingReason}
        >
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-atlas-teal" />
            <span className="text-xs text-atlas-text-secondary">
              Post {timing.label}
            </span>
          </div>
          {showTimingReason ? (
            <ChevronUp className="h-3.5 w-3.5 text-atlas-text-muted" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-atlas-text-muted" />
          )}
        </button>
        {showTimingReason && (
          <p className="mt-1.5 pl-5 text-[11px] text-atlas-text-muted">
            {timing.reason}
          </p>
        )}
      </div>

      {/* Analyst suggestions */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <User className="h-3.5 w-3.5 text-atlas-text-muted" />
        {analysts.map((a) => (
          <span
            key={a.slug}
            className="inline-flex items-center rounded-full border border-glass-border bg-atlas-surface px-2 py-0.5 text-[11px] text-atlas-text"
            title={a.reason}
          >
            {a.name}
          </span>
        ))}
      </div>

      {/* Editable draft content */}
      <textarea
        value={draft.content}
        onChange={(e) => onContentChange(draft.id, e.target.value)}
        rows={4}
        className="w-full rounded-lg border border-glass-border bg-atlas-surface px-3 py-2 text-sm text-atlas-text placeholder:text-atlas-text-muted focus:border-atlas-teal focus:outline-none"
      />
    </div>
  );
}

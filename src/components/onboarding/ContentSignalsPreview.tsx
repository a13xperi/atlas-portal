"use client";

import { TrendingUp, Flame, Clock, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ContentSignal {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: "teal" | "amber" | "violet" | "rose";
}

const DEFAULT_SIGNALS: ContentSignal[] = [
  {
    icon: TrendingUp,
    label: "Trending topic",
    value: "ETH restaking narrative",
    tone: "teal",
  },
  {
    icon: Flame,
    label: "Engagement spike",
    value: "+24% this week",
    tone: "amber",
  },
  {
    icon: Clock,
    label: "Best time to post",
    value: "Tue 9am ET",
    tone: "violet",
  },
  {
    icon: Sparkles,
    label: "Voice match",
    value: "Analytical • Confident",
    tone: "rose",
  },
];

const TONE_STYLES: Record<ContentSignal["tone"], string> = {
  teal: "text-atlas-teal bg-atlas-teal/10 border-atlas-teal/20",
  amber: "text-amber-300 bg-amber-400/10 border-amber-400/20",
  violet: "text-violet-300 bg-violet-400/10 border-violet-400/20",
  rose: "text-rose-300 bg-rose-400/10 border-rose-400/20",
};

export interface ContentSignalsPreviewProps {
  signals?: ContentSignal[];
  heading?: string;
}

/**
 * Inline renderer for the `content-signals` Oracle chat component.
 * Shows a compact row of 2-4 style signals the Oracle has detected
 * (or expects to detect) from the content the user drops in Track B.
 *
 * Kept deliberately small — this is a chat-inline element, not a page.
 */
export default function ContentSignalsPreview({
  signals = DEFAULT_SIGNALS,
  heading = "Signals I'll watch for",
}: ContentSignalsPreviewProps) {
  // Clamp to 2-4 cards per spec.
  const visible = signals.slice(0, 4);

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-atlas-text-muted">
        {heading}
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {visible.map(({ icon: Icon, label, value, tone }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-xl border border-glass-border bg-atlas-surface/60 px-3 py-2.5"
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${TONE_STYLES[tone]}`}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] uppercase tracking-wide text-atlas-text-muted">
                {label}
              </p>
              <p className="truncate text-sm font-medium text-atlas-text">
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { FileText, Link2, Newspaper, Twitter } from "lucide-react";

export type ContentSignalSource = "article" | "report" | "tweet" | "link";

export interface ContentSignal {
  source: ContentSignalSource;
  title?: string;
  url?: string;
  addedLabel?: string;
}

interface ContentSignalCardProps {
  signal: ContentSignal;
}

function truncate(text: string, max = 64): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function stripUrl(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname === "/" ? "" : u.pathname;
    return `${u.hostname.replace(/^www\./, "")}${path}`;
  } catch {
    return url;
  }
}

const SOURCE_META: Record<
  ContentSignalSource,
  { label: string; Icon: typeof FileText }
> = {
  article: { label: "Article", Icon: Newspaper },
  report: { label: "Report", Icon: FileText },
  tweet: { label: "Tweet", Icon: Twitter },
  link: { label: "Link", Icon: Link2 },
};

export default function ContentSignalCard({ signal }: ContentSignalCardProps) {
  const meta = SOURCE_META[signal.source] ?? SOURCE_META.link;
  const Icon = meta.Icon;
  const displayTitle = signal.title
    ? truncate(signal.title, 72)
    : signal.url
      ? truncate(stripUrl(signal.url), 72)
      : "Untitled source";
  const addedLabel = signal.addedLabel ?? "Added to your voice profile";

  return (
    <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-xl p-3 flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-delphi-teal/10 border border-delphi-teal/20 text-delphi-teal">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wide text-atlas-text-muted">
            {meta.label}
          </span>
        </div>
        <p
          className="mt-0.5 truncate text-sm font-medium text-atlas-text"
          title={signal.title || signal.url || ""}
        >
          {displayTitle}
        </p>
        {signal.url && signal.title && (
          <p className="mt-0.5 truncate text-xs text-atlas-text-muted">
            {stripUrl(signal.url)}
          </p>
        )}
        <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-delphi-teal">
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span>{addedLabel}</span>
        </div>
      </div>
    </div>
  );
}

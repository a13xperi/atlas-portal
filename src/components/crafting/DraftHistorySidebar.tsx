"use client";

import { TweetDraft } from "@/lib/api";

const PREVIEW_CHARACTER_LIMIT = 80;

export interface DraftHistoryItem {
  draft: TweetDraft;
  isCopied: boolean;
}

interface DraftHistorySidebarProps {
  drafts: DraftHistoryItem[];
  activeDraftId?: string | null;
  onSelect: (draft: TweetDraft) => void;
}

function formatDraftPreview(content: string): string {
  const normalizedContent = content.replace(/\s+/g, " ").trim();

  if (!normalizedContent) {
    return "Untitled draft";
  }

  if (normalizedContent.length <= PREVIEW_CHARACTER_LIMIT) {
    return normalizedContent;
  }

  return `${normalizedContent.slice(0, PREVIEW_CHARACTER_LIMIT)}…`;
}

function formatTimestamp(timestamp: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export default function DraftHistorySidebar({
  drafts,
  activeDraftId,
  onSelect,
}: DraftHistorySidebarProps) {
  return (
    <aside
      aria-label="Draft history"
      className="hidden w-64 shrink-0 self-start lg:flex"
    >
      <div className="w-full bg-glass/50 backdrop-blur-xl border border-glass-border rounded-2xl p-4 font-body">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-atlas-text-secondary">
              Crafting Station
            </p>
            <h2 className="mt-2 font-heading text-xl text-atlas-text">
              Draft History
            </h2>
          </div>
          <span className="rounded-full border border-glass-border px-2 py-1 text-[11px] text-atlas-text-secondary">
            {drafts.length}/20
          </span>
        </div>

        {drafts.length === 0 ? (
          <p className="mt-6 text-sm leading-relaxed text-atlas-text-secondary">
            No drafts yet. Generate your first tweet above.
          </p>
        ) : (
          <div className="mt-6 flex max-h-[calc(100vh-8rem)] flex-col gap-3 overflow-y-auto pr-1">
            {drafts.map((item) => {
              const isActive = item.draft.id === activeDraftId;

              return (
                <button
                  key={item.draft.id}
                  type="button"
                  onClick={() => onSelect(item.draft)}
                  className={`w-full rounded-2xl border px-3 py-3 text-left transition-colors ${
                    isActive
                      ? "border-atlas-teal bg-atlas-teal/10"
                      : "border-glass-border bg-atlas-nav/60 hover:border-atlas-teal/40"
                  }`}
                >
                  <p className="line-clamp-3 text-sm leading-relaxed text-atlas-text">
                    {formatDraftPreview(item.draft.content)}
                  </p>

                  {item.isCopied && (
                    <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-atlas-success/10 px-2 py-1 text-[11px] text-atlas-success">
                      <span className="h-2 w-2 rounded-full bg-atlas-success" />
                      Draft created
                    </span>
                  )}

                  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-atlas-text-secondary">
                    <span>{formatTimestamp(item.draft.createdAt)}</span>
                    <span>{item.draft.content.length} chars</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}

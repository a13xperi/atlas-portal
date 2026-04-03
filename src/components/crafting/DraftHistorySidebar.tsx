"use client";

import { TweetDraft } from "@/lib/api";

export interface DraftHistoryItem {
  draft: TweetDraft;
  copiedToClipboard: boolean;
  generatedAt: string;
}

interface DraftHistorySidebarProps {
  drafts: DraftHistoryItem[];
  activeDraftId: string | null;
  onSelectDraft: (draft: TweetDraft) => void;
}

function formatDraftPreview(content: string) {
  const preview = content.replace(/\s+/g, " ").trim();

  if (preview.length <= 80) {
    return preview;
  }

  return `${preview.slice(0, 80).trimEnd()}…`;
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function DraftHistorySidebar({
  drafts,
  activeDraftId,
  onSelectDraft,
}: DraftHistorySidebarProps) {
  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <div className="sticky top-24 space-y-4">
        <div className="bg-glass/50 backdrop-blur-xl border border-glass-border rounded-2xl p-5">
          <h2 className="font-heading text-lg text-atlas-text">Draft History</h2>
          <p className="mt-1 font-body text-sm text-atlas-text-secondary">
            Session drafts appear here as you generate them.
          </p>
        </div>

        {drafts.length === 0 ? (
          <div className="bg-glass/50 backdrop-blur-xl border border-glass-border rounded-2xl p-4">
            <p className="font-body text-sm text-atlas-text-secondary">
              No drafts yet. Generate your first tweet above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {drafts.map(({ draft, copiedToClipboard, generatedAt }) => {
              const isActive = draft.id === activeDraftId;

              return (
                <button
                  key={draft.id}
                  type="button"
                  onClick={() => onSelectDraft(draft)}
                  className={`w-full bg-glass/50 backdrop-blur-xl border border-glass-border rounded-2xl p-4 text-left transition-colors ${
                    isActive
                      ? "border-atlas-teal ring-1 ring-atlas-teal"
                      : "hover:border-atlas-teal/60"
                  }`}
                >
                  <p className="font-body text-sm leading-5 text-atlas-text">
                    {formatDraftPreview(draft.content)}
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-3 font-body text-xs text-atlas-text-secondary">
                    <span>{formatTimestamp(generatedAt)}</span>
                    <span>{draft.content.length} chars</span>
                  </div>

                  {copiedToClipboard ? (
                    <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-atlas-success/10 px-2.5 py-1 font-body text-xs text-atlas-success">
                      <span className="h-2 w-2 rounded-full bg-atlas-success" />
                      Draft created
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}

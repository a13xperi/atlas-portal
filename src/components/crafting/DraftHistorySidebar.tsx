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
  mobile?: boolean;
}

function formatDraftPreview(content: string) {
  const preview = content.replace(/\s+/g, " ").trim();

  if (preview.length <= 80) {
    return preview;
  }

  return `${preview.slice(0, 80).trimEnd()}…`;
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  return `${Math.floor(hours / 24)}d ago`;
}

export default function DraftHistorySidebar({
  drafts,
  activeDraftId,
  onSelectDraft,
  mobile = false,
}: DraftHistorySidebarProps) {
  return (
    <aside
      aria-label="Draft history"
      className={mobile ? "w-full" : "hidden w-64 shrink-0 lg:block"}
    >
      <div className={mobile ? "space-y-4" : "sticky top-24 space-y-4"}>
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
            {drafts.map(({ draft, copiedToClipboard }) => {
              const isActive = draft.id === activeDraftId;

              return (
                <button
                  key={draft.id}
                  type="button"
                  onClick={() => onSelectDraft(draft)}
                  className={`w-full rounded-2xl border border-glass-border bg-glass/50 p-4 text-left backdrop-blur-xl ${
                    isActive
                      ? "border-atlas-teal ring-1 ring-atlas-teal"
                      : "card-interactive"
                  }`}
                >
                  <p className="font-body text-sm leading-5 text-atlas-text">
                    {formatDraftPreview(draft.content)}
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        draft.status === "POSTED"
                          ? "bg-atlas-success"
                          : draft.status === "APPROVED"
                            ? "bg-atlas-teal"
                            : "bg-atlas-text-muted"
                      }`}
                    />
                    <span className="text-[10px] text-atlas-text-muted">
                      {relativeTime(draft.createdAt)}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-3 font-body text-xs text-atlas-text-secondary">
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

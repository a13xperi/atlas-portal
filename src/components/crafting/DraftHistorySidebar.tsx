"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Clock, FileText } from "lucide-react";
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
  if (preview.length <= 80) return preview;
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

const STATUS_DOT: Record<string, string> = {
  POSTED: "bg-atlas-success",
  APPROVED: "bg-atlas-teal",
  SCHEDULED: "bg-atlas-warning",
  DRAFT: "bg-atlas-text-muted",
  ARCHIVED: "bg-atlas-text-muted",
};

const STATUS_LABEL: Record<string, string> = {
  POSTED: "Posted",
  APPROVED: "Approved",
  SCHEDULED: "Scheduled",
  DRAFT: "Draft",
  ARCHIVED: "Archived",
};

export default function DraftHistorySidebar({
  drafts,
  activeDraftId,
  onSelectDraft,
  mobile = false,
}: DraftHistorySidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (!mobile && collapsed) {
    return (
      <aside aria-label="Draft history" className="hidden shrink-0 lg:block">
        <div className="sticky top-24">
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-glass-border bg-atlas-surface text-atlas-text-secondary transition-colors hover:border-atlas-teal hover:text-atlas-teal"
            aria-label="Expand draft history"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Draft history"
      className={mobile ? "w-full" : "hidden w-72 shrink-0 lg:block"}
    >
      <div className={mobile ? "space-y-3" : "sticky top-24 space-y-3"}>
        <div className="rounded-2xl border border-glass-border bg-atlas-surface p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-atlas-teal" />
              <h2 className="font-heading text-sm font-bold text-atlas-text">Drafts</h2>
              <span className="rounded-full bg-atlas-teal/15 px-2 py-0.5 text-[10px] font-bold text-atlas-teal">
                {drafts.length}
              </span>
            </div>
            {!mobile && (
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-atlas-text-muted transition-colors hover:text-atlas-teal"
                aria-label="Collapse draft history"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {drafts.length === 0 ? (
          <div className="rounded-2xl border border-glass-border bg-atlas-surface p-5 text-center">
            <p className="text-sm text-atlas-text-secondary">
              No drafts yet. Generate your first tweet above.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {drafts.map(({ draft, copiedToClipboard }) => {
              const isActive = draft.id === activeDraftId;

              return (
                <button
                  key={draft.id}
                  type="button"
                  onClick={() => onSelectDraft(draft)}
                  className={`w-full rounded-2xl border bg-atlas-surface p-4 text-left transition-colors ${
                    isActive
                      ? "border-atlas-teal"
                      : "border-glass-border hover:border-atlas-teal/30"
                  }`}
                >
                  <p className="text-sm leading-relaxed text-atlas-text">
                    {formatDraftPreview(draft.content)}
                  </p>

                  <div className="my-3 border-t border-glass-border" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${STATUS_DOT[draft.status] ?? "bg-atlas-text-muted"}`} />
                      <span className="text-[10px] font-medium uppercase tracking-wide text-atlas-text-muted">
                        {STATUS_LABEL[draft.status] ?? draft.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-atlas-text-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {relativeTime(draft.createdAt)}
                      </span>
                      <span className="font-mono">{draft.content.length}/280</span>
                    </div>
                  </div>

                  {(draft.confidence != null || draft.predictedEngagement != null) && (
                    <div className="mt-2 flex gap-4 text-[10px]">
                      {draft.confidence != null && (
                        <div>
                          <span className="text-atlas-text-muted">CONF</span>
                          <p className="font-bold text-atlas-text">{Math.round(draft.confidence * 100)}%</p>
                        </div>
                      )}
                      {draft.predictedEngagement != null && (
                        <div>
                          <span className="text-atlas-text-muted">ENG</span>
                          <p className="font-bold text-atlas-teal">
                            {draft.predictedEngagement >= 1000
                              ? `${(draft.predictedEngagement / 1000).toFixed(1)}k`
                              : draft.predictedEngagement}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {copiedToClipboard && (
                    <div className="mt-2">
                      <span className="rounded-full bg-atlas-success/10 px-2 py-0.5 text-[10px] font-medium text-atlas-success">
                        Copied
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}

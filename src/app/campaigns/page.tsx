"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth";
import { api, TweetDraft } from "@/lib/api";

type QueueTab = "approved" | "draft" | "posted";

const TABS: { id: QueueTab; label: string; status: TweetDraft["status"] }[] = [
  { id: "approved", label: "Queue", status: "APPROVED" },
  { id: "draft", label: "Drafts", status: "DRAFT" },
  { id: "posted", label: "Posted", status: "POSTED" },
];

export default function CampaignsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<QueueTab>("approved");
  const [drafts, setDrafts] = useState<TweetDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [threadDraftId, setThreadDraftId] = useState<string | null>(null);
  const [threadResult, setThreadResult] = useState<Record<string, string[]>>({});
  const [postingId, setPostingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const currentStatus = TABS.find((t) => t.id === activeTab)!.status;

  const loadDrafts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.drafts.list(currentStatus);
      setDrafts(res.drafts);
    } catch {
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  }, [user, currentStatus]);

  useEffect(() => {
    void loadDrafts();
  }, [loadDrafts]);

  const handleApprove = async (draft: TweetDraft) => {
    try {
      await api.drafts.update(draft.id, { status: "APPROVED" });
      setActionMessage(`"${draft.content.slice(0, 40)}\u2026" moved to queue`);
      void loadDrafts();
    } catch {
      setActionMessage("Failed to approve draft.");
    }
  };

  const handleArchive = async (draft: TweetDraft) => {
    try {
      await api.drafts.update(draft.id, { status: "ARCHIVED" });
      setActionMessage("Draft archived.");
      void loadDrafts();
    } catch {
      setActionMessage("Failed to archive.");
    }
  };

  const handleGenerateThread = async (draft: TweetDraft) => {
    setThreadDraftId(draft.id);
    try {
      const res = await api.drafts.thread(draft.id);
      setThreadResult((prev) => ({ ...prev, [draft.id]: res.thread }));
    } catch {
      setActionMessage("Failed to generate thread.");
    } finally {
      setThreadDraftId(null);
    }
  };

  const handlePostToX = async (draft: TweetDraft) => {
    setPostingId(draft.id);
    try {
      await api.drafts.postToX(draft.id);
      setActionMessage("Posted to X!");
      void loadDrafts();
    } catch {
      setActionMessage("Failed to post. Check X connection.");
    } finally {
      setPostingId(null);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-atlas-teal">
            Campaign Orchestration
          </p>
          <h1 className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-atlas-text sm:text-4xl">
            Your posting queue
          </h1>
          <p className="mt-2 text-sm text-atlas-text-secondary">
            Approve drafts, generate threads, and ship to X.
          </p>
        </div>

        {/* Tabs */}
        <div className="mt-6 inline-flex rounded-xl bg-glass p-1 backdrop-blur-xl">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-4 py-2 text-sm transition-colors ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-atlas-teal to-atlas-teal/60 text-white"
                  : "text-atlas-text-secondary hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {actionMessage && (
          <div className="mt-4 rounded-xl border border-glass-border bg-glass/50 px-4 py-3 text-sm text-atlas-text-secondary">
            {actionMessage}
            <button
              type="button"
              onClick={() => setActionMessage(null)}
              className="ml-2 text-atlas-text-muted hover:text-atlas-text"
            >
              &times;
            </button>
          </div>
        )}

        {loading ? (
          <div className="mt-12 text-center text-sm text-atlas-text-secondary">
            Loading...
          </div>
        ) : drafts.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-glass-border bg-glass/50 p-10 text-center backdrop-blur-xl">
            <p className="text-atlas-text-secondary">
              {activeTab === "approved"
                ? "No drafts in queue. Approve drafts from the Crafting Station to add them here."
                : activeTab === "posted"
                  ? "No posts yet."
                  : "No drafts. Generate some in the Crafting Station."}
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {drafts.map((draft, index) => (
              <div
                key={draft.id}
                className="rounded-2xl border border-glass-border bg-glass/50 p-5 backdrop-blur-xl sm:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {activeTab === "approved" && (
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-atlas-teal/15 text-xs font-bold text-atlas-teal">
                        {index + 1}
                      </span>
                    )}
                    <p className="text-sm leading-relaxed text-atlas-text">
                      {draft.content}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {draft.confidence != null && (
                      <span className="rounded-full bg-glass px-2 py-0.5 text-[10px] text-atlas-text-muted">
                        {Math.round(draft.confidence * 100)}% conf
                      </span>
                    )}
                    <span className="text-xs text-atlas-text-muted">
                      {draft.content.length}/280
                    </span>
                  </div>
                </div>

                {/* Thread result */}
                {threadResult[draft.id] && (
                  <div className="mt-4 space-y-2 border-t border-glass-border/50 pt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-atlas-teal">
                      Thread ({threadResult[draft.id].length} posts)
                    </p>
                    {threadResult[draft.id].map((tweet, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-glass-border/50 bg-atlas-bg/30 px-3 py-2"
                      >
                        <p className="text-xs text-atlas-text-secondary">
                          <span className="mr-1.5 font-mono text-atlas-text-muted">
                            {i + 1}/{threadResult[draft.id].length}
                          </span>
                          {tweet}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-glass-border/50 pt-3">
                  {activeTab === "draft" && (
                    <button
                      type="button"
                      onClick={() => void handleApprove(draft)}
                      className="rounded-lg border border-atlas-teal/40 bg-atlas-teal/10 px-3 py-1.5 text-xs font-semibold text-atlas-teal transition-colors hover:border-atlas-teal hover:bg-atlas-teal/15"
                    >
                      Add to Queue
                    </button>
                  )}
                  {activeTab === "approved" && (
                    <>
                      <button
                        type="button"
                        onClick={() => void handleGenerateThread(draft)}
                        disabled={threadDraftId === draft.id}
                        className="rounded-lg border border-glass-border px-3 py-1.5 text-xs font-semibold text-atlas-text-secondary transition-colors hover:border-atlas-teal hover:text-atlas-teal disabled:opacity-50"
                      >
                        {threadDraftId === draft.id ? (
                          <span className="flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Threading...
                          </span>
                        ) : (
                          "Generate Thread"
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handlePostToX(draft)}
                        disabled={postingId === draft.id}
                        className="rounded-lg bg-gradient-to-r from-atlas-teal to-atlas-steel px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        {postingId === draft.id ? (
                          <span className="flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Posting...
                          </span>
                        ) : (
                          "Post to X"
                        )}
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleArchive(draft)}
                    className="rounded-lg border border-glass-border px-3 py-1.5 text-xs text-atlas-text-muted transition-colors hover:border-atlas-error/50 hover:text-atlas-error"
                  >
                    Archive
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

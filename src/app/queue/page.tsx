"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Clock,
  Zap,
  Calendar,
  ListOrdered,
  Archive,
  Send,
  PenTool,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import QueueTimeline from "@/components/queue/QueueTimeline";
import { api, QueuedDraft } from "@/lib/api";

export default function QueuePage() {
  const [queue, setQueue] = useState<QueuedDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "scheduled">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchScheduling, setBatchScheduling] = useState(false);
  const [showTimeline, setShowTimeline] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.drafts
      .queue()
      .then(({ queue: items }) => {
        if (!cancelled) setQueue(items ?? []);
      })
      .catch((e) => {
        if (!cancelled)
          setError(
            e instanceof Error ? e.message : "Failed to load queue"
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSchedule = async (id: string, suggestedAt: string) => {
    await api.drafts.schedule(id, suggestedAt);
    setQueue((q) =>
      q.map((d) =>
        d.id === id ? { ...d, status: "SCHEDULED" as const } : d
      )
    );
  };

  const handlePost = async (id: string) => {
    await api.drafts.postToX(id);
    setQueue((q) => q.filter((d) => d.id !== id));
  };

  const handleArchive = async (id: string) => {
    await api.drafts.update(id, { status: "ARCHIVED" });
    setQueue((q) => q.filter((d) => d.id !== id));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBatchSchedule = async () => {
    setBatchScheduling(true);
    try {
      const toSchedule = queue.filter((d) => selectedIds.has(d.id));
      await Promise.all(
        toSchedule.map((d) => api.drafts.schedule(d.id, d.suggestedAt))
      );
      setQueue((q) =>
        q.map((d) =>
          selectedIds.has(d.id) ? { ...d, status: "SCHEDULED" as const } : d
        )
      );
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Batch schedule failed:", err);
    } finally {
      setBatchScheduling(false);
    }
  };

  const filteredQueue =
    filter === "scheduled"
      ? queue.filter((d) => d.status === "SCHEDULED")
      : queue;

  const nextUp = filteredQueue[0] ?? null;
  const rest = filteredQueue.slice(1);

  function formatTime(item: QueuedDraft) {
    const suggestedTime = new Date(item.suggestedAt);
    const isToday =
      suggestedTime.toDateString() === new Date().toDateString();
    return isToday
      ? suggestedTime.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        })
      : suggestedTime.toLocaleDateString([], {
          weekday: "short",
          hour: "numeric",
          minute: "2-digit",
        });
  }

  /* ---------- Loading ---------- */
  if (loading) {
    return (
      <AppShell>
        <div className="space-y-4">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-atlas-surface" />
          <div className="h-4 w-72 animate-pulse rounded bg-atlas-surface" />
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-xl bg-atlas-surface"
              />
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  /* ---------- Error ---------- */
  if (error) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg border border-glass-border px-4 py-2 text-sm text-atlas-text-secondary transition-colors hover:border-atlas-teal hover:text-atlas-teal"
          >
            Retry
          </button>
        </div>
      </AppShell>
    );
  }

  /* ---------- Empty ---------- */
  if (queue.length === 0) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <ListOrdered className="mb-4 h-10 w-10 text-atlas-text-muted" />
          <p className="text-sm text-atlas-text-secondary">
            No drafts in your queue. Create drafts from the Crafting Station or
            Signals page.
          </p>
          <Link
            href="/crafting"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-atlas-teal px-4 py-2 text-sm font-semibold text-atlas-bg transition-opacity hover:opacity-90"
          >
            <PenTool className="h-4 w-4" />
            Go to Crafting
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-heading text-atlas-text">Queue</h1>
          <p className="mt-1 text-sm text-atlas-text-muted">
            Your ranked drafts, ready to schedule and post
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Select all */}
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-atlas-text-muted hover:text-atlas-text-secondary">
            <input
              type="checkbox"
              checked={
                filteredQueue.length > 0 &&
                filteredQueue.every((d) => selectedIds.has(d.id))
              }
              onChange={() => {
                const allSelected = filteredQueue.every((d) =>
                  selectedIds.has(d.id)
                );
                if (allSelected) {
                  setSelectedIds(new Set());
                } else {
                  setSelectedIds(
                    new Set(filteredQueue.map((d) => d.id))
                  );
                }
              }}
              className="h-4 w-4 accent-atlas-teal"
            />
            Select all
          </label>
          <div className="mx-1 h-4 w-px bg-glass-border" />
          {/* Filter toggles */}
          <button
            onClick={() => setFilter("all")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === "all"
                ? "bg-atlas-teal/15 text-atlas-teal"
                : "text-atlas-text-muted hover:text-atlas-text-secondary"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("scheduled")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === "scheduled"
                ? "bg-atlas-teal/15 text-atlas-teal"
                : "text-atlas-text-muted hover:text-atlas-text-secondary"
            }`}
          >
            Scheduled
          </button>
          {/* Count badge */}
          <span className="rounded-full bg-atlas-teal/15 px-2 py-0.5 text-[10px] font-medium text-atlas-teal">
            {filteredQueue.length} ready
          </span>
        </div>
      </div>

      {/* Timeline */}
      <button
        onClick={() => setShowTimeline(!showTimeline)}
        className="mb-4 mt-4 text-xs text-atlas-text-muted hover:text-atlas-teal"
      >
        {showTimeline ? "Hide" : "Show"} Timeline
      </button>
      {showTimeline && <QueueTimeline queue={queue} />}

      {/* Next Up Hero Card */}
      {nextUp && (
        <div className="mt-6 rounded-2xl border-2 border-atlas-teal/30 bg-atlas-surface p-6">
          <div className="flex items-start justify-between gap-4">
            <input
              type="checkbox"
              checked={selectedIds.has(nextUp.id)}
              onChange={() => toggleSelect(nextUp.id)}
              className="mt-1 h-4 w-4 shrink-0 accent-atlas-teal"
            />
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded bg-atlas-teal/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-atlas-teal">
                  Next up
                </span>
                {nextUp.sourceType && (
                  <span className="rounded bg-atlas-nav px-1.5 py-0.5 text-[10px] text-atlas-text-muted">
                    {nextUp.sourceType.replace("_", " ")}
                  </span>
                )}
                <span className="text-[10px] text-atlas-text-muted">
                  Score: {nextUp._score}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-atlas-text">
                {nextUp.content}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-3">
              <div className="flex items-center gap-1 text-xs text-atlas-text-muted">
                <Clock className="h-3 w-3" />
                <span>{formatTime(nextUp)}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    void handleSchedule(nextUp.id, nextUp.suggestedAt)
                  }
                  className="rounded-lg border border-glass-border px-3 py-1.5 text-xs font-medium text-atlas-text-secondary transition-colors hover:border-atlas-teal hover:text-atlas-teal"
                >
                  <Calendar className="mr-1 inline h-3 w-3" />
                  Schedule
                </button>
                <button
                  onClick={() => void handlePost(nextUp.id)}
                  className="rounded-lg bg-atlas-teal px-3 py-1.5 text-xs font-semibold text-atlas-bg transition-opacity hover:opacity-90"
                >
                  <Send className="mr-1 inline h-3 w-3" />
                  Post Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ranked list */}
      {rest.length > 0 && (
        <div className="mt-6 space-y-3">
          {rest.map((item, index) => {
            const timeLabel = formatTime(item);

            return (
              <div
                key={item.id}
                className="rounded-xl border border-glass-border bg-atlas-surface p-4 transition-colors hover:border-atlas-teal/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="mt-1 h-4 w-4 shrink-0 accent-atlas-teal"
                    />
                    {/* Position number */}
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-atlas-teal/10 text-[11px] font-semibold text-atlas-teal">
                      #{index + 2}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <span className="text-[10px] text-atlas-text-muted">
                          Score: {item._score}
                        </span>
                        {item.sourceType && (
                          <span className="rounded bg-atlas-nav px-1.5 py-0.5 text-[10px] text-atlas-text-muted">
                            {item.sourceType.replace("_", " ")}
                          </span>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed text-atlas-text">
                        {item.content.length > 200
                          ? `${item.content.slice(0, 200)}...`
                          : item.content}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <div className="flex items-center gap-1 text-xs text-atlas-text-muted">
                      <Clock className="h-3 w-3" />
                      <span>{timeLabel}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          void handleSchedule(item.id, item.suggestedAt)
                        }
                        className="rounded-lg border border-glass-border px-2.5 py-1 text-[11px] font-medium text-atlas-text-secondary transition-colors hover:border-atlas-teal hover:text-atlas-teal"
                      >
                        <Calendar className="mr-1 inline h-3 w-3" />
                        Schedule
                      </button>
                      <button
                        onClick={() => void handlePost(item.id)}
                        className="rounded-lg bg-atlas-teal px-2.5 py-1 text-[11px] font-semibold text-atlas-bg transition-opacity hover:opacity-90"
                      >
                        Post Now
                      </button>
                      <button
                        onClick={() => void handleArchive(item.id)}
                        className="rounded-lg border border-glass-border px-2.5 py-1 text-[11px] text-atlas-text-muted hover:border-red-400/30 hover:text-red-400"
                      >
                        <Archive className="mr-1 inline h-3 w-3" />
                        Archive
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Floating batch action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-2xl border border-glass-border bg-atlas-nav/95 px-5 py-3 shadow-xl backdrop-blur-xl">
          <span className="text-sm text-atlas-text">
            {selectedIds.size} selected
          </span>
          <button
            onClick={() => void handleBatchSchedule()}
            disabled={batchScheduling}
            className="rounded-lg bg-atlas-teal px-4 py-2 text-sm font-semibold text-atlas-bg transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {batchScheduling
              ? "Scheduling..."
              : `Schedule ${selectedIds.size} drafts`}
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="rounded-lg border border-glass-border px-3 py-2 text-xs text-atlas-text-muted hover:text-atlas-text"
          >
            Clear
          </button>
        </div>
      )}
    </AppShell>
  );
}

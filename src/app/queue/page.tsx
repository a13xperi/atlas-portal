"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Clock,
  Calendar,
  ListOrdered,
  Archive,
  PenTool,
  GripVertical,
  RotateCcw,
  CheckCircle2,
  X,
  Send,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import AppShell from "@/components/layout/AppShell";
import FeatureGate from "@/components/ui/FeatureGate";
import QueueTimeline from "@/components/queue/QueueTimeline";
import OracleInspector from "@/components/oracle/OracleInspector";
import type { InspectableEntity } from "@/lib/oracle-agent-types";
import { api, QueuedDraft } from "@/lib/api";

type FilterKey = "all" | "draft" | "scheduled" | "posted" | "failed" | "archived";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Drafts" },
  { key: "scheduled", label: "Scheduled" },
  { key: "posted", label: "Posted" },
  { key: "failed", label: "Failed" },
  { key: "archived", label: "Archived" },
];

function statusVariant(
  status: QueuedDraft["status"],
  failed?: boolean
): {
  label: string;
  className: string;
} {
  if (failed) {
    return {
      label: "Failed",
      className: "bg-red-500/15 text-red-400",
    };
  }
  switch (status) {
    case "POSTED":
      return {
        label: "Posted",
        className: "bg-atlas-success/15 text-atlas-success",
      };
    case "SCHEDULED":
      return {
        label: "Scheduled",
        className: "bg-atlas-teal/15 text-atlas-teal",
      };
    case "ARCHIVED":
      return {
        label: "Archived",
        className: "bg-atlas-text-muted/15 text-atlas-text-muted",
      };
    case "APPROVED":
      return {
        label: "Approved",
        className: "bg-atlas-warning/15 text-atlas-warning",
      };
    case "DRAFT":
    default:
      return {
        label: "Draft",
        className: "bg-glass-border/30 text-atlas-text-secondary",
      };
  }
}

function toLocalDateTimeInput(iso: string): string {
  const d = new Date(iso);
  // Format as yyyy-MM-ddTHH:mm in local time for <input type="datetime-local">
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* ---- Schedule picker popover ---- */
function SchedulePopover({
  initialAt,
  onCancel,
  onConfirm,
  busy,
}: {
  initialAt: string;
  onCancel: () => void;
  onConfirm: (iso: string) => void;
  busy?: boolean;
}) {
  const [value, setValue] = useState(() => toLocalDateTimeInput(initialAt));

  return (
    <div className="absolute right-0 top-full z-30 mt-2 w-64 rounded-xl border border-glass-border bg-atlas-nav p-3 shadow-xl backdrop-blur-xl">
      <p className="mb-2 text-[11px] font-medium text-atlas-text-secondary">
        Pick a date and time
      </p>
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full rounded-lg border border-glass-border bg-atlas-surface px-2 py-1.5 text-xs text-atlas-text focus:border-atlas-teal focus:outline-none"
      />
      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded-lg border border-glass-border px-2.5 py-1 text-[11px] text-atlas-text-muted hover:text-atlas-text"
        >
          Cancel
        </button>
        <button
          disabled={busy || !value}
          onClick={() => {
            const iso = new Date(value).toISOString();
            onConfirm(iso);
          }}
          className="rounded-lg bg-atlas-teal px-2.5 py-1 text-[11px] font-semibold text-atlas-bg transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Saving..." : "Confirm"}
        </button>
      </div>
    </div>
  );
}

/* ---- Sortable queue item ---- */
function SortableQueueItem({
  item,
  index,
  isSelected,
  draggable,
  onToggleSelect,
  onSchedule,
  onPost,
  onArchive,
  onInspect,
  formatTime,
}: {
  item: QueuedDraft;
  index: number;
  isSelected: boolean;
  draggable: boolean;
  onToggleSelect: (id: string) => void;
  onSchedule: (id: string, at: string) => Promise<void> | void;
  onPost: (id: string) => void;
  onArchive: (id: string) => void;
  onInspect: (id: string) => void;
  formatTime: (d: QueuedDraft) => string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: !draggable });

  const [pickerOpen, setPickerOpen] = useState(false);
  const [scheduling, setScheduling] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const timeLabel = formatTime(item);
  const status = statusVariant(item.status, item.failed);
  const isFirst = index === 0 && draggable;
  const isTerminal =
    item.status === "ARCHIVED" || item.failed || item.status === "POSTED";

  return (
    <div
      ref={setNodeRef}
      style={style}
      onMouseEnter={() => onInspect(item.id)}
      onFocus={() => onInspect(item.id)}
      tabIndex={0}
      className={`relative rounded-xl border bg-atlas-surface p-4 transition-colors hover:border-atlas-teal/30 focus:border-atlas-teal/50 focus:outline-none ${
        isFirst
          ? "border-2 border-atlas-teal/30 rounded-2xl p-6"
          : "border-glass-border"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {/* Drag handle */}
          {draggable && (
            <button
              {...attributes}
              {...listeners}
              className="mt-1 shrink-0 cursor-grab touch-none text-atlas-text-muted hover:text-atlas-teal active:cursor-grabbing"
              aria-label="Drag to reorder"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(item.id)}
            className="mt-1 h-4 w-4 shrink-0 accent-atlas-teal"
            aria-label="Select draft"
          />
          {/* Position number */}
          {draggable && (
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-atlas-teal/10 text-[11px] font-semibold text-atlas-teal">
              #{index + 1}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              {isFirst && (
                <span className="rounded bg-atlas-teal/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-atlas-teal">
                  Next up
                </span>
              )}
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${status.className}`}
              >
                {status.label}
              </span>
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
          {!isTerminal && (
            <div className="relative flex items-center gap-1.5">
              <button
                onClick={() => setPickerOpen((v) => !v)}
                className="rounded-lg border border-glass-border px-2.5 py-1 text-[11px] font-medium text-atlas-text-secondary transition-colors hover:border-atlas-teal hover:text-atlas-teal"
                aria-label="Pick schedule time"
              >
                <Calendar className="mr-1 inline h-3 w-3" />
                Schedule
              </button>
              <button
                onClick={() => onPost(item.id)}
                className="rounded-lg bg-atlas-teal px-2.5 py-1 text-[11px] font-semibold text-atlas-bg transition-opacity hover:opacity-90"
              >
                <Send className="mr-1 inline h-3 w-3" />
                Post Now
              </button>
              <button
                onClick={() => onArchive(item.id)}
                className="rounded-lg border border-glass-border px-2.5 py-1 text-[11px] text-atlas-text-muted hover:border-red-400/30 hover:text-red-400"
              >
                <Archive className="mr-1 inline h-3 w-3" />
                Archive
              </button>
              {pickerOpen && (
                <SchedulePopover
                  initialAt={item.suggestedAt}
                  busy={scheduling}
                  onCancel={() => setPickerOpen(false)}
                  onConfirm={async (iso) => {
                    setScheduling(true);
                    try {
                      await onSchedule(item.id, iso);
                      setPickerOpen(false);
                    } finally {
                      setScheduling(false);
                    }
                  }}
                />
              )}
            </div>
          )}
          {isTerminal && (
            <span className="text-[10px] text-atlas-text-muted">
              No actions
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function QueuePage() {
  const [queue, setQueue] = useState<QueuedDraft[]>([]);
  const [allDrafts, setAllDrafts] = useState<QueuedDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchScheduling, setBatchScheduling] = useState(false);
  const [batchArchiving, setBatchArchiving] = useState(false);
  const [showTimeline, setShowTimeline] = useState(true);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [isManualOrder, setIsManualOrder] = useState(false);
  // Which row Oracle is currently narrating. Tracks hover + keyboard
  // focus so the Inspector line updates as the user scans the queue.
  const [inspectedId, setInspectedId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const [{ queue: items }, draftRes] = await Promise.all([
        api.drafts.queue(),
        // Load all drafts to power Posted / Archived / Drafts filters
        api.drafts.list(),
      ]);
      setQueue(items ?? []);
      // Coerce TweetDraft list into QueuedDraft shape so a single render path works.
      const coerced: QueuedDraft[] = (draftRes.drafts ?? []).map((d) => ({
        ...d,
        _score: 0,
        suggestedAt: d.createdAt,
      }));
      setAllDrafts(coerced);
      setIsManualOrder(false);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load queue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  const handleSchedule = async (id: string, scheduledAt: string) => {
    await api.drafts.schedule(id, scheduledAt);
    setQueue((q) =>
      q.map((d) =>
        d.id === id
          ? { ...d, status: "SCHEDULED" as const, suggestedAt: scheduledAt }
          : d
      )
    );
    setAllDrafts((q) =>
      q.map((d) =>
        d.id === id
          ? { ...d, status: "SCHEDULED" as const, suggestedAt: scheduledAt }
          : d
      )
    );
  };

  const handlePost = async (id: string) => {
    await api.drafts.postToX(id);
    setQueue((q) => q.filter((d) => d.id !== id));
    setAllDrafts((q) =>
      q.map((d) => (d.id === id ? { ...d, status: "POSTED" as const } : d))
    );
  };

  const handleArchive = async (id: string) => {
    await api.drafts.update(id, { status: "ARCHIVED" });
    setQueue((q) => q.filter((d) => d.id !== id));
    setAllDrafts((q) =>
      q.map((d) => (d.id === id ? { ...d, status: "ARCHIVED" as const } : d))
    );
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
      setAllDrafts((q) =>
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

  const handleBatchArchive = async () => {
    setBatchArchiving(true);
    try {
      const ids = Array.from(selectedIds);
      await Promise.all(
        ids.map((id) => api.drafts.update(id, { status: "ARCHIVED" }))
      );
      setQueue((q) => q.filter((d) => !selectedIds.has(d.id)));
      setAllDrafts((q) =>
        q.map((d) =>
          selectedIds.has(d.id) ? { ...d, status: "ARCHIVED" as const } : d
        )
      );
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Batch archive failed:", err);
    } finally {
      setBatchArchiving(false);
    }
  };

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setQueue((prev) => {
      const oldIndex = prev.findIndex((d) => d.id === active.id);
      const newIndex = prev.findIndex((d) => d.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const reordered = arrayMove(prev, oldIndex, newIndex);
      // Persist to backend
      api.drafts
        .reorderQueue(reordered.map((d) => d.id))
        .catch((err) => console.error("Failed to persist reorder:", err));
      return reordered;
    });
    setIsManualOrder(true);
  }, []);

  const handleResetOrder = useCallback(async () => {
    try {
      await api.drafts.resetQueueOrder();
      const { queue: items } = await api.drafts.queue();
      setQueue(items ?? []);
      setIsManualOrder(false);
    } catch (err) {
      console.error("Failed to reset queue order:", err);
    }
  }, []);

  // Filter logic — "all" and "scheduled" use the ranked queue, every other
  // status pulls from the full draft list so users can manage the entire pipeline.
  const filteredQueue = useMemo(() => {
    if (filter === "all") return queue;
    if (filter === "scheduled")
      return queue.filter((d) => d.status === "SCHEDULED");
    if (filter === "draft")
      return allDrafts.filter(
        (d) => d.status === "DRAFT" || d.status === "APPROVED"
      );
    if (filter === "posted")
      return allDrafts.filter((d) => d.status === "POSTED" && !d.failed);
    if (filter === "failed")
      return allDrafts.filter((d) => d.failed);
    if (filter === "archived")
      return allDrafts.filter((d) => d.status === "ARCHIVED");
    return queue;
  }, [filter, queue, allDrafts]);

  const draggable = filter === "all";

  const activeDragItem = activeDragId
    ? filteredQueue.find((d) => d.id === activeDragId) ?? null
    : null;

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
            onClick={() => void loadQueue()}
            className="mt-4 rounded-lg border border-glass-border px-4 py-2 text-sm text-atlas-text-secondary transition-colors hover:border-atlas-teal hover:text-atlas-teal"
          >
            Retry
          </button>
        </div>
      </AppShell>
    );
  }

  const totalEmpty = queue.length === 0 && allDrafts.length === 0;

  /* ---------- Empty ---------- */
  if (totalEmpty) {
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
            Your ranked drafts, ready to schedule and post.
            {draggable ? " Drag to reorder." : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Reset to Auto */}
          {isManualOrder && draggable && (
            <button
              onClick={() => void handleResetOrder()}
              className="flex items-center gap-1 rounded-full border border-glass-border px-3 py-1 text-xs font-medium text-atlas-text-muted transition-colors hover:border-atlas-teal hover:text-atlas-teal"
            >
              <RotateCcw className="h-3 w-3" />
              Reset to Auto
            </button>
          )}
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
                  setSelectedIds(new Set(filteredQueue.map((d) => d.id)));
                }
              }}
              className="h-4 w-4 accent-atlas-teal"
            />
            Select all
          </label>
          <div className="mx-1 h-4 w-px bg-glass-border" />
          {/* Filter toggles */}
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => {
                setFilter(f.key);
                setSelectedIds(new Set());
              }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === f.key
                  ? "bg-atlas-teal/15 text-atlas-teal"
                  : "text-atlas-text-muted hover:text-atlas-text-secondary"
              }`}
            >
              {f.label}
            </button>
          ))}
          {/* Count badge */}
          <span className="rounded-full bg-atlas-teal/15 px-2 py-0.5 text-[10px] font-medium text-atlas-teal">
            {filteredQueue.length}
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

      {/* Oracle ambient narration — follows hover/focus across the queue
          list and renders a single line about the currently-inspected
          draft. The row's own focus ring doubles as the visual anchor. */}
      {(() => {
        const inspected = filteredQueue.find((d) => d.id === inspectedId)
          ?? filteredQueue[0];
        if (!inspected) return null;
        const inspectorEntity: InspectableEntity = {
          type: "draft",
          id: inspected.id,
          name: inspected.status === "SCHEDULED" ? "scheduled draft" : "draft",
          meta: {
            status: inspected.status,
            charCount: inspected.content?.length ?? 0,
            score:
              typeof inspected._score === "number"
                ? Math.min(1, Math.max(0, inspected._score))
                : undefined,
          },
        };
        return (
          <div className="mt-4">
            <OracleInspector entity={inspectorEntity} />
          </div>
        );
      })()}

      {/* Drag-sortable queue list */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={filteredQueue.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="mt-6 space-y-3">
            {filteredQueue.length === 0 ? (
              <div className="rounded-xl border border-glass-border bg-atlas-surface p-8 text-center text-sm text-atlas-text-muted">
                No drafts in this view.
              </div>
            ) : (
              filteredQueue.map((item, index) => (
                <SortableQueueItem
                  key={item.id}
                  item={item}
                  index={index}
                  isSelected={selectedIds.has(item.id)}
                  draggable={draggable}
                  onToggleSelect={toggleSelect}
                  onSchedule={handleSchedule}
                  onPost={handlePost}
                  onArchive={handleArchive}
                  onInspect={setInspectedId}
                  formatTime={formatTime}
                />
              ))
            )}
          </div>
        </SortableContext>

        {/* Drag overlay for visual feedback */}
        <DragOverlay>
          {activeDragItem ? (
            <div className="rounded-xl border-2 border-atlas-teal/50 bg-atlas-surface p-4 shadow-2xl">
              <div className="flex items-start gap-3">
                <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-atlas-teal" />
                <p className="text-sm leading-relaxed text-atlas-text">
                  {activeDragItem.content.length > 120
                    ? `${activeDragItem.content.slice(0, 120)}...`
                    : activeDragItem.content}
                </p>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Floating batch action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-glass-border bg-atlas-nav/95 px-5 py-3 shadow-xl backdrop-blur-xl">
          <CheckCircle2 className="h-4 w-4 text-atlas-teal" />
          <span className="text-sm text-atlas-text">
            {selectedIds.size} selected
          </span>
          <button
            onClick={() => void handleBatchSchedule()}
            disabled={batchScheduling || batchArchiving}
            className="rounded-lg bg-atlas-teal px-4 py-2 text-sm font-semibold text-atlas-bg transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {batchScheduling
              ? "Scheduling..."
              : `Schedule ${selectedIds.size}`}
          </button>
          <button
            onClick={() => void handleBatchArchive()}
            disabled={batchScheduling || batchArchiving}
            className="rounded-lg border border-glass-border px-3 py-2 text-sm text-atlas-text-secondary transition-colors hover:border-red-400/40 hover:text-red-400 disabled:opacity-50"
          >
            {batchArchiving ? "Archiving..." : `Archive ${selectedIds.size}`}
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="rounded-lg border border-glass-border px-3 py-2 text-xs text-atlas-text-muted hover:text-atlas-text"
            aria-label="Clear selection"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </AppShell>
  );
}

export default function QueuePageGated() {
  return (
    <FeatureGate flagKey="queue">
      <QueuePage />
    </FeatureGate>
  );
}

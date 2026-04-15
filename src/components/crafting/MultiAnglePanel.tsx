"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { Loader2, X, CheckCircle2, Sparkles } from "lucide-react";
import { api, type TweetDraft } from "@/lib/api";
import { TweetAngleCard, type AngleDraftItem } from "./TweetAngleCard";

const ANGLE_CONFIGS = [
  {
    label: "Contrarian",
    instruction:
      "Write a contrarian take that challenges the main narrative or consensus view in this report. Be sharp but credible.",
  },
  {
    label: "Bullish",
    instruction:
      "Write a bullish, optimistic take highlighting opportunities, upside, or positive implications from this report.",
  },
  {
    label: "Educational",
    instruction:
      "Write an educational tweet that explains the most important concept from this report simply and clearly.",
  },
  {
    label: "Data-led",
    instruction:
      "Write a data-led tweet focusing on the key numbers, statistics, or metrics from this report.",
  },
  {
    label: "Narrative",
    instruction:
      "Write a narrative-driven tweet that tells the story or human impact behind this report.",
  },
];

interface MultiAnglePanelProps {
  sourceContent: string;
  sourceType: string;
  blendId?: string | null;
  disabled?: boolean;
  onDraftsCreated?: () => void;
  onError?: (message: string) => void;
  onClose?: () => void;
}

export function MultiAnglePanel({
  sourceContent,
  sourceType,
  blendId,
  disabled = false,
  onDraftsCreated,
  onError,
  onClose,
}: MultiAnglePanelProps) {
  const [items, setItems] = useState<AngleDraftItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchApproving, setBatchApproving] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const titleId = useId();

  const generateAngles = useCallback(async () => {
    if (!sourceContent.trim()) return;

    setLoading(true);
    setSuccessCount(null);
    setItems([]);
    setSelectedIds(new Set());

    try {
      const results = await Promise.all(
        ANGLE_CONFIGS.map(async (config) => {
          const { draft } = await api.drafts.generate({
            sourceContent,
            sourceType,
            blendId: blendId || undefined,
            angleInstruction: config.instruction,
          });
          return {
            id: `${config.label}-${draft.id}`,
            draft,
            angleLabel: config.label,
            discarded: false,
          } as AngleDraftItem;
        })
      );
      setItems(results);
      // Auto-select all by default
      setSelectedIds(new Set(results.map((r) => r.id)));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to generate angle drafts";
      onError?.(message);
    } finally {
      setLoading(false);
    }
  }, [sourceContent, sourceType, blendId, onError]);

  useEffect(() => {
    void generateAngles();
  }, [generateAngles]);

  const activeItems = items.filter((i) => !i.discarded);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(activeItems.map((i) => i.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const updateItemContent = (id: string, content: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, draft: { ...item.draft, content } } : item
      )
    );
  };

  const discardItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, discarded: true } : item))
    );
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const approveItem = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    try {
      await api.drafts.update(item.draft.id, {
        content: item.draft.content,
        status: "APPROVED",
      });
      await api.drafts.enqueue(item.draft.id);
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, discarded: true } : i))
      );
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to approve draft";
      onError?.(message);
    }
  };

  const handleBatchApprove = async () => {
    if (selectedIds.size === 0) return;

    setBatchApproving(true);
    let approved = 0;

    try {
      const toApprove = items.filter(
        (i) => selectedIds.has(i.id) && !i.discarded
      );
      await Promise.all(
        toApprove.map(async (item) => {
          await api.drafts.update(item.draft.id, {
            content: item.draft.content,
            status: "APPROVED",
          });
          await api.drafts.enqueue(item.draft.id);
          approved++;
        })
      );

      setItems((prev) =>
        prev.map((i) =>
          selectedIds.has(i.id) ? { ...i, discarded: true } : i
        )
      );
      setSelectedIds(new Set());
      setSuccessCount(approved);
      onDraftsCreated?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Batch approval failed";
      onError?.(message);
    } finally {
      setBatchApproving(false);
    }
  };

  const allSelected =
    activeItems.length > 0 && activeItems.every((i) => selectedIds.has(i.id));

  return (
    <div className="mt-6 rounded-2xl border border-glass-border bg-atlas-surface p-5 sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 id={titleId} className="font-heading text-lg font-bold text-atlas-text">
            Multi-Angle Tweets
          </h3>
          <p className="text-sm text-atlas-text-secondary">
            {loading
              ? "Generating 5 different angles from your report…"
              : activeItems.length > 0
                ? `${activeItems.length} angle${activeItems.length !== 1 ? "s" : ""} ready. Edit, select, and approve.`
                : items.length > 0
                  ? "All drafts have been handled."
                  : "No angles generated yet."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!loading && activeItems.length > 0 && (
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-atlas-text-muted hover:text-atlas-text-secondary">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => (allSelected ? clearSelection() : selectAll())}
                className="h-4 w-4 accent-atlas-teal"
              />
              Select all
            </label>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-atlas-text-muted transition-colors hover:text-atlas-text"
            aria-label="Close panel"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {successCount !== null && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-atlas-teal/30 bg-atlas-teal/10 px-3 py-2 text-sm text-atlas-teal">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {successCount} draft{successCount !== 1 ? "s" : ""} approved and added to queue.
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ANGLE_CONFIGS.map((config) => (
            <div
              key={config.label}
              className="h-48 animate-pulse rounded-2xl border border-glass-border bg-atlas-surface/50"
              aria-hidden="true"
            >
              <div className="p-5">
                <div className="mb-3 h-5 w-20 rounded bg-atlas-nav" />
                <div className="space-y-2">
                  <div className="h-3 w-full rounded bg-atlas-nav" />
                  <div className="h-3 w-5/6 rounded bg-atlas-nav" />
                  <div className="h-3 w-4/6 rounded bg-atlas-nav" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <TweetAngleCard
              key={item.id}
              item={item}
              selected={selectedIds.has(item.id)}
              disabled={disabled || batchApproving}
              isApproving={batchApproving}
              onToggleSelect={() => toggleSelect(item.id)}
              onChangeContent={(content) => updateItemContent(item.id, content)}
              onApprove={() => void approveItem(item.id)}
              onDiscard={() => discardItem(item.id)}
            />
          ))}
        </div>
      )}

      {!loading && activeItems.length === 0 && items.length > 0 && (
        <div className="mt-6 text-center text-sm text-atlas-text-secondary">
          All angles approved or discarded.
          <button
            type="button"
            onClick={onClose}
            className="ml-2 text-atlas-teal hover:underline"
          >
            Close panel
          </button>
        </div>
      )}

      {/* Floating batch action bar */}
      {selectedIds.size > 0 && !loading && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-glass-border bg-atlas-nav/95 px-5 py-3 shadow-xl backdrop-blur-xl">
          <Sparkles className="h-4 w-4 text-atlas-teal" aria-hidden="true" />
          <span className="text-sm text-atlas-text">
            {selectedIds.size} selected
          </span>
          <button
            type="button"
            onClick={() => void handleBatchApprove()}
            disabled={batchApproving || disabled}
            className="rounded-lg bg-atlas-teal px-4 py-2 text-sm font-semibold text-atlas-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {batchApproving ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                Approving…
              </span>
            ) : (
              `Approve ${selectedIds.size} to Queue`
            )}
          </button>
          <button
            type="button"
            onClick={clearSelection}
            disabled={batchApproving}
            className="rounded-lg border border-glass-border px-3 py-2 text-xs text-atlas-text-muted transition-colors hover:text-atlas-text disabled:opacity-50"
            aria-label="Clear selection"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

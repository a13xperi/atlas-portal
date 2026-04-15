"use client";

import { useState, useMemo } from "react";
import { Plus, Clock } from "lucide-react";
import type { QueuedDraft } from "@/lib/api";

const PEAK_HOURS = [9, 10, 13, 14, 19, 20];
const HOUR_START = 8;
const HOUR_END = 22; // exclusive — 8am to 9pm

interface QueueCalendarProps {
  queue: QueuedDraft[];
  onSchedule: (id: string, at: string) => Promise<void>;
}

function formatHourLabel(hour: number): string {
  const suffix = hour >= 12 ? "pm" : "am";
  const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${h}${suffix}`;
}

function formatDayLabel(d: Date): string {
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function QueueCalendar({
  queue,
  onSchedule,
}: QueueCalendarProps) {
  const [schedulingCell, setSchedulingCell] = useState<{
    dayIdx: number;
    hour: number;
  } | null>(null);

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        d.setHours(0, 0, 0, 0);
        return d;
      }),
    []
  );

  const hours = useMemo(
    () => Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i),
    []
  );

  // Map drafts into day+hour buckets
  const buckets = useMemo(() => {
    const map = new Map<string, QueuedDraft[]>();
    for (const draft of queue) {
      if (!draft.suggestedAt && !draft.scheduledAt) continue;
      const dt = new Date(draft.scheduledAt ?? draft.suggestedAt);
      const dayStr = dt.toDateString();
      const hour = dt.getHours();
      if (hour < HOUR_START || hour >= HOUR_END) continue;
      const key = `${dayStr}::${hour}`;
      const arr = map.get(key) ?? [];
      arr.push(draft);
      map.set(key, arr);
    }
    return map;
  }, [queue]);

  // Pick a random queued (unscheduled) draft for the "+" button to schedule
  const unscheduledDrafts = useMemo(
    () =>
      queue.filter(
        (d) => d.status === "DRAFT" || d.status === "APPROVED"
      ),
    [queue]
  );

  const handleQuickSchedule = async (dayIdx: number, hour: number) => {
    const draft = unscheduledDrafts[0];
    if (!draft) return;
    const target = new Date(days[dayIdx]);
    target.setHours(hour, 0, 0, 0);
    await onSchedule(draft.id, target.toISOString());
    setSchedulingCell(null);
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-glass-border bg-atlas-surface">
      {/* Header row with day labels */}
      <div className="grid" style={{ gridTemplateColumns: `60px repeat(7, 1fr)` }}>
        {/* Top-left corner */}
        <div className="border-b border-r border-glass-border p-2" />
        {days.map((day, i) => (
          <div
            key={i}
            className="border-b border-glass-border p-2 text-center text-xs font-medium text-atlas-text-secondary"
          >
            {formatDayLabel(day)}
          </div>
        ))}

        {/* Hour rows */}
        {hours.map((hour) => {
          const isPeak = PEAK_HOURS.includes(hour);
          return (
            <div key={hour} className="contents">
              {/* Hour label */}
              <div className="flex items-start justify-end border-r border-glass-border pr-2 pt-1 text-[10px] text-atlas-text-muted">
                {formatHourLabel(hour)}
              </div>
              {/* Day cells */}
              {days.map((day, dayIdx) => {
                const key = `${day.toDateString()}::${hour}`;
                const drafts = buckets.get(key) ?? [];
                const isScheduling =
                  schedulingCell?.dayIdx === dayIdx &&
                  schedulingCell?.hour === hour;

                return (
                  <div
                    key={dayIdx}
                    className={`relative min-h-[40px] border-b border-glass-border p-1 transition-colors ${
                      isPeak ? "bg-atlas-teal/5" : ""
                    }`}
                  >
                    {drafts.length > 0 ? (
                      <div className="space-y-0.5">
                        {drafts.map((draft) => (
                          <div
                            key={draft.id}
                            className={`truncate rounded px-1.5 py-0.5 text-[10px] ${
                              draft.status === "SCHEDULED"
                                ? "bg-atlas-teal/15 text-atlas-teal"
                                : "bg-glass-border/30 text-atlas-text-secondary"
                            }`}
                            title={draft.content}
                          >
                            {draft.content.slice(0, 30)}
                            {draft.content.length > 30 ? "..." : ""}
                          </div>
                        ))}
                      </div>
                    ) : isPeak && unscheduledDrafts.length > 0 ? (
                      <>
                        {isScheduling ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                void handleQuickSchedule(dayIdx, hour)
                              }
                              className="rounded bg-atlas-teal px-1.5 py-0.5 text-[9px] font-semibold text-atlas-bg transition-opacity hover:opacity-90"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setSchedulingCell(null)}
                              className="text-[9px] text-atlas-text-muted hover:text-atlas-text"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              setSchedulingCell({ dayIdx, hour })
                            }
                            className="flex h-full w-full items-center justify-center text-atlas-text-muted opacity-0 transition-opacity hover:opacity-100"
                            aria-label={`Schedule at ${formatHourLabel(hour)}`}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        )}
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 border-t border-glass-border px-3 py-2">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-sm bg-atlas-teal/15" />
          <span className="text-[10px] text-atlas-text-muted">Peak hours</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-sm bg-atlas-teal/30" />
          <span className="text-[10px] text-atlas-text-muted">Scheduled</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-sm bg-glass-border/30" />
          <span className="text-[10px] text-atlas-text-muted">Suggested</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-2.5 w-2.5 text-atlas-text-muted" />
          <span className="text-[10px] text-atlas-text-muted">
            Times in ET
          </span>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Clock } from "lucide-react";
import { QueuedDraft } from "@/lib/api";

interface QueueTimelineProps {
  queue: QueuedDraft[];
}

const PEAK_HOURS = [9, 10, 13, 14, 19, 20]; // ET peak crypto twitter hours

export default function QueueTimeline({ queue }: QueueTimelineProps) {
  // Generate next 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  // Group scheduled items by day
  const getItemsForDay = (day: Date) => {
    return queue
      .filter((item) => {
        const itemDate = new Date(item.suggestedAt);
        return itemDate.toDateString() === day.toDateString();
      })
      .sort((a, b) => {
        const aTime = new Date(a.suggestedAt).getTime();
        const bTime = new Date(b.suggestedAt).getTime();
        return aTime - bTime;
      });
  };

  const formatDayLabel = (d: Date) => {
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
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const isPeakHour = (dateStr: string) => {
    const hour = new Date(dateStr).getHours();
    return PEAK_HOURS.includes(hour);
  };

  const totalScheduled = queue.filter(
    (q) => q.status === "SCHEDULED" || q.suggestedAt
  ).length;

  if (totalScheduled === 0) return null;

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <Clock className="h-4 w-4 text-atlas-teal" />
        <h3 className="text-sm font-semibold text-atlas-text">
          Publishing Timeline
        </h3>
        <span className="text-xs text-atlas-text-muted">Next 7 days</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {days.map((day) => {
          const items = getItemsForDay(day);
          return (
            <div
              key={day.toISOString()}
              className="flex min-w-[140px] shrink-0 flex-col rounded-xl border border-glass-border bg-atlas-surface p-3"
            >
              <p className="mb-2 text-xs font-medium text-atlas-text-secondary">
                {formatDayLabel(day)}
              </p>
              {items.length === 0 ? (
                <p className="text-[10px] italic text-atlas-text-muted">
                  No posts
                </p>
              ) : (
                <div className="space-y-1.5">
                  {items.map((item) => {
                    const timeStr = item.suggestedAt;
                    const peak = isPeakHour(timeStr);
                    return (
                      <div
                        key={item.id}
                        className={`rounded-lg px-2 py-1.5 text-[10px] ${
                          peak
                            ? "border border-atlas-teal/30 bg-atlas-teal/10"
                            : "border border-glass-border bg-glass/30"
                        }`}
                      >
                        <span
                          className={`font-medium ${
                            peak
                              ? "text-atlas-teal"
                              : "text-atlas-text-secondary"
                          }`}
                        >
                          {formatTime(timeStr)}
                        </span>
                        <p className="mt-0.5 truncate text-atlas-text-muted">
                          {item.content.slice(0, 40)}...
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Calendar, Clock, ListOrdered } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import FeatureGate from "@/components/ui/FeatureGate";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import { api, TweetDraft } from "@/lib/api";

function toLocalDateTimeInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function fromLocalDateTimeInput(value: string): string {
  return new Date(value).toISOString();
}

function getStatusBadge(status: TweetDraft["status"]) {
  switch (status) {
    case "APPROVED":
      return (
        <span className="rounded-full bg-atlas-warning/15 px-2 py-0.5 text-[10px] font-medium text-atlas-warning">
          Approved
        </span>
      );
    case "SCHEDULED":
      return (
        <span className="rounded-full bg-atlas-teal/15 px-2 py-0.5 text-[10px] font-medium text-atlas-teal">
          Scheduled
        </span>
      );
    case "POSTED":
      return (
        <span className="rounded-full bg-atlas-success/15 px-2 py-0.5 text-[10px] font-medium text-atlas-success">
          Posted
        </span>
      );
    case "ARCHIVED":
      return (
        <span className="rounded-full bg-atlas-text-muted/15 px-2 py-0.5 text-[10px] font-medium text-atlas-text-muted">
          Archived
        </span>
      );
    default:
      return (
        <span className="rounded-full bg-glass-border/30 px-2 py-0.5 text-[10px] font-medium text-atlas-text-secondary">
          Draft
        </span>
      );
  }
}

function QueuePage() {
  const [drafts, setDrafts] = useState<TweetDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [schedulingAll, setSchedulingAll] = useState(false);

  const loadDrafts = async () => {
    setLoading(true);
    try {
      const res = await api.drafts.list();
      setDrafts(res.drafts ?? []);
    } catch (e) {
      console.error("Failed to load drafts", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDrafts();
  }, []);

  const approvedDrafts = useMemo(() => {
    const approved = drafts.filter((d) => d.status === "APPROVED");
    return approved.sort((a, b) => {
      const aOrder = (a as TweetDraft & { sortOrder?: number }).sortOrder ?? 0;
      const bOrder = (b as TweetDraft & { sortOrder?: number }).sortOrder ?? 0;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
  }, [drafts]);

  const handleScheduleChange = async (id: string, value: string) => {
    const iso = fromLocalDateTimeInput(value);
    try {
      await api.drafts.update(id, { scheduledAt: iso });
      setDrafts((prev) =>
        prev.map((d) => (d.id === id ? { ...d, scheduledAt: iso } : d))
      );
    } catch (e) {
      console.error("Failed to update schedule", e);
    }
  };

  const handleScheduleAll = async () => {
    if (approvedDrafts.length === 0) return;
    setSchedulingAll(true);
    try {
      const slots = [9, 12, 17, 20];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      await Promise.all(
        approvedDrafts.map((draft, i) => {
          const dayOffset = Math.floor(i / slots.length);
          const hour = slots[i % slots.length];
          const scheduled = new Date(tomorrow);
          scheduled.setDate(scheduled.getDate() + dayOffset);
          scheduled.setHours(hour, 0, 0, 0);
          return api.drafts.update(draft.id, {
            scheduledAt: scheduled.toISOString(),
            status: "SCHEDULED",
          });
        })
      );

      await loadDrafts();
    } catch (e) {
      console.error("Failed to schedule all", e);
    } finally {
      setSchedulingAll(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-atlas-teal" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-extrabold tracking-tight text-atlas-text">
              Draft Queue
            </h1>
            <p className="mt-1 text-sm text-atlas-text-muted">
              Review, prioritize, and schedule your approved drafts.
            </p>
          </div>
          <GradientButton
            onClick={handleScheduleAll}
            disabled={schedulingAll || approvedDrafts.length === 0}
            size="sm"
          >
            <Calendar className="mr-1.5 h-4 w-4" />
            {schedulingAll ? "Scheduling..." : "Schedule All"}
          </GradientButton>
        </div>

        {/* Queue list */}
        {approvedDrafts.length === 0 ? (
          <GlassCard maxWidth="full" className="py-12 text-center">
            <ListOrdered className="mx-auto mb-3 h-8 w-8 text-atlas-text-muted" />
            <p className="text-sm text-atlas-text-secondary">
              No approved drafts in the queue.
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {approvedDrafts.map((draft) => {
              const rawEngagement = draft.predictedEngagement ?? 0;
              const engagementPct =
                rawEngagement > 1
                  ? Math.min(100, Math.round(rawEngagement))
                  : Math.round(rawEngagement * 100);

              return (
                <GlassCard
                  key={draft.id}
                  maxWidth="full"
                  className="space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 flex-1 text-sm leading-relaxed text-atlas-text">
                      {draft.content.length > 100
                        ? `${draft.content.slice(0, 100)}...`
                        : draft.content}
                    </p>
                    <div className="shrink-0">
                      {getStatusBadge(draft.status)}
                    </div>
                  </div>

                  {/* Engagement bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-atlas-text-muted">
                      <span>Predicted engagement</span>
                      <span>{engagementPct}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-atlas-surface">
                      <div
                        className="h-full rounded-full bg-atlas-teal transition-all"
                        style={{ width: `${Math.min(100, engagementPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Schedule picker */}
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-atlas-text-muted" />
                    <input
                      type="datetime-local"
                      value={toLocalDateTimeInput(draft.scheduledAt)}
                      onChange={(e) =>
                        void handleScheduleChange(draft.id, e.target.value)
                      }
                      className="rounded-lg border border-glass-border bg-atlas-surface px-2 py-1 text-xs text-atlas-text focus:border-atlas-teal focus:outline-none"
                    />
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>
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

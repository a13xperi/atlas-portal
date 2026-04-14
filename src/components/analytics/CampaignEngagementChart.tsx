"use client";

import { useId } from "react";
import { TweetDraft } from "@/lib/api";

interface CampaignEngagementChartProps {
  drafts: TweetDraft[];
}

interface DayPoint {
  date: string;
  dayLabel: string;
  engagement: number;
  impressions: number;
}

function formatDayLabel(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

function buildDayPoints(drafts: TweetDraft[]): DayPoint[] {
  const map = new Map<string, DayPoint>();
  const sorted = [...drafts].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  sorted.forEach((draft) => {
    const date = draft.postedAt?.slice(0, 10) || draft.createdAt.slice(0, 10);
    const existing = map.get(date);
    const engagement = draft.actualEngagement ?? draft.predictedEngagement ?? 0;
    // Use engagement as a proxy for impressions if not available; scale up for visual variety
    const impressions = Math.round(engagement * 12);

    if (existing) {
      existing.engagement += engagement;
      existing.impressions += impressions;
    } else {
      map.set(date, {
        date,
        dayLabel: formatDayLabel(date),
        engagement,
        impressions,
      });
    }
  });

  return Array.from(map.values());
}

export default function CampaignEngagementChart({ drafts }: CampaignEngagementChartProps) {
  const chartDescriptionId = useId();
  const points = buildDayPoints(drafts);
  const maxValue =
    points.length > 0
      ? Math.max(...points.flatMap((p) => [p.engagement, p.impressions]), 1)
      : 100;

  const chartSummary =
    points.length > 0
      ? `Campaign engagement over ${points.length} days. Highest value shown is ${maxValue.toLocaleString()}.`
      : "No engagement data yet. Post drafts to see campaign performance over time.";

  return (
    <section className="bg-atlas-surface border border-glass-border rounded-xl p-6 sm:p-8">
      <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-heading font-bold tracking-tight text-xl text-atlas-text">
          Impressions / Engagement
        </h2>
        {points.length > 0 && (
          <span className="text-xs text-atlas-teal bg-atlas-teal/10 px-2 py-1 rounded-full font-medium">
            {points.length} days
          </span>
        )}
      </div>
      <p className="text-sm text-atlas-text-secondary mb-6">
        Daily engagement and estimated impressions across the campaign.
      </p>

      <div
        role="img"
        aria-label={chartSummary}
        aria-describedby={chartDescriptionId}
        className="relative"
      >
        <div aria-hidden="true" className="min-w-[20rem]">
          <div className="relative h-48">
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-atlas-text-muted pr-2">
              <span>High</span>
              <span>Med</span>
              <span>Low</span>
            </div>
            <div className="ml-10 h-full flex items-end gap-0">
              {points.length > 0 ? (
                points.map((point) => (
                  <div key={point.date} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex h-40 items-end justify-center gap-1">
                      <div
                        className="w-3 rounded-t bg-atlas-teal/60"
                        style={{
                          height: `${(point.impressions / maxValue) * 100}%`,
                          minHeight: point.impressions > 0 ? "4px" : "0px",
                        }}
                        title={`Impressions: ${point.impressions.toLocaleString()}`}
                      />
                      <div
                        className="w-3 rounded-t bg-atlas-success"
                        style={{
                          height: `${(point.engagement / maxValue) * 100}%`,
                          minHeight: point.engagement > 0 ? "4px" : "0px",
                        }}
                        title={`Engagement: ${point.engagement.toLocaleString()}`}
                      />
                    </div>
                    <span className="text-[10px] text-atlas-text-muted">{point.dayLabel}</span>
                  </div>
                ))
              ) : (
                <p className="ml-2 text-sm italic text-atlas-text-muted">
                  No data yet. Post drafts to see campaign performance.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div id={chartDescriptionId} className="mt-4 flex flex-col gap-3 sm:flex-row sm:gap-6">
        <div className="flex items-center gap-2">
          <div aria-hidden="true" className="w-3 h-3 rounded-sm bg-atlas-teal/60" />
          <span className="text-xs text-atlas-text-secondary">Impressions (est.)</span>
        </div>
        <div className="flex items-center gap-2">
          <div aria-hidden="true" className="w-3 h-3 rounded-sm bg-atlas-success" />
          <span className="text-xs text-atlas-text-secondary">Engagement</span>
        </div>
      </div>
    </section>
  );
}

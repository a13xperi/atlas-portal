"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BarChart3, Loader2, Megaphone } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import FeatureGate from "@/components/ui/FeatureGate";
import GlassCard from "@/components/ui/GlassCard";
import CampaignEngagementChart from "@/components/analytics/CampaignEngagementChart";
import { useAuth } from "@/lib/auth";
import { api, Campaign, TweetDraft } from "@/lib/api";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 8 }, (_, i) => `${i * 3}-${i * 3 + 2}h`);

function CampaignAnalyticsPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user || !campaignId) return;
    try {
      const { campaign: data } = await api.campaigns.get(campaignId);
      setCampaign(data);
    } catch {
      setError("Campaign not found");
    } finally {
      setLoading(false);
    }
  }, [user, campaignId]);

  useEffect(() => {
    load();
  }, [load]);

  const drafts = useMemo(() => campaign?.drafts ?? [], [campaign]);

  const topDrafts = useMemo(() => {
    return [...drafts]
      .sort(
        (a, b) =>
          (b.actualEngagement ?? b.predictedEngagement ?? 0) -
          (a.actualEngagement ?? a.predictedEngagement ?? 0)
      )
      .slice(0, 5);
  }, [drafts]);

  const heatmapData = useMemo(() => {
    const grid = Array.from({ length: 7 }, () => Array.from({ length: 8 }, () => 0));
    drafts.forEach((draft) => {
      const dateStr = draft.postedAt || draft.scheduledAt || draft.createdAt;
      const date = new Date(dateStr);
      const day = date.getDay();
      const hour = date.getHours();
      const bucket = Math.floor(hour / 3);
      if (day >= 0 && day < 7 && bucket >= 0 && bucket < 8) {
        grid[day][bucket] += 1;
      }
    });
    const maxVal = Math.max(1, ...grid.flat());
    return { grid, maxVal };
  }, [drafts]);

  const funnel = useMemo(() => {
    const total = drafts.length;
    const approved = drafts.filter((d) => ["APPROVED", "SCHEDULED", "POSTED"].includes(d.status)).length;
    const scheduled = drafts.filter((d) => ["SCHEDULED", "POSTED"].includes(d.status)).length;
    const posted = drafts.filter((d) => d.status === "POSTED").length;
    return {
      stages: [
        { label: "Draft", count: total, color: "bg-atlas-text-muted" },
        { label: "Approved", count: approved, color: "bg-atlas-warning" },
        { label: "Scheduled", count: scheduled, color: "bg-atlas-teal" },
        { label: "Posted", count: posted, color: "bg-atlas-success" },
      ],
      total,
    };
  }, [drafts]);

  const totalEngagement = useMemo(
    () => drafts.reduce((sum, d) => sum + (d.actualEngagement ?? 0), 0),
    [drafts]
  );
  const totalPredicted = useMemo(
    () => drafts.reduce((sum, d) => sum + (d.predictedEngagement ?? 0), 0),
    [drafts]
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-8 font-body sm:px-6">
        <Link
          href={`/campaigns/${campaignId}`}
          className="mb-6 inline-flex items-center gap-1 text-sm text-atlas-text-muted transition-colors hover:text-atlas-teal"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Campaign
        </Link>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-atlas-teal" />
          </div>
        ) : error || !campaign ? (
          <GlassCard className="p-10 text-center">
            <p className="text-sm text-atlas-text-secondary">{error || "Campaign not found"}</p>
          </GlassCard>
        ) : (
          <>
            {/* Header */}
            <div className="mb-8 flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-atlas-teal/10">
                <BarChart3 className="h-6 w-6 text-atlas-teal" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <Megaphone className="h-5 w-5 text-atlas-teal" />
                  <h1 className="font-heading text-2xl font-bold tracking-tight text-atlas-text">
                    {campaign.name}
                  </h1>
                </div>
                <p className="mt-1 text-sm text-atlas-text-secondary">
                  Campaign analytics — performance, timing, and conversion.
                </p>
              </div>
            </div>

            {/* Summary stats */}
            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Posts", value: drafts.length },
                { label: "Posted", value: funnel.stages[3].count },
                { label: "Engagement", value: totalEngagement.toLocaleString() },
                { label: "Predicted", value: Math.round(totalPredicted).toLocaleString() },
              ].map((stat) => (
                <GlassCard key={stat.label} className="p-4" maxWidth="full">
                  <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-atlas-text-muted">
                    {stat.label}
                  </p>
                  <p className="mt-1 font-heading text-xl font-bold text-atlas-text">{stat.value}</p>
                </GlassCard>
              ))}
            </div>

            {/* Engagement chart */}
            <div className="mb-6">
              <CampaignEngagementChart drafts={drafts} />
            </div>

            {/* Top performing + Heatmap */}
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Top performing tweets */}
              <GlassCard className="p-5" maxWidth="full">
                <h3 className="mb-4 text-sm font-semibold text-atlas-text">Top Performing Tweets</h3>
                {topDrafts.length > 0 ? (
                  <div className="space-y-3">
                    {topDrafts.map((draft, i) => (
                      <div
                        key={draft.id}
                        className="flex items-start gap-3 rounded-xl border border-glass-border bg-atlas-bg/40 p-3"
                      >
                        <span
                          className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            i === 0 ? "bg-atlas-teal/20 text-atlas-teal" : "bg-atlas-surface text-atlas-text-muted"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm text-atlas-text">{draft.content}</p>
                          <p className="mt-1 text-[10px] text-atlas-text-muted">
                            {draft.actualEngagement != null
                              ? `${draft.actualEngagement.toLocaleString()} actual engagement`
                              : `${(draft.predictedEngagement ?? 0).toLocaleString()} predicted engagement`}
                            {" · "}
                            {draft.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-atlas-text-muted">
                    No drafts yet. Add posts to see top performers.
                  </p>
                )}
              </GlassCard>

              {/* Posting time heatmap */}
              <GlassCard className="p-5" maxWidth="full">
                <h3 className="mb-4 text-sm font-semibold text-atlas-text">Posting Time Heatmap</h3>
                {drafts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <div className="min-w-[20rem]">
                      {/* Header hours */}
                      <div className="grid grid-cols-9 gap-1">
                        <div className="text-[10px] text-atlas-text-muted" />
                        {HOURS.map((h) => (
                          <div key={h} className="text-center text-[10px] text-atlas-text-muted">
                            {h}
                          </div>
                        ))}
                      </div>
                      {/* Grid rows */}
                      {DAYS.map((day, dayIdx) => (
                        <div key={day} className="mt-1 grid grid-cols-9 gap-1">
                          <div className="text-[10px] text-atlas-text-muted py-1">{day}</div>
                          {HOURS.map((_, hourIdx) => {
                            const val = heatmapData.grid[dayIdx][hourIdx];
                            const intensity = heatmapData.maxVal > 0 ? val / heatmapData.maxVal : 0;
                            return (
                              <div
                                key={`${dayIdx}-${hourIdx}`}
                                className="h-6 rounded-sm"
                                style={{
                                  backgroundColor:
                                    intensity === 0
                                      ? "rgba(255,255,255,0.03)"
                                      : `rgba(78,205,196,${0.2 + intensity * 0.8})`,
                                }}
                                title={`${day} ${HOURS[hourIdx]}: ${val} posts`}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-atlas-text-muted">
                    No timing data yet. Post drafts to fill the heatmap.
                  </p>
                )}
              </GlassCard>
            </div>

            {/* Funnel conversion */}
            <GlassCard className="p-5" maxWidth="full">
              <h3 className="mb-4 text-sm font-semibold text-atlas-text">Funnel Conversion</h3>
              {funnel.total > 0 ? (
                <div className="space-y-4">
                  {funnel.stages.map((stage, idx) => {
                    const prevCount = idx > 0 ? funnel.stages[idx - 1].count : stage.count;
                    const pctOfTotal = funnel.total > 0 ? Math.round((stage.count / funnel.total) * 100) : 0;
                    const conversionRate =
                      idx > 0 && prevCount > 0 ? Math.round((stage.count / prevCount) * 100) : 100;
                    return (
                      <div key={stage.label} className="flex items-center gap-4">
                        <div className="w-20 shrink-0">
                          <p className="text-xs font-medium text-atlas-text">{stage.label}</p>
                          <p className="text-[10px] text-atlas-text-muted">
                            {stage.count} ({pctOfTotal}%)
                          </p>
                        </div>
                        <div className="flex-1">
                          <div className="relative h-3 overflow-hidden rounded-full bg-atlas-surface">
                            <div
                              className={`h-full rounded-full ${stage.color}`}
                              style={{ width: `${pctOfTotal}%` }}
                            />
                          </div>
                        </div>
                        {idx > 0 && (
                          <div className="w-16 shrink-0 text-right">
                            <p className="text-xs font-bold text-atlas-teal">{conversionRate}%</p>
                            <p className="text-[10px] text-atlas-text-muted">conv.</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-atlas-text-muted">
                  No funnel data yet. Add drafts to see conversion from draft to posted.
                </p>
              )}
            </GlassCard>
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function CampaignAnalyticsPageGated() {
  return (
    <FeatureGate flagKey="campaigns">
      <CampaignAnalyticsPage />
    </FeatureGate>
  );
}

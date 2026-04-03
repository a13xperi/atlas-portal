"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import AppShell from "@/components/layout/AppShell";
import { Skeleton } from "@/components/ui/Skeleton";
import Link from "next/link";
import { api, AnalyticsSummary, LearningLogEntry, TweetDraft, DailyEngagement, DailyActivity } from "@/lib/api";

const EngagementVelocityChart = dynamic(
  () => import("@/components/analytics/EngagementVelocityChart"),
  {
    loading: () => (
      <div className="h-48 rounded-2xl bg-atlas-surface animate-pulse" />
    ),
    ssr: false,
  }
);

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [logEntries, setLogEntries] = useState<LearningLogEntry[]>([]);
  const [topDrafts, setTopDrafts] = useState<TweetDraft[]>([]);
  const [engagementDays, setEngagementDays] = useState<DailyEngagement[]>([]);
  const [activityDays, setActivityDays] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const errors: string[] = [];
    Promise.all([
      api.analytics.summary().then((r) => setSummary(r.summary ?? null)).catch((e: Error) => { errors.push(e.message); }),
      api.analytics.learningLog().then((r) => setLogEntries(r.entries ?? [])).catch(() => {}),
      api.drafts.list().then((r) => setTopDrafts((r.drafts ?? []).slice(0, 4))).catch(() => {}),
      api.analytics.engagementDaily().then((r) => setEngagementDays(r.days ?? [])).catch(() => {}),
      api.analytics.activityDaily().then((r) => setActivityDays(r.days ?? [])).catch(() => {}),
    ])
      .then(() => { if (errors.length > 0) setError(errors[0]); })
      .finally(() => setLoading(false));
  }, []);

  const handleExportPDF = () => {
    const printContent = document.getElementById("analytics-content");

    if (!printContent) {
      return;
    }

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Atlas Analytics Report</title>
          <style>
            body { font-family: Inter, sans-serif; color: #1a1a2e; padding: 40px; }
            h1 { font-family: 'Playfair Display', serif; }
            .stat { display: inline-block; margin: 0 24px 16px 0; }
            .stat-value { font-size: 24px; font-weight: bold; }
            .stat-label { font-size: 12px; color: #718096; }
          </style>
        </head>
        <body>
          <h1>Atlas Analytics Report</h1>
          <p>Generated: ${new Date().toLocaleDateString()}</p>
          <hr/>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const activityCounts = activityDays.map((day) => day.count);
  const activityMax = activityCounts.length > 0 ? Math.max(...activityCounts) : 0;

  const usageStats = summary
    ? [
        { label: "Drafts", value: String(summary.draftsCreated) },
        { label: "Feedback", value: String(summary.feedbackGiven) },
        { label: "Refinements", value: String(summary.refinements) },
        { label: "Ingested", value: String(summary.reportsIngested) },
      ]
    : [
        { label: "Drafts", value: "0" },
        { label: "Feedback", value: "0" },
        { label: "Refinements", value: "0" },
        { label: "Ingested", value: "0" },
      ];

  const allZero = usageStats.every((s) => s.value === "0");
  const hasNoAnalyticsData = !loading
    && !error
    && !summary
    && engagementDays.length === 0
    && activityDays.length === 0
    && logEntries.length === 0
    && topDrafts.length === 0;

  if (hasNoAnalyticsData) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <h2 className="font-heading text-2xl text-atlas-text">No analytics data yet</h2>
          <p className="mt-2 text-atlas-text-secondary">Start crafting drafts to see your analytics here.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div id="analytics-content">
        {error && (
          <div role="alert" className="mb-6 px-4 py-3 bg-atlas-error/10 border border-atlas-error/30 rounded-xl text-atlas-error text-sm">
            {error}
          </div>
        )}

        {/* SECTION 1: Header */}
        <div className="mb-6">
          <h1 className="font-heading text-3xl text-atlas-text">
            Your Analytics
          </h1>
          <p className="text-atlas-text-secondary mt-1">
            Deep performance metrics and predictive intelligence.
          </p>
        </div>

        {/* SECTION 2: Usage Insight */}
        <div className="mb-6 rounded-xl border border-glass-border bg-atlas-surface p-6 sm:p-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="text-center space-y-2">
                    <Skeleton className="h-3 w-16 mx-auto" />
                    <Skeleton className="h-8 w-10 mx-auto" />
                  </div>
                ))
              : usageStats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-xs text-atlas-text-secondary uppercase tracking-wide">
                      {stat.label}
                    </p>
                    <p className="font-heading text-3xl text-atlas-text mt-1">
                      {stat.value}
                    </p>
                  </div>
                ))}
          </div>
          {/* Sparkline */}
          {activityDays.length > 0 ? (() => {
            const sparkData = activityDays ?? [];
            return (
              <div className="mt-6 h-8 flex items-end gap-1">
                {sparkData.map((d, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-sm ${d.count > 0 ? "bg-atlas-teal/40" : ""}`}
                    style={{ height: d.count > 0 && activityMax > 0 ? `${(d.count / activityMax) * 100}%` : "0px" }}
                  />
                ))}
              </div>
            );
          })() : (
            <div className="mt-6 h-8 flex items-center justify-center">
              <p className="text-xs text-atlas-text-muted">Activity data will appear as you create drafts</p>
            </div>
          )}
          <p className="text-atlas-text-muted text-sm italic mt-3">
            {allZero
              ? "Head to the Crafting Station to create your first draft — your analytics will populate as you go."
              : "The more you use Atlas, the better it gets."}
          </p>
        </div>

        {/* SECTION 3: Engagement Chart (Hero) */}
        <EngagementVelocityChart engagementDays={engagementDays} />

        {/* SECTION 4: Confidence Trend + Model Reliability */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-atlas-surface border border-glass-border rounded-xl p-6">
            <p className="text-[10px] text-atlas-text-secondary uppercase tracking-wide mb-1">
              Confidence Trend
            </p>
            <h3 className="font-heading text-lg text-atlas-text">
              Model Reliability
            </h3>
            <div className="mt-4 h-20 flex items-end gap-0.5">
              {(logEntries ?? []).length > 0 ? (logEntries ?? []).slice(-20).map(
                (entry, i) => {
                  const score = entry.positive ? 70 + (i * 1.5) : 30 + (i * 1.5);
                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-t ${entry.positive ? "bg-atlas-teal" : "bg-atlas-warning"}`}
                      style={{ height: `${Math.min(score, 100)}%` }}
                    />
                  );
                }
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-xs text-atlas-text-muted italic">Confidence data builds as you create and refine drafts</p>
                </div>
              )}
            </div>
          </div>
          <div className="bg-atlas-surface border border-glass-border rounded-xl p-6 flex items-center">
            {(logEntries ?? []).length > 0 ? (
              <p className="font-heading text-base text-atlas-text italic leading-relaxed">
                {(logEntries ?? []).filter((e) => e.positive).length} positive signals detected across your recent activity.
              </p>
            ) : (
              <p className="font-heading text-base text-atlas-text-muted italic leading-relaxed">
                Model insights will appear here as your usage history grows.
              </p>
            )}
          </div>
        </div>

        {/* SECTION 5: Top Tweets */}
        <div className="mb-6">
          <h2 className="font-heading text-xl text-atlas-text mb-4 flex items-center gap-3">
            <span className="w-1 h-6 bg-atlas-teal rounded-full" />
            Top Performance Assets
          </h2>
          <div className="bg-atlas-surface border border-glass-border rounded-xl overflow-hidden">
            <div className="hidden sm:grid grid-cols-[1fr_100px_80px] px-6 py-3 border-b border-glass-border">
              <span className="text-xs text-atlas-text-secondary font-medium">
                Snippet
              </span>
              <span className="text-xs text-atlas-text-secondary font-medium">
                Engagement
              </span>
              <span className="text-xs text-atlas-text-secondary font-medium">
                Status
              </span>
            </div>
            {topDrafts.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-sm text-atlas-text-muted">No top drafts yet. Create and post drafts to see your best performers here.</p>
              </div>
            ) : (topDrafts ?? []).map((d) => (
              <Link
                key={d.id}
                href={`/crafting?draft=${d.id}`}
                className="flex flex-col sm:grid sm:grid-cols-[1fr_100px_80px] px-4 sm:px-6 py-4 border-b border-glass-border last:border-0 hover:bg-glass cursor-pointer transition-colors gap-1 sm:gap-0"
              >
                <span className="text-sm text-atlas-text truncate pr-4">
                  {d.content.slice(0, 80)}{d.content.length > 80 ? "..." : ""}
                </span>
                <span className="text-sm text-atlas-teal font-medium">
                  {d.predictedEngagement
                    ? `${(d.predictedEngagement / 1000).toFixed(1)}k`
                    : "—"}
                </span>
                <span
                  className={`text-xs font-medium ${
                    d.status.toLowerCase() === "posted"
                      ? "text-atlas-success"
                      : "text-atlas-teal"
                  }`}
                >
                  {d.status.toLowerCase()}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* SECTION 6: Learning Log */}
        <div className="mb-6 rounded-xl border border-glass-border bg-atlas-surface p-6 sm:p-8">
          <h2 className="font-heading text-xl text-atlas-text mb-6">
            Model Learning Log
          </h2>
          <div className="space-y-4">
            {(logEntries ?? []).length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-atlas-text-muted">No learning events yet. The model logs adjustments as you provide feedback on drafts.</p>
              </div>
            ) : null}
            {((logEntries ?? []).length > 0
              ? (logEntries ?? []).map((e) => ({
                  date: new Date(e.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  }),
                  event: e.event,
                  impact: e.impact,
                  positive: e.positive,
                }))
              : []
            ).map((entry, i) => (
              <div
                key={i}
                className="flex flex-col items-start gap-3 border-b border-glass-border py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                  <span className="text-[10px] text-atlas-text-muted sm:w-32 shrink-0">
                    {entry.date}
                  </span>
                  <span className="text-sm text-atlas-text font-medium">
                    {entry.event}
                  </span>
                </div>
                <span
                  className={`text-sm font-bold shrink-0 ${
                    entry.positive ? "text-atlas-success" : "text-atlas-error"
                  }`}
                >
                  {entry.impact}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 7: Time-to-Peak / Growth Velocity */}
        <div className="bg-atlas-nav border border-glass-border rounded-xl p-8 mb-6">
          <h2 className="font-heading text-xl text-atlas-text mb-6">
            Growth Velocity
          </h2>
          {(() => {
            const totalDrafts = summary?.draftsCreated ?? 0;
            const totalFeedback = summary?.feedbackGiven ?? 0;
            const totalRefinements = summary?.refinements ?? 0;
            const totalActivity = totalDrafts + totalFeedback + totalRefinements;
            const progressPct = totalActivity > 0 ? Math.min(Math.round((totalActivity / 50) * 100), 100) : 0;

            return (
              <>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative h-3 bg-atlas-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-atlas-teal rounded-full transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between mt-3">
                  <div className="text-center">
                    <p className="text-[10px] text-atlas-text-muted">Drafts</p>
                    <p className="text-[10px] text-atlas-text font-bold">{totalDrafts}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-atlas-text-muted">Refinements</p>
                    <p className="text-[10px] text-atlas-text font-bold">{totalRefinements}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-atlas-text-muted">Total Activity</p>
                    <p className="text-[10px] text-atlas-text font-bold">{totalActivity}</p>
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        {/* SECTION 8: Footer */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 pt-4">
          <span className="text-sm text-atlas-text-secondary">
            Page 10 of Atlas System
          </span>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleExportPDF}
              className="text-sm text-atlas-text-secondary font-medium hover:text-atlas-text transition-colors"
            >
              Export PDF
            </button>
            <button
              type="button"
              className="text-sm text-atlas-text-secondary font-medium hover:text-atlas-text transition-colors"
            >
              Share Report
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

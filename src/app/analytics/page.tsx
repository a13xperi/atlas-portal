"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import AppShell from "@/components/layout/AppShell";
import FeatureGate from "@/components/ui/FeatureGate";
import { Skeleton } from "@/components/ui/Skeleton";
import { api, AnalyticsSummary, LearningLogEntry, TweetDraft, DailyEngagement, DailyActivity } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const EngagementVelocityChart = dynamic(
  () => import("@/components/analytics/EngagementVelocityChart"),
  {
    loading: () => (
      <div className="h-48 rounded-2xl bg-atlas-surface animate-pulse" />
    ),
    ssr: false,
  }
);

function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [logEntries, setLogEntries] = useState<LearningLogEntry[]>([]);
  const [topDrafts, setTopDrafts] = useState<TweetDraft[]>([]);
  const [engagementDays, setEngagementDays] = useState<DailyEngagement[]>([]);
  const [activityDays, setActivityDays] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;
    setLoading(true);
    setError(null);
    const errors: string[] = [];
    Promise.all([
      api.analytics.summary().then((r) => setSummary(r.summary ?? null)).catch((e: Error) => { errors.push(e.message); }),
      api.analytics.learningLog().then((r) => setLogEntries(r.entries ?? [])).catch(() => {}),
      api.analytics.engagementDaily().then((r) => setEngagementDays(r.days ?? [])).catch(() => {}),
      api.analytics.activityDaily().then((r) => setActivityDays(r.days ?? [])).catch(() => {}),
    ])
      .then(() => { if (errors.length > 0) setError(errors[0]); })
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  useEffect(() => {
    if (authLoading || !user) return;
    api.drafts.list("POSTED")
      .then((res) => {
        const sorted = (res.drafts ?? [])
          .filter((draft) => draft.actualEngagement != null)
          .sort((a, b) => (b.actualEngagement ?? 0) - (a.actualEngagement ?? 0))
          .slice(0, 3);
        setTopDrafts(sorted);
      })
      .catch(() => {});
  }, [user, authLoading]);

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
            body { font-family: Inter, sans-serif; color: #010411; padding: 40px; }
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

  // When the analytics API reports zero drafts but we can confirm posted drafts exist from
  // the drafts endpoint, use the known count as a floor. The analytics_events table can
  // lag behind the drafts table, causing the summary to show 0 while the detail table has data.
  const knownPostedCount = topDrafts.length;
  const usageStats = summary
    ? [
        { label: "Drafts", value: String(summary.draftsCreated > 0 ? summary.draftsCreated : knownPostedCount), href: "/crafting" },
        { label: "Feedback", value: String(summary.feedbackGiven), href: "/dashboard" },
        { label: "Refinements", value: String(summary.refinements ?? 0), href: "/voice-profiles" },
        { label: "Ingested", value: String(summary.reportsIngested), href: "/alerts" },
      ]
    : [
        { label: "Drafts", value: String(knownPostedCount), href: "/crafting" },
        { label: "Feedback", value: "0", href: "/dashboard" },
        { label: "Refinements", value: "0", href: "/voice-profiles" },
        { label: "Ingested", value: "0", href: "/alerts" },
      ];

  const allZero = usageStats.every((s) => s.value === "0");
  const hasNoAnalyticsData = !loading
    && !error
    && !summary
    && engagementDays.length === 0
    && activityDays.length === 0
    && logEntries.length === 0
    && topDrafts.length === 0;
  const latestActivityCount =
    activityDays.length > 0 ? activityDays[activityDays.length - 1]?.count ?? 0 : 0;
  const activitySparklineSummary =
    activityDays.length > 0
      ? `Activity over ${activityDays.length} days. Peak day had ${activityMax} actions and the latest day had ${latestActivityCount}.`
      : "No activity data yet. Activity data will appear as you create drafts.";
  const recentLogEntries = logEntries.slice(-20);
  const positiveSignalCount = logEntries.filter((entry) => entry.positive).length;
  const confidenceTrendSummary =
    recentLogEntries.length > 0
      ? `Confidence trend across ${recentLogEntries.length} recent learning events. ${positiveSignalCount} positive signals detected so far.`
      : "No confidence data yet. Confidence data builds as you create and refine drafts.";

  if (hasNoAnalyticsData) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <h2 className="font-heading font-bold tracking-tight text-2xl text-atlas-text">No analytics data yet</h2>
          <p className="mt-2 text-atlas-text-secondary">Start crafting drafts to see your analytics here.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div id="analytics-content" aria-busy={loading}>
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-6 px-4 py-3 bg-atlas-error/10 border border-atlas-error/30 rounded-xl text-atlas-error text-sm"
          >
            {error}
          </div>
        )}

        {/* SECTION 1: Header */}
        <div className="mb-8">
          <h1 className="font-heading font-extrabold tracking-tight text-3xl text-atlas-text">
            Your Analytics
          </h1>
          <p className="text-atlas-text-secondary mt-2 max-w-2xl text-sm leading-relaxed">
            Track how Atlas learns your voice over time. The charts below show how accurately Atlas predicts your tweet engagement, how your writing style is evolving, and where your best-performing content comes from. The more you draft and give feedback, the sharper these predictions get.
          </p>
        </div>

        {/* SECTION 2: Usage Insight */}
        <div data-tour="analytics-summary" className="mb-6 rounded-xl border border-glass-border bg-atlas-surface p-6 sm:p-8">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="text-center space-y-2">
                    <Skeleton className="h-3 w-16 mx-auto" />
                    <Skeleton className="h-8 w-10 mx-auto" />
                  </div>
                ))
              : usageStats.map((stat) => (
                  <Link
                    key={stat.label}
                    href={stat.href}
                    className="text-center rounded-xl p-3 -m-3 transition-colors hover:bg-white/[0.04] cursor-pointer group"
                  >
                    <p className="text-xs text-atlas-text-secondary uppercase tracking-wide group-hover:text-atlas-teal transition-colors">
                      {stat.label}
                    </p>
                    <p className="font-heading font-extrabold text-3xl text-atlas-text mt-1 group-hover:text-atlas-teal transition-colors">
                      {stat.value}
                    </p>
                  </Link>
                ))}
          </div>
          {/* Sparkline */}
          {activityDays.length > 0 ? (() => {
            const sparkData = activityDays ?? [];
            return (
              <div
                role="img"
                aria-label={activitySparklineSummary}
                className="mt-6 h-8 flex items-end gap-1"
              >
                {sparkData.map((d, i) => (
                  <div
                    key={i}
                    aria-hidden="true"
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
        <div className="relative">
          <div className="w-full overflow-x-auto">
            <div className="min-w-[22rem] sm:min-w-0">
              <EngagementVelocityChart engagementDays={engagementDays} />
            </div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-atlas-bg to-transparent pointer-events-none sm:hidden" />
        </div>

        {/* SECTION 4: Confidence Trend + Model Reliability */}
        <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-2">
          <div className="bg-atlas-surface border border-glass-border rounded-xl p-6">
            <p className="text-[10px] text-atlas-text-secondary uppercase tracking-wide mb-1">
              Confidence Trend
            </p>
            <h3 className="font-heading font-semibold text-lg text-atlas-text">
              Model Reliability
            </h3>
            <div
              role="img"
              aria-label={confidenceTrendSummary}
              className="mt-4 h-20 flex items-end gap-0.5"
            >
              {(logEntries ?? []).length > 0 ? (logEntries ?? []).slice(-20).map(
                (entry, i) => {
                  const score = entry.positive ? 70 + (i * 1.5) : 30 + (i * 1.5);
                  return (
                    <div
                      key={i}
                      aria-hidden="true"
                      className={`flex-1 rounded-t ${entry.positive ? "bg-atlas-teal" : "bg-atlas-warning"}`}
                      style={{ height: `${Math.min(score, 100)}%`, minHeight: "32px" }}
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
              <p className="font-heading font-medium text-base text-atlas-text italic leading-relaxed">
                {(logEntries ?? []).filter((e) => e.positive).length} positive signals detected across your recent activity.
              </p>
            ) : (
              <p className="font-heading font-medium text-base text-atlas-text-muted italic leading-relaxed">
                Model insights will appear here as your usage history grows.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-glass-border bg-atlas-surface p-4">
          <h3 className="mb-3 text-sm font-medium text-atlas-text">Top Performing Drafts</h3>
          {topDrafts.length > 0 ? (
            <div className="space-y-3">
              {topDrafts.map((draft, i) => (
                <Link
                  key={draft.id}
                  href="/crafting"
                  aria-label={`Top draft ${i + 1}: open Crafting Station`}
                  className="flex items-start gap-3 rounded-xl p-2 -m-2 transition-colors hover:bg-white/[0.04] focus:outline-none focus:ring-2 focus:ring-atlas-teal"
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
                      {draft.actualEngagement} engagements
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm text-atlas-text-muted">
                Top drafts will appear here once your posted tweets accumulate engagement.
              </p>
              <Link
                href="/crafting"
                className="mt-3 inline-block text-xs font-medium text-atlas-teal hover:text-atlas-teal/80 transition-colors"
              >
                Head to the Crafting Station →
              </Link>
            </div>
          )}
        </div>

        {/* SECTION 6: Learning Log */}
        <div data-tour="analytics-learning" className="mb-6 rounded-xl border border-glass-border bg-atlas-surface p-6 sm:p-8">
          <h2 className="font-heading font-bold tracking-tight text-xl text-atlas-text mb-6">
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
          <h2 className="font-heading font-bold tracking-tight text-xl text-atlas-text mb-6">
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
                  <div
                    className="flex-1 relative h-3 bg-atlas-surface rounded-full overflow-hidden"
                    role="progressbar"
                    aria-label="Growth velocity progress"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progressPct}
                  >
                    <div
                      aria-hidden="true"
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
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:gap-4">
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

export default function AnalyticsPageGated() {
  return (
    <FeatureGate flagKey="analytics_advanced">
      <AnalyticsPage />
    </FeatureGate>
  );
}

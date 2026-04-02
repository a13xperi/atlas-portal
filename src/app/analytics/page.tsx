"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/auth";
import { api, AnalyticsSummary, LearningLogEntry, TweetDraft, DailyEngagement, DailyActivity } from "@/lib/api";

export default function AnalyticsPage() {
  const { user } = useAuth();
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
    Promise.all([
      api.analytics.summary().then((r) => setSummary(r.summary)),
      api.analytics.learningLog().then((r) => setLogEntries(r.entries)),
      api.drafts.list().then((r) => setTopDrafts(r.drafts.slice(0, 4))),
      api.analytics.engagementDaily().then((r) => setEngagementDays(r.days)),
      api.analytics.activityDaily().then((r) => setActivityDays(r.days)),
    ])
      .catch((err: Error) => setError(err.message || "Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  const chartMax = engagementDays.length > 0
    ? Math.max(...engagementDays.flatMap((d) => [d.predicted, d.actual]), 1)
    : 100;

  const accuracyPct = engagementDays.length > 0
    ? Math.round(
        (1 -
          engagementDays.reduce((sum, d) => {
            const maxVal = Math.max(d.predicted, d.actual, 1);
            return sum + Math.abs(d.predicted - d.actual) / maxVal;
          }, 0) /
            engagementDays.length) *
          100
      )
    : null;

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

  return (
    <AppShell>
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
      <div className="bg-atlas-surface border border-glass-border rounded-xl p-8 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
          const sparkData = activityDays;
          const maxCount = Math.max(...sparkData.map((a) => a.count), 1);
          return (
            <div className="mt-6 h-8 flex items-end gap-1">
              {sparkData.map((d, i) => (
                <div
                  key={i}
                  className="flex-1 bg-atlas-teal/40 rounded-sm"
                  style={{ height: `${(d.count / maxCount) * 100}%` }}
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
      <div className="bg-atlas-surface border border-glass-border rounded-xl p-8 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-heading text-xl text-atlas-text">
            Engagement Velocity
          </h2>
          {accuracyPct !== null && (
            <span className="text-xs text-atlas-success bg-atlas-success/10 px-2 py-1 rounded-full font-medium">
              {accuracyPct}% Accuracy
            </span>
          )}
        </div>
        <p className="text-sm text-atlas-text-secondary mb-6">
          Actual performance against neural prediction models.
        </p>

        {/* Chart area */}
        <div className="relative h-48">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-atlas-text-muted pr-2">
            <span>High</span>
            <span>Med</span>
            <span>Low</span>
          </div>
          {/* Chart body */}
          <div className="ml-10 h-full flex items-end gap-0">
            {engagementDays.length > 0 ? (
              engagementDays.map((day) => (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center gap-1 h-40">
                    <div
                      className="w-3 bg-atlas-teal/60 rounded-t"
                      style={{ height: `${(day.predicted / chartMax) * 100}%` }}
                      title={`Predicted: ${day.predicted}`}
                    />
                    <div
                      className="w-3 bg-atlas-success rounded-t"
                      style={{ height: `${(day.actual / chartMax) * 100}%` }}
                      title={`Actual: ${day.actual}`}
                    />
                  </div>
                  <span className="text-[10px] text-atlas-text-muted">{day.dayLabel}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-atlas-text-muted italic ml-2">No engagement data yet. Create and post drafts to see predictions vs actuals.</p>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-atlas-teal/60" />
            <span className="text-xs text-atlas-text-secondary">Predicted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-atlas-success" />
            <span className="text-xs text-atlas-text-secondary">Actual</span>
          </div>
        </div>
      </div>

      {/* SECTION 4: Confidence Trend + Model Reliability */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-atlas-surface border border-glass-border rounded-xl p-6">
          <p className="text-[10px] text-atlas-text-secondary uppercase tracking-wide mb-1">
            Confidence Trend
          </p>
          <h3 className="font-heading text-lg text-atlas-text">
            Model Reliability
          </h3>
          {/* Trend line placeholder */}
          <div className="mt-4 h-20 flex items-end gap-0.5">
            {[30, 35, 32, 40, 45, 50, 48, 55, 58, 62, 60, 65, 70, 72, 78, 80, 82, 85, 88, 90].map(
              (v, i) => (
                <div
                  key={i}
                  className="flex-1 bg-atlas-teal rounded-t"
                  style={{ height: `${v}%` }}
                />
              )
            )}
          </div>
        </div>
        <div className="bg-atlas-surface border border-glass-border rounded-xl p-6 flex items-center">
          <p className="font-heading text-base text-atlas-text italic leading-relaxed">
            &ldquo;Your editorial flow has reached the 90th percentile of
            efficient creators.&rdquo;
          </p>
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
          {(topDrafts.length > 0
            ? topDrafts.map((d) => ({
                snippet: d.content.slice(0, 80) + (d.content.length > 80 ? "..." : ""),
                engagement: d.predictedEngagement
                  ? `${(d.predictedEngagement / 1000).toFixed(1)}k`
                  : "—",
                status: d.status.toLowerCase(),
              }))
            : []
          ).length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-atlas-text-muted">No top drafts yet. Create and post drafts to see your best performers here.</p>
            </div>
          ) : (topDrafts.map((d) => ({
                snippet: d.content.slice(0, 80) + (d.content.length > 80 ? "..." : ""),
                engagement: d.predictedEngagement
                  ? `${(d.predictedEngagement / 1000).toFixed(1)}k`
                  : "—",
                status: d.status.toLowerCase(),
              }))).map((tweet, i) => (
            <div
              key={i}
              className="flex flex-col sm:grid sm:grid-cols-[1fr_100px_80px] px-4 sm:px-6 py-4 border-b border-glass-border last:border-0 hover:bg-glass transition-colors gap-1 sm:gap-0"
            >
              <span className="text-sm text-atlas-text truncate pr-4">
                {tweet.snippet}
              </span>
              <span className="text-sm text-atlas-teal font-medium">
                {tweet.engagement}
              </span>
              <span
                className={`text-xs font-medium ${
                  tweet.status === "posted"
                    ? "text-atlas-success"
                    : "text-atlas-teal"
                }`}
              >
                {tweet.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 6: Learning Log */}
      <div className="bg-atlas-surface border border-glass-border rounded-xl p-8 mb-6">
        <h2 className="font-heading text-xl text-atlas-text mb-6">
          Model Learning Log
        </h2>
        <div className="space-y-4">
          {(logEntries.length > 0
            ? logEntries.map((e) => ({
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
              className="flex items-center justify-between py-3 border-b border-glass-border last:border-0"
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
        <div className="flex items-center gap-2">
          {/* Timeline bar */}
          <div className="flex-1 relative h-3 bg-atlas-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-atlas-teal rounded-full"
              style={{ width: "75%" }}
            />
          </div>
        </div>
        <div className="flex justify-between mt-3">
          <div className="text-center">
            <p className="text-[10px] text-atlas-text-muted">Onboarded</p>
            <p className="text-[10px] text-atlas-text font-bold">Jan 15</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-atlas-text-muted">Peak Engagement</p>
            <p className="text-[10px] text-atlas-text font-bold">Feb 22</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-atlas-text-muted">Efficiency Goal</p>
            <p className="text-[10px] text-atlas-text font-bold">&lt; 30 Days</p>
          </div>
        </div>
      </div>

      {/* SECTION 8: Footer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 pt-4">
        <span className="text-sm text-atlas-text-secondary">
          Page 10 of Atlas System
        </span>
        <div className="flex gap-4">
          <button
            type="button"
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
    </AppShell>
  );
}

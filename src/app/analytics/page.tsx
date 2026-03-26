"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth";
import { api, AnalyticsSummary, LearningLogEntry, TweetDraft } from "@/lib/api";

const fallbackStats = [
  { label: "Drafts", value: "0" },
  { label: "Feedback", value: "0" },
  { label: "Refinements", value: "0" },
  { label: "Ingested", value: "0" },
];

const topTweets = [
  {
    snippet:
      "Protocol-market fit is the only metric that matters. TVL is vanity...",
    engagement: "22.9k",
    status: "posted",
  },
  {
    snippet:
      "ZK-rollup endgame is closer than you think. Prover efficiency...",
    engagement: "15.5k",
    status: "posted",
  },
  {
    snippet:
      "DeFi isn't rebuilding finance — it's architecting a new social...",
    engagement: "12.4k",
    status: "posted",
  },
  {
    snippet:
      "The 10-year yield is screaming. Crypto is whisper-quiet...",
    engagement: "8.2k",
    status: "draft",
  },
];

const learningLog = [
  {
    date: "Mar 14, 12:04 PM",
    event: "Tone adaptation: Adjusted for editorial authority.",
    impact: "+8% Clarity",
    positive: true,
  },
  {
    date: "Mar 11, 09:45 AM",
    event: "Vocabulary purge: Removed excessive jargon.",
    impact: "+3% Reach",
    positive: true,
  },
  {
    date: "Mar 08, 04:22 PM",
    event: "Hook refinement: Shortened first sentence structure.",
    impact: "-5% Novelty",
    positive: false,
  },
  {
    date: "Mar 02, 11:15 PM",
    event: "Sentiment Calibration: Warmth increased by 15%.",
    impact: "+12% Feedback",
    positive: true,
  },
];

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const predictedData = [40, 55, 45, 70, 60, 50, 65];
const actualData = [35, 60, 50, 80, 55, 65, 75];

export default function AnalyticsPage() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [logEntries, setLogEntries] = useState<LearningLogEntry[]>([]);
  const [topDrafts, setTopDrafts] = useState<TweetDraft[]>([]);
  const chartMax = 100;

  useEffect(() => {
    if (!token) return;
    api.analytics.summary(token).then((r) => setSummary(r.summary)).catch(() => {});
    api.analytics.learningLog(token).then((r) => setLogEntries(r.entries)).catch(() => {});
    api.drafts.list(token).then((r) => setTopDrafts(r.drafts.slice(0, 4))).catch(() => {});
  }, [token]);

  const usageStats = summary
    ? [
        { label: "Drafts", value: String(summary.draftsCreated) },
        { label: "Feedback", value: String(summary.feedbackGiven) },
        { label: "Refinements", value: String(summary.refinements) },
        { label: "Ingested", value: String(summary.reportsIngested) },
      ]
    : fallbackStats;

  return (
    <AppShell>
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
          {usageStats.map((stat) => (
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
        {/* Sparkline placeholder */}
        <div className="mt-6 h-8 flex items-end gap-1">
          {[20, 25, 22, 30, 28, 35, 32, 40, 38, 42, 45, 50, 48, 55, 52, 58, 60, 56, 62, 65, 60, 68, 70, 72, 75, 78, 80, 82, 85, 88].map(
            (v, i) => (
              <div
                key={i}
                className="flex-1 bg-atlas-teal/40 rounded-sm"
                style={{ height: `${(v / 100) * 100}%` }}
              />
            )
          )}
        </div>
        <p className="text-atlas-text-muted text-sm italic mt-3">
          The more you use Atlas, the better it gets.
        </p>
      </div>

      {/* SECTION 3: Engagement Chart (Hero) */}
      <div className="bg-atlas-surface border border-glass-border rounded-xl p-8 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-heading text-xl text-atlas-text">
            Engagement Velocity
          </h2>
          <p className="text-xs text-atlas-text-secondary font-medium">
            62% Accuracy
          </p>
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
            {days.map((day, i) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center gap-1 h-40">
                  <div
                    className="w-3 bg-atlas-teal/60 rounded-t"
                    style={{ height: `${(predictedData[i] / chartMax) * 100}%` }}
                    title={`Predicted: ${predictedData[i]}`}
                  />
                  <div
                    className="w-3 bg-atlas-success rounded-t"
                    style={{ height: `${(actualData[i] / chartMax) * 100}%` }}
                    title={`Actual: ${actualData[i]}`}
                  />
                </div>
                <span className="text-[10px] text-atlas-text-muted">{day}</span>
              </div>
            ))}
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
          {topTweets.map((tweet, i) => (
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
          {learningLog.map((entry, i) => (
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

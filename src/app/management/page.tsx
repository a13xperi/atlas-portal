"use client";

import AppShell from "@/components/layout/AppShell";
import GradientButton from "@/components/ui/GradientButton";

const kpiCards = [
  { label: "Total Analysts", value: "25", change: null },
  { label: "Active This Week", value: "18", change: "↑ 3", positive: true },
  { label: "Avg Engagement", value: "2.1K", change: "↑ 12% MoM", positive: true },
];

const tableData = [
  { name: "Alex M.", sessions: 142, drafts: 86, posts: 42, maturity: "Advanced", lastActive: "2h ago", maturityColor: "text-atlas-success" },
  { name: "Priya K.", sessions: 204, drafts: 112, posts: 98, maturity: "Intermediate", lastActive: "14m ago", maturityColor: "text-atlas-teal" },
  { name: "Julian R.", sessions: 88, drafts: 24, posts: 12, maturity: "Beginner", lastActive: "9d ago", maturityColor: "text-atlas-warning", stale: true },
  { name: "Sarah W.", sessions: 156, drafts: 78, posts: 64, maturity: "Advanced", lastActive: "1d ago", maturityColor: "text-atlas-success" },
  { name: "Chen L.", sessions: 42, drafts: 12, posts: 4, maturity: "Beginner", lastActive: "12d ago", maturityColor: "text-atlas-warning", stale: true },
];

const leaderboard = [
  { rank: 1, name: "Priya K.", score: "98.4" },
  { rank: 2, name: "Alex M.", score: "94.1" },
  { rank: 3, name: "Sarah W.", score: "92.8" },
  { rank: 4, name: "Marcus V.", score: "89.2" },
  { rank: 5, name: "Elara J.", score: "87.5" },
];

const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const modelTarget = [50, 55, 60, 58, 65, 62, 70];
const teamActual = [45, 58, 55, 65, 60, 68, 75];

const timeToPeak = [
  { name: "Alex M.", days: 22, max: 40 },
  { name: "Priya K.", days: 28, max: 40 },
  { name: "Sarah W.", days: 14, max: 40 },
  { name: "Marcus V.", days: 34, max: 40 },
];

const inactiveAnalysts = [
  { name: "Julian R.", days: "9 days inactive" },
  { name: "Chen L.", days: "12 days inactive" },
  { name: "Elena M.", days: "7 days inactive" },
];

export default function ManagementPage() {
  return (
    <AppShell>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-3xl text-atlas-text">
          Team Management — Atlas
        </h1>
        <p className="text-atlas-text-secondary mt-1">
          Executive overview{" "}
          <span className="text-atlas-text-muted">·</span> Last updated 2 min
          ago
        </p>
      </div>

      {/* SECTION 1: Overview KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {kpiCards.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-atlas-surface border border-glass-border rounded-2xl p-8 text-center"
          >
            <p className="text-xs text-atlas-text-secondary uppercase tracking-wide">
              {kpi.label}
            </p>
            <p className="font-heading text-5xl text-atlas-text mt-2">
              {kpi.value}
            </p>
            {kpi.change && (
              <p className="text-sm font-bold text-atlas-success mt-1">
                {kpi.change}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* SECTION 2: Usage Table */}
      <div className="bg-atlas-surface border border-glass-border rounded-2xl overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-glass-border">
          <h2 className="font-heading text-xl text-atlas-text">
            Operational Activity
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-glass-border">
                {["Name", "Sessions", "Drafts", "Posts", "Voice Maturity", "Last Active"].map(
                  (col) => (
                    <th
                      key={col}
                      className="px-6 py-3 text-left text-xs text-atlas-text-secondary font-bold"
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row) => (
                <tr
                  key={row.name}
                  className="border-b border-glass-border last:border-0 hover:bg-glass transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-atlas-text font-medium">
                    {row.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-atlas-text-secondary">
                    {row.sessions}
                  </td>
                  <td className="px-6 py-4 text-sm text-atlas-text-secondary">
                    {row.drafts}
                  </td>
                  <td className="px-6 py-4 text-sm text-atlas-text-secondary">
                    {row.posts}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wide ${row.maturityColor}`}
                    >
                      {row.maturity}
                    </span>
                  </td>
                  <td
                    className={`px-6 py-4 text-sm ${
                      row.stale
                        ? "text-atlas-error font-semibold"
                        : "text-atlas-text-secondary"
                    }`}
                  >
                    {row.lastActive}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: Leaderboard Strip */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl text-atlas-text">
            Top Performers
          </h2>
          <button
            type="button"
            className="text-sm text-atlas-text-secondary hover:text-atlas-text transition-colors"
          >
            View All Rankings
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {leaderboard.map((entry) => (
            <div
              key={entry.rank}
              className={`bg-atlas-surface border rounded-2xl p-4 text-center ${
                entry.rank === 1
                  ? "border-atlas-teal"
                  : "border-glass-border"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-sm font-bold ${
                  entry.rank === 1
                    ? "bg-atlas-teal text-atlas-bg"
                    : "bg-atlas-nav text-atlas-text"
                }`}
              >
                {entry.rank}
              </div>
              <p className="text-sm text-atlas-text font-medium mt-2">
                {entry.name}
              </p>
              <p className="text-xs text-atlas-text-secondary mt-1">
                Score: {entry.score}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4: Side-by-side Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Prediction Accuracy Chart */}
        <div className="bg-atlas-surface border border-glass-border rounded-2xl p-6">
          <h3 className="font-heading text-xl text-atlas-text mb-4">
            Team Prediction Accuracy
          </h3>
          <div className="h-40 flex items-end gap-0">
            {days.map((day, i) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center gap-1 h-32">
                  <div
                    className="w-2.5 bg-atlas-teal/50 rounded-t"
                    style={{ height: `${(modelTarget[i] / 80) * 100}%` }}
                  />
                  <div
                    className="w-2.5 bg-atlas-success rounded-t"
                    style={{ height: `${(teamActual[i] / 80) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-atlas-text-muted">{day}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-atlas-teal/50" />
              <span className="text-[10px] text-atlas-text-secondary">
                Model Target
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-atlas-success" />
              <span className="text-[10px] text-atlas-text-secondary">
                Team Actual
              </span>
            </div>
          </div>
        </div>

        {/* Time-to-Peak */}
        <div className="bg-atlas-surface border border-glass-border rounded-2xl p-6">
          <h3 className="font-heading text-xl text-atlas-text mb-4">
            Days to Best Engagement
          </h3>
          <div className="space-y-4">
            {timeToPeak.map((entry) => (
              <div key={entry.name} className="flex items-center gap-3">
                <span className="text-xs text-atlas-text-secondary w-20 shrink-0">
                  {entry.name}
                </span>
                <div className="flex-1 h-4 bg-atlas-nav rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-atlas-teal rounded-full"
                    style={{ width: `${(entry.days / entry.max) * 100}%` }}
                  />
                  {/* 30-day target marker */}
                  <div
                    className="absolute top-0 h-full w-0.5 bg-atlas-text-muted"
                    style={{ left: `${(30 / entry.max) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-atlas-text w-8 text-right">
                  {entry.days}d
                </span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-atlas-text-muted mt-3">
            * 30-day team target indicated by vertical marker
          </p>
        </div>
      </div>

      {/* SECTION 5: Inactive Analysts Panel */}
      <div className="bg-white/[0.03] border border-glass-border rounded-2xl p-6 sm:p-10 mb-8">
        <div className="flex flex-col md:flex-row gap-12">
          <div className="md:w-1/3">
            <h2 className="font-heading text-2xl text-atlas-text">
              Needs Attention
            </h2>
            <p className="text-atlas-text-secondary mt-2 leading-relaxed">
              System has flagged 3 analysts who have been inactive for over 7
              business days. Operational efficiency may be impacted.
            </p>
          </div>
          <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {inactiveAnalysts.map((analyst) => (
              <div
                key={analyst.name}
                className="bg-atlas-surface border border-glass-border rounded-2xl p-5 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-atlas-error/20 mx-auto flex items-center justify-center text-atlas-error text-lg font-bold">
                  {analyst.name[0]}
                </div>
                <p className="text-lg text-atlas-text font-medium mt-3">
                  {analyst.name}
                </p>
                <p className="text-xs text-atlas-text-secondary mt-1">
                  {analyst.days}
                </p>
                <button
                  type="button"
                  className="mt-3 text-xs font-bold text-atlas-teal hover:underline"
                >
                  Send Nudge
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 6: Bottom Action Strip */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-4 pt-4">
        <GradientButton>Reload inactive with Top 5 profiles</GradientButton>
        <GradientButton variant="outline-warning">
          Send nudge to all inactive
        </GradientButton>
        <GradientButton variant="outline-teal">
          Push a style to all
        </GradientButton>
      </div>
    </AppShell>
  );
}

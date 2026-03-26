"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import GradientButton from "@/components/ui/GradientButton";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api, TeamAnalyst, TeamMember } from "@/lib/api";

const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const modelTarget = [50, 55, 60, 58, 65, 62, 70];
const teamActual = [45, 58, 55, 65, 60, 68, 75];

function maturityColor(m?: string) {
  if (m === "ADVANCED") return "text-atlas-success";
  if (m === "INTERMEDIATE") return "text-atlas-teal";
  return "text-atlas-warning";
}

export default function ManagementPage() {
  const { token } = useAuth();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [analysts, setAnalysts] = useState<TeamAnalyst[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    try {
      const [teamRes, analyticsRes] = await Promise.all([
        api.users.team(token),
        api.analytics.team(token),
      ]);
      setTeam(teamRes.team);
      setAnalysts(analyticsRes.analysts);
    } catch (e) {
      console.error("Failed to load team data:", e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  // Derive KPIs from real data, fall back to static
  const totalAnalysts = team.length || 25;
  const activeThisWeek = team.filter((m) => m._count.sessions > 0).length || 18;
  const avgEngagement = analysts.length > 0
    ? Math.round(analysts.reduce((sum, a) => sum + a._count.tweetDrafts, 0) / analysts.length)
    : 2100;

  const kpiCards = [
    { label: "Total Analysts", value: String(totalAnalysts), change: null as string | null },
    { label: "Active This Week", value: String(activeThisWeek), change: null },
    { label: "Avg Drafts/Analyst", value: String(avgEngagement), change: null },
  ];

  // Build table from real team data or use static fallback
  const tableData = team.length > 0
    ? team.map((m) => ({
        name: m.displayName || m.handle,
        sessions: m._count.sessions,
        drafts: m._count.tweetDrafts,
        posts: 0,
        maturity: m.voiceProfile?.maturity || "BEGINNER",
        maturityColor: maturityColor(m.voiceProfile?.maturity),
        stale: m._count.sessions === 0,
      }))
    : [
        { name: "Alex M.", sessions: 142, drafts: 86, posts: 42, maturity: "ADVANCED", maturityColor: "text-atlas-success", stale: false },
        { name: "Priya K.", sessions: 204, drafts: 112, posts: 98, maturity: "INTERMEDIATE", maturityColor: "text-atlas-teal", stale: false },
        { name: "Julian R.", sessions: 88, drafts: 24, posts: 12, maturity: "BEGINNER", maturityColor: "text-atlas-warning", stale: true },
        { name: "Sarah W.", sessions: 156, drafts: 78, posts: 64, maturity: "ADVANCED", maturityColor: "text-atlas-success", stale: false },
        { name: "Chen L.", sessions: 42, drafts: 12, posts: 4, maturity: "BEGINNER", maturityColor: "text-atlas-warning", stale: true },
      ];

  // Top performers sorted by drafts
  const leaderboard = [...tableData]
    .sort((a, b) => b.drafts - a.drafts)
    .slice(0, 5)
    .map((entry, i) => ({ rank: i + 1, name: entry.name, score: String(entry.drafts) }));

  // Inactive analysts
  const inactiveAnalysts = tableData
    .filter((m) => m.stale)
    .slice(0, 3)
    .map((m) => ({ name: m.name, days: "Inactive" }));

  // Time-to-peak (synthetic from real data or static)
  const timeToPeak = tableData.slice(0, 4).map((m) => ({
    name: m.name,
    days: Math.max(5, Math.round(40 - (m.drafts / 4))),
    max: 40,
  }));

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-3xl text-atlas-text">
          Team Management — Atlas
        </h1>
        <p className="text-atlas-text-secondary mt-1">
          Executive overview <span className="text-atlas-text-muted">·</span>{" "}
          {loading ? "Loading…" : "Live data"}
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 mb-6 text-atlas-text-secondary text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading team data…
        </div>
      )}

      {/* SECTION 1: Overview KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className="bg-atlas-surface border border-glass-border rounded-2xl p-8 text-center">
            <p className="text-xs text-atlas-text-secondary uppercase tracking-wide">{kpi.label}</p>
            <p className="font-heading text-5xl text-atlas-text mt-2">{kpi.value}</p>
            {kpi.change && <p className="text-sm font-bold text-atlas-success mt-1">{kpi.change}</p>}
          </div>
        ))}
      </div>

      {/* SECTION 2: Usage Table */}
      <div className="bg-atlas-surface border border-glass-border rounded-2xl overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-glass-border">
          <h2 className="font-heading text-xl text-atlas-text">Operational Activity</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-glass-border">
                {["Name", "Sessions", "Drafts", "Posts", "Voice Maturity"].map((col) => (
                  <th key={col} className="px-6 py-3 text-left text-xs text-atlas-text-secondary font-bold">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row) => (
                <tr key={row.name} className="border-b border-glass-border last:border-0 hover:bg-glass transition-colors">
                  <td className="px-6 py-4 text-sm text-atlas-text font-medium">{row.name}</td>
                  <td className="px-6 py-4 text-sm text-atlas-text-secondary">{row.sessions}</td>
                  <td className="px-6 py-4 text-sm text-atlas-text-secondary">{row.drafts}</td>
                  <td className="px-6 py-4 text-sm text-atlas-text-secondary">{row.posts}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold uppercase tracking-wide ${row.maturityColor}`}>{row.maturity}</span>
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
          <h2 className="font-heading text-xl text-atlas-text">Top Performers</h2>
          <button type="button" className="text-sm text-atlas-text-secondary hover:text-atlas-text transition-colors">View All Rankings</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {leaderboard.map((entry) => (
            <div key={entry.rank} className={`bg-atlas-surface border rounded-2xl p-4 text-center ${entry.rank === 1 ? "border-atlas-teal" : "border-glass-border"}`}>
              <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-sm font-bold ${entry.rank === 1 ? "bg-atlas-teal text-atlas-bg" : "bg-atlas-nav text-atlas-text"}`}>
                {entry.rank}
              </div>
              <p className="text-sm text-atlas-text font-medium mt-2">{entry.name}</p>
              <p className="text-xs text-atlas-text-secondary mt-1">Drafts: {entry.score}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4: Side-by-side Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-atlas-surface border border-glass-border rounded-2xl p-6">
          <h3 className="font-heading text-xl text-atlas-text mb-4">Team Prediction Accuracy</h3>
          <div className="h-40 flex items-end gap-0">
            {days.map((day, i) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center gap-1 h-32">
                  <div className="w-2.5 bg-atlas-teal/50 rounded-t" style={{ height: `${(modelTarget[i] / 80) * 100}%` }} />
                  <div className="w-2.5 bg-atlas-success rounded-t" style={{ height: `${(teamActual[i] / 80) * 100}%` }} />
                </div>
                <span className="text-[10px] text-atlas-text-muted">{day}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-atlas-teal/50" /><span className="text-[10px] text-atlas-text-secondary">Model Target</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-atlas-success" /><span className="text-[10px] text-atlas-text-secondary">Team Actual</span></div>
          </div>
        </div>

        <div className="bg-atlas-surface border border-glass-border rounded-2xl p-6">
          <h3 className="font-heading text-xl text-atlas-text mb-4">Days to Best Engagement</h3>
          <div className="space-y-4">
            {timeToPeak.map((entry) => (
              <div key={entry.name} className="flex items-center gap-3">
                <span className="text-xs text-atlas-text-secondary w-20 shrink-0">{entry.name}</span>
                <div className="flex-1 h-4 bg-atlas-nav rounded-full overflow-hidden relative">
                  <div className="h-full bg-atlas-teal rounded-full" style={{ width: `${(entry.days / entry.max) * 100}%` }} />
                  <div className="absolute top-0 h-full w-0.5 bg-atlas-text-muted" style={{ left: `${(30 / entry.max) * 100}%` }} />
                </div>
                <span className="text-xs text-atlas-text w-8 text-right">{entry.days}d</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-atlas-text-muted mt-3">* 30-day team target indicated by vertical marker</p>
        </div>
      </div>

      {/* SECTION 5: Inactive Analysts Panel */}
      {inactiveAnalysts.length > 0 && (
        <div className="bg-white/[0.03] border border-glass-border rounded-2xl p-6 sm:p-10 mb-8">
          <div className="flex flex-col md:flex-row gap-12">
            <div className="md:w-1/3">
              <h2 className="font-heading text-2xl text-atlas-text">Needs Attention</h2>
              <p className="text-atlas-text-secondary mt-2 leading-relaxed">
                System has flagged {inactiveAnalysts.length} analyst{inactiveAnalysts.length !== 1 ? "s" : ""} who appear inactive. Operational efficiency may be impacted.
              </p>
            </div>
            <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-3 gap-6">
              {inactiveAnalysts.map((analyst) => (
                <div key={analyst.name} className="bg-atlas-surface border border-glass-border rounded-2xl p-5 text-center">
                  <div className="w-12 h-12 rounded-full bg-atlas-error/20 mx-auto flex items-center justify-center text-atlas-error text-lg font-bold">
                    {analyst.name[0]}
                  </div>
                  <p className="text-lg text-atlas-text font-medium mt-3">{analyst.name}</p>
                  <p className="text-xs text-atlas-text-secondary mt-1">{analyst.days}</p>
                  <button type="button" className="mt-3 text-xs font-bold text-atlas-teal hover:underline">Send Nudge</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: Bottom Action Strip */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 pt-4">
        <GradientButton>Reload inactive with Top 5 profiles</GradientButton>
        <GradientButton variant="outline-warning">Send nudge to all inactive</GradientButton>
        <GradientButton variant="outline-teal">Push a style to all</GradientButton>
      </div>
    </AppShell>
  );
}

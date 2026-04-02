"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import GradientButton from "@/components/ui/GradientButton";
import { SkeletonStatCard } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/auth";
import { api, TeamAnalyst, TeamMember, DailyTeamEngagement, AnalystPeak } from "@/lib/api";

function Spinner() {
  return (
    <svg className="animate-spin -ml-0.5 mr-1.5 h-3.5 w-3.5 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function maturityColor(m?: string) {
  if (m === "ADVANCED") return "text-atlas-success";
  if (m === "INTERMEDIATE") return "text-atlas-teal";
  return "text-atlas-warning";
}

export default function ManagementPage() {
  const { user } = useAuth();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [analysts, setAnalysts] = useState<TeamAnalyst[]>([]);
  const [teamEngagement, setTeamEngagement] = useState<DailyTeamEngagement[]>([]);
  const [peaks, setPeaks] = useState<AnalystPeak[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    const errors: string[] = [];
    await Promise.all([
      api.users.team().then((r) => setTeam(r.team ?? [])).catch((e: Error) => { errors.push(e.message); }),
      api.analytics.team().then((r) => setAnalysts(r.analysts ?? [])).catch(() => {}),
      api.analytics.teamEngagementDaily().then((r) => setTeamEngagement(r.days ?? [])).catch(() => {}),
      api.analytics.daysToPeak().then((r) => setPeaks(r.peaks ?? [])).catch(() => {}),
    ]);
    if (errors.length > 0) setError(errors[0]);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const totalAnalysts = team.length;
  const activeThisWeek = team.filter((m) => m._count.sessions > 0).length;
  const avgEngagement = analysts.length > 0
    ? Math.round(analysts.reduce((sum, a) => sum + a._count.tweetDrafts, 0) / analysts.length)
    : 0;

  const kpiCards = [
    { label: "Total Analysts", value: String(totalAnalysts), change: null as string | null },
    { label: "Active This Week", value: String(activeThisWeek), change: null },
    { label: "Avg Drafts/Analyst", value: String(avgEngagement), change: null },
  ];

  const tableData = team.map((m) => ({
    name: m.displayName || m.handle,
    sessions: m._count.sessions,
    drafts: m._count.tweetDrafts,
    posts: 0,
    maturity: m.voiceProfile?.maturity || "BEGINNER",
    maturityColor: maturityColor(m.voiceProfile?.maturity),
    stale: m._count.sessions === 0,
  }));

  // Top performers sorted by drafts
  const leaderboard = [...tableData]
    .sort((a, b) => b.drafts - a.drafts)
    .slice(0, 5)
    .map((entry, i) => ({ rank: i + 1, name: entry.name, score: String(entry.drafts) }));

  // Inactive analysts
  const inactiveAnalysts = tableData
    .filter((m) => m.stale)
    .slice(0, 3)
    .map((m) => ({ name: m.name, days: `${m.sessions} sessions · ${m.drafts} drafts` }));

  // Auto-dismiss feedback toast after 5 seconds
  useEffect(() => {
    if (!actionFeedback) return;
    const timer = setTimeout(() => setActionFeedback(null), 5000);
    return () => clearTimeout(timer);
  }, [actionFeedback]);

  const handleAction = async (action: "pushTopProfiles" | "sendNudge" | "pushStyle") => {
    if (!user || actionLoading) return;
    setActionLoading(action);
    setActionFeedback(null);
    try {
      const res = action === "pushTopProfiles"
        ? await api.users.pushTopProfiles()
        : action === "sendNudge"
        ? await api.users.sendNudge()
        : await api.users.pushStyle();
      setActionFeedback({ message: res.message || `Action completed (${res.affected} affected)`, type: "success" });
      if (action === "pushTopProfiles" || action === "sendNudge") loadData();
    } catch (e: unknown) {
      const msg = e instanceof TypeError && e.message === "Failed to fetch"
        ? "Network error — check your connection"
        : e instanceof Error && "statusCode" in e && (e as { statusCode: number }).statusCode === 403
        ? "Manager access required"
        : e instanceof Error ? e.message : "Action failed";
      setActionFeedback({ message: msg, type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  // Time-to-peak (real data from backend, synthetic fallback)
  const maxPeakDays = peaks.length > 0 ? Math.max(...peaks.map((p) => p.days), 30) : 40;
  const timeToPeak = (peaks.length > 0
    ? peaks.slice(0, 6).map((p) => ({ name: p.name, days: p.days, max: maxPeakDays }))
    : tableData.slice(0, 4).map((m) => ({
        name: m.name,
        days: Math.max(5, Math.round(40 - (m.drafts / 4))),
        max: 40,
      })));

  return (
    <AppShell>
      {error && (
        <div role="alert" className="mb-6 px-4 py-3 bg-atlas-error/10 border border-atlas-error/30 rounded-xl text-atlas-error text-sm">
          {error}
        </div>
      )}

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

      {/* SECTION 1: Overview KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonStatCard key={i} />)
          : kpiCards.map((kpi, i) => (
              <div key={kpi.label} className={`bg-atlas-surface border border-glass-border rounded-2xl p-8 text-center ${i === kpiCards.length - 1 && kpiCards.length % 2 !== 0 ? "col-span-2 md:col-span-1" : ""}`}>
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
              {tableData.length === 0 && !loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-atlas-text-secondary">
                    No team members found. Invite analysts to get started.
                  </td>
                </tr>
              ) : (
                tableData.map((row) => (
                  <tr key={row.name} className="border-b border-glass-border last:border-0 hover:bg-glass transition-colors">
                    <td className="px-6 py-4 text-sm text-atlas-text font-medium">{row.name}</td>
                    <td className="px-6 py-4 text-sm text-atlas-text-secondary">{row.sessions}</td>
                    <td className="px-6 py-4 text-sm text-atlas-text-secondary">{row.drafts}</td>
                    <td className="px-6 py-4 text-sm text-atlas-text-secondary">{row.posts}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold uppercase tracking-wide ${row.maturityColor}`}>{row.maturity}</span>
                    </td>
                  </tr>
                ))
              )}
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
            {(() => {
              if (teamEngagement.length === 0) {
                return <p className="text-sm text-atlas-text-muted italic px-2 self-center">No team engagement data yet.</p>;
              }
              const max = Math.max(...teamEngagement.flatMap((d) => [d.modelTarget, d.teamActual]), 1);
              return teamEngagement.map((day) => (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center gap-1 h-32">
                    <div className="w-2.5 bg-atlas-teal/50 rounded-t" style={{ height: `${(day.modelTarget / max) * 100}%` }} />
                    <div className="w-2.5 bg-atlas-success rounded-t" style={{ height: `${(day.teamActual / max) * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-atlas-text-muted">{day.dayLabel.toUpperCase()}</span>
                </div>
              ));
            })()}
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
                  <button type="button" onClick={() => handleAction("sendNudge")} className="mt-3 text-xs font-bold text-atlas-teal hover:underline disabled:opacity-50" disabled={!!actionLoading}>
                    {actionLoading === "sendNudge" ? <><Spinner />Sending…</> : "Send Nudge"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action Feedback */}
      {actionFeedback && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm ${actionFeedback.type === "success" ? "bg-atlas-success/10 border border-atlas-success/30 text-atlas-success" : "bg-atlas-error/10 border border-atlas-error/30 text-atlas-error"}`}>
          {actionFeedback.message}
        </div>
      )}

      {/* SECTION 6: Bottom Action Strip */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 pt-4">
        <GradientButton onClick={() => handleAction("pushTopProfiles")} disabled={!!actionLoading}>
          {actionLoading === "pushTopProfiles" ? <><Spinner />Pushing profiles…</> : "Reload inactive with Top 5 profiles"}
        </GradientButton>
        <GradientButton variant="outline-warning" onClick={() => handleAction("sendNudge")} disabled={!!actionLoading}>
          {actionLoading === "sendNudge" ? <><Spinner />Sending nudges…</> : "Send nudge to all inactive"}
        </GradientButton>
        <GradientButton variant="outline-teal" onClick={() => handleAction("pushStyle")} disabled={!!actionLoading}>
          {actionLoading === "pushStyle" ? <><Spinner />Pushing style…</> : "Push a style to all"}
        </GradientButton>
      </div>
    </AppShell>
  );
}

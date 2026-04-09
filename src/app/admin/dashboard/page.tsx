"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import {
  api,
  AdminOverview,
  AdminRosterUser,
  AdminPipeline,
  AdminAdoption,
  AdminDailyActivity,
  AdminFeedEvent,
} from "@/lib/api";

/* ─── Event label map ─── */
const EVENT_LABELS: Record<string, string> = {
  DRAFT_CREATED: "Created a draft",
  DRAFT_POSTED: "Posted to X",
  FEEDBACK_GIVEN: "Gave feedback",
  VOICE_REFINEMENT: "Refined voice",
  REPORT_INGESTED: "Ingested a report",
  ENGAGEMENT_RECORDED: "Recorded engagement",
  SESSION_START: "Started a session",
  RESEARCH_CONDUCTED: "Ran research",
  ALERT_GENERATED: "Generated an alert",
  IMAGE_GENERATED: "Generated an image",
};

/* ─── Helpers ─── */

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

/* ─── Sub-components (local) ─── */

function SectionSkeleton({ h = "h-40" }: { h?: string }) {
  return <div className={`animate-pulse bg-atlas-surface rounded-xl ${h}`} />;
}

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-xl border border-glass-border bg-glass p-4 text-center">
      <p className="font-heading font-extrabold text-2xl text-atlas-text">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-atlas-text-muted mt-1">{label}</p>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const cls =
    role === "ADMIN"
      ? "bg-atlas-teal/20 text-atlas-teal"
      : role === "MANAGER"
      ? "bg-amber-500/20 text-amber-400"
      : "bg-atlas-text-muted/20 text-atlas-text-secondary";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}>
      {role}
    </span>
  );
}

function StatusDot({ lastSeen }: { lastSeen: string | null }) {
  const days = daysSince(lastSeen);
  const color =
    days !== null && days <= 7
      ? "bg-emerald-400"
      : days !== null && days <= 30
      ? "bg-amber-400"
      : "bg-red-400";
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} />;
}

function MaturityBadge({ maturity }: { maturity: string | null }) {
  if (!maturity) return <span className="text-[10px] text-atlas-text-muted">--</span>;
  const cls =
    maturity === "ADVANCED"
      ? "text-emerald-400"
      : maturity === "INTERMEDIATE"
      ? "text-amber-400"
      : "text-atlas-text-muted";
  return <span className={`text-[10px] font-medium ${cls}`}>{maturity}</span>;
}

function HorizontalBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-xs text-atlas-text-secondary truncate">{label}</span>
      <div className="flex-1 h-4 bg-atlas-surface rounded-full overflow-hidden">
        <div className="h-full bg-atlas-teal rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right text-xs font-mono text-atlas-text-muted">{value}</span>
    </div>
  );
}

/* ─── Main page ─── */

export default function AdminDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [dataLoading, setDataLoading] = useState(true);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [roster, setRoster] = useState<AdminRosterUser[]>([]);
  const [pipeline, setPipeline] = useState<AdminPipeline | null>(null);
  const [adoption, setAdoption] = useState<AdminAdoption | null>(null);
  const [activityDaily, setActivityDaily] = useState<AdminDailyActivity[]>([]);
  const [feed, setFeed] = useState<AdminFeedEvent[]>([]);

  /* Auth guard */
  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  /* Fetch all data */
  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    setDataLoading(true);
    Promise.all([
      api.admin.overview().catch(() => null),
      api.admin.roster().catch(() => ({ users: [] })),
      api.admin.pipeline().catch(() => null),
      api.admin.adoption().catch(() => null),
      api.admin.activityDaily().catch(() => ({ days: [] })),
      api.admin.feed().catch(() => ({ events: [] })),
    ]).then(([ov, ro, pi, ad, ac, fe]) => {
      setOverview(ov);
      setRoster(
        (ro?.users ?? []).sort((a, b) => {
          if (!a.lastSeen && !b.lastSeen) return 0;
          if (!a.lastSeen) return 1;
          if (!b.lastSeen) return -1;
          return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
        })
      );
      setPipeline(pi);
      setAdoption(ad);
      setActivityDaily(ac?.days ?? []);
      setFeed((fe?.events ?? []).slice(0, 20));
    }).finally(() => setDataLoading(false));
  }, [user]);

  if (loading || (!user || user.role !== "ADMIN")) return null;

  /* Derived data */
  const postRate =
    overview && overview.draftsCreated30d > 0
      ? Math.round((overview.draftsPosted30d / overview.draftsCreated30d) * 100)
      : 0;

  /* Maturity distribution from roster */
  const maturityCounts = { BEGINNER: 0, INTERMEDIATE: 0, ADVANCED: 0 };
  roster.forEach((u) => {
    if (u.voiceMaturity === "BEGINNER") maturityCounts.BEGINNER++;
    else if (u.voiceMaturity === "INTERMEDIATE") maturityCounts.INTERMEDIATE++;
    else if (u.voiceMaturity === "ADVANCED") maturityCounts.ADVANCED++;
  });
  const maturityTotal = maturityCounts.BEGINNER + maturityCounts.INTERMEDIATE + maturityCounts.ADVANCED;

  /* Activity chart max */
  const activityMax = activityDaily.reduce((m, d) => Math.max(m, d.created + d.posted), 0);

  /* Adoption tiles */
  const adoptionTiles = adoption
    ? [
        { label: "Voice Calibrated", value: adoption.voiceCalibrated, total: adoption.totalUsers },
        { label: "Research Used", value: adoption.researchUsed30d, total: adoption.totalUsers },
        { label: "Alerts Configured", value: adoption.alertsConfigured, total: adoption.totalUsers },
        { label: "Briefings Generated", value: adoption.briefingsGenerated30d, total: adoption.totalUsers },
        { label: "Campaigns Created", value: adoption.campaignsCreated, total: adoption.totalUsers },
        { label: "Images Generated", value: adoption.imagesGenerated30d, total: adoption.totalUsers },
      ]
    : [];

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-atlas-text-muted mb-2">
            Admin
          </p>
          <h1 className="font-heading font-extrabold tracking-tight text-3xl text-atlas-text">
            Platform Dashboard
          </h1>
          <p className="text-atlas-text-secondary mt-2 text-sm">
            How the team is using Atlas
          </p>
        </div>

        {dataLoading ? (
          <div className="space-y-6">
            <SectionSkeleton h="h-24" />
            <SectionSkeleton h="h-64" />
            <SectionSkeleton h="h-48" />
            <SectionSkeleton h="h-32" />
            <SectionSkeleton h="h-16" />
            <SectionSkeleton h="h-48" />
            <SectionSkeleton h="h-64" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Section 1 — Platform Pulse */}
            {overview && (
              <section>
                <h2 className="font-heading font-bold text-lg text-atlas-text mb-3">Platform Pulse</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <StatCard value={overview.totalUsers} label="Total Users" />
                  <StatCard value={overview.activeUsers7d} label="Active (7d)" />
                  <StatCard value={overview.draftsCreated30d} label="Drafts (30d)" />
                  <StatCard value={overview.draftsPosted30d} label="Posted (30d)" />
                  <StatCard value={`${postRate}%`} label="Post Rate" />
                  <StatCard value={overview.imagesGenerated30d} label="Images (30d)" />
                </div>
              </section>
            )}

            {/* Section 2 — Team Roster */}
            {roster.length > 0 && (
              <section>
                <h2 className="font-heading font-bold text-lg text-atlas-text mb-3">Team Roster</h2>
                <div className="rounded-xl border border-glass-border bg-glass overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-glass-border text-left text-[10px] uppercase tracking-wide text-atlas-text-muted">
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Voice</th>
                        <th className="px-4 py-3 text-right">Drafts</th>
                        <th className="px-4 py-3 text-right">Posts</th>
                        <th className="px-4 py-3 text-right">Activity (30d)</th>
                        <th className="px-4 py-3">Last Seen</th>
                        <th className="px-4 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roster.map((u) => (
                        <tr key={u.id} className="border-b border-glass-border/50 last:border-0">
                          <td className="px-4 py-3">
                            <p className="font-medium text-atlas-text">@{u.handle}</p>
                            {u.displayName && (
                              <p className="text-[10px] text-atlas-text-muted">{u.displayName}</p>
                            )}
                          </td>
                          <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                          <td className="px-4 py-3"><MaturityBadge maturity={u.voiceMaturity} /></td>
                          <td className="px-4 py-3 text-right font-mono text-atlas-text">{u.totalDrafts}</td>
                          <td className="px-4 py-3 text-right font-mono text-atlas-text">{u.totalPosts}</td>
                          <td className="px-4 py-3 text-right font-mono text-atlas-text">{u.events30d}</td>
                          <td className="px-4 py-3 text-xs text-atlas-text-secondary">
                            {u.lastSeen ? relativeTime(u.lastSeen) : "Never"}
                          </td>
                          <td className="px-4 py-3 text-center"><StatusDot lastSeen={u.lastSeen} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Section 3 — Content Pipeline */}
            {pipeline && (
              <section>
                <h2 className="font-heading font-bold text-lg text-atlas-text mb-3">Content Pipeline</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Funnel */}
                  <div className="rounded-xl border border-glass-border bg-glass p-5">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-atlas-text-secondary mb-3">Draft Funnel</h3>
                    <div className="space-y-2">
                      {(() => {
                        const entries = Object.entries(pipeline.funnel);
                        const max = Math.max(...entries.map(([, v]) => v), 1);
                        return entries.map(([status, count]) => (
                          <HorizontalBar key={status} label={status} value={count} max={max} />
                        ));
                      })()}
                    </div>
                  </div>
                  {/* Source Types */}
                  <div className="rounded-xl border border-glass-border bg-glass p-5">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-atlas-text-secondary mb-3">Source Types</h3>
                    <div className="space-y-2">
                      {(() => {
                        const entries = Object.entries(pipeline.sourceTypes);
                        const max = Math.max(...entries.map(([, v]) => v), 1);
                        return entries.map(([source, count]) => (
                          <HorizontalBar key={source} label={source} value={count} max={max} />
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Section 4 — Feature Adoption */}
            {adoption && adoptionTiles.length > 0 && (
              <section>
                <h2 className="font-heading font-bold text-lg text-atlas-text mb-3">Feature Adoption</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {adoptionTiles.map((tile) => {
                    const pct = tile.total > 0 ? Math.round((tile.value / tile.total) * 100) : 0;
                    return (
                      <div key={tile.label} className="rounded-xl border border-glass-border bg-glass p-4">
                        <p className="text-xs text-atlas-text-secondary">{tile.label}</p>
                        <p className="font-heading font-bold text-lg text-atlas-text mt-1">
                          {tile.value} <span className="text-xs font-normal text-atlas-text-muted">/ {tile.total}</span>
                        </p>
                        <div className="mt-2 h-1 bg-atlas-surface rounded-full overflow-hidden">
                          <div className="h-full bg-atlas-teal rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-[10px] text-atlas-text-muted mt-1">{pct}%</p>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Section 5 — Voice Maturity */}
            {maturityTotal > 0 && (
              <section>
                <h2 className="font-heading font-bold text-lg text-atlas-text mb-3">Voice Maturity</h2>
                <div className="rounded-xl border border-glass-border bg-glass p-5">
                  <div className="flex h-6 rounded-full overflow-hidden">
                    {maturityCounts.BEGINNER > 0 && (
                      <div
                        className="bg-red-400/60 flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ width: `${(maturityCounts.BEGINNER / maturityTotal) * 100}%` }}
                      >
                        {maturityCounts.BEGINNER}
                      </div>
                    )}
                    {maturityCounts.INTERMEDIATE > 0 && (
                      <div
                        className="bg-amber-400/60 flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ width: `${(maturityCounts.INTERMEDIATE / maturityTotal) * 100}%` }}
                      >
                        {maturityCounts.INTERMEDIATE}
                      </div>
                    )}
                    {maturityCounts.ADVANCED > 0 && (
                      <div
                        className="bg-emerald-400/60 flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ width: `${(maturityCounts.ADVANCED / maturityTotal) * 100}%` }}
                      >
                        {maturityCounts.ADVANCED}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] text-atlas-text-muted">
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-red-400/60" /> Beginner
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-amber-400/60" /> Intermediate
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-400/60" /> Advanced
                    </span>
                  </div>
                </div>
              </section>
            )}

            {/* Section 6 — Activity Trend (30d) */}
            {activityDaily.length > 0 && (
              <section>
                <h2 className="font-heading font-bold text-lg text-atlas-text mb-3">Activity Trend (30d)</h2>
                <div className="rounded-xl border border-glass-border bg-glass p-5">
                  <div className="flex items-end gap-1 h-40">
                    {activityDaily.map((day, i) => {
                      const total = day.created + day.posted;
                      const totalPct = activityMax > 0 ? (total / activityMax) * 100 : 0;
                      const postedPct = activityMax > 0 ? (day.posted / activityMax) * 100 : 0;
                      return (
                        <div
                          key={i}
                          className="flex-1 flex flex-col justify-end h-full"
                          title={`${day.date}: ${day.created} created, ${day.posted} posted`}
                        >
                          <div
                            className="w-full rounded-t relative overflow-hidden"
                            style={{ height: `${totalPct}%`, minHeight: total > 0 ? "2px" : "0px" }}
                          >
                            {/* Created portion (teal) fills entire bar */}
                            <div className="absolute inset-0 bg-atlas-teal/60 rounded-t" />
                            {/* Posted portion (emerald) overlaid at bottom */}
                            {day.posted > 0 && (
                              <div
                                className="absolute bottom-0 left-0 right-0 bg-emerald-400"
                                style={{ height: `${totalPct > 0 ? (postedPct / totalPct) * 100 : 0}%` }}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] text-atlas-text-muted">
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-sm bg-atlas-teal/60" /> Created
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-sm bg-emerald-400" /> Posted
                    </span>
                  </div>
                </div>
              </section>
            )}

            {/* Section 7 — Activity Feed */}
            {feed.length > 0 && (
              <section>
                <h2 className="font-heading font-bold text-lg text-atlas-text mb-3">Activity Feed</h2>
                <div className="rounded-xl border border-glass-border bg-glass divide-y divide-glass-border/50">
                  {feed.map((event) => (
                    <div key={event.id} className="flex items-center gap-3 px-4 py-3">
                      <span className="w-16 shrink-0 text-[10px] text-atlas-text-muted">
                        {relativeTime(event.createdAt)}
                      </span>
                      <span className="text-xs font-medium text-atlas-teal shrink-0">
                        @{event.handle}
                      </span>
                      <span className="text-xs text-atlas-text-secondary truncate">
                        {EVENT_LABELS[event.type] ?? event.type}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

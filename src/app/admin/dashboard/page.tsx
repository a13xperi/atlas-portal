"use client";

import { useEffect, useMemo, useState } from "react";
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
  AdminLeaderboardEntry,
  TeamDraft,
  DailyTeamEngagement,
  TeamAnalyst,
  FeatureFlagRecord,
} from "@/lib/api";
import { rankTeam } from "@/lib/atlas-score";

/* ─── Constants ─── */

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

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Owner",
  MANAGER: "Admin",
  ANALYST: "Analyst",
};

const ROLE_ORDER = ["ADMIN", "MANAGER", "ANALYST"];

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-yellow-400/20 text-yellow-400 border-yellow-400/30",
  MANAGER: "bg-atlas-teal/20 text-atlas-teal border-atlas-teal/30",
  ANALYST: "bg-atlas-text-muted/20 text-atlas-text-secondary border-glass-border",
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

function humanFlagLabel(key: string): string {
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/* ─── Action state type ─── */

type ActionState = "idle" | "confirm" | "loading" | "done";
type RosterFilter = "all" | "active" | "struggling" | "uncalibrated";

/* ─── Sub-components ─── */

function SectionSkeleton({ h = "h-40" }: { h?: string }) {
  return <div className={`animate-pulse bg-atlas-surface rounded-xl ${h}`} />;
}

function StatCard({ value, label, hint }: { value: string | number; label: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-glass-border bg-glass p-4 text-center">
      <p className="font-heading font-extrabold text-2xl text-atlas-text">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-atlas-text-muted mt-1">{label}</p>
      {hint && <p className="text-[9px] text-atlas-text-muted/70 mt-0.5">{hint}</p>}
    </div>
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

function ActionButton({
  label,
  state,
  onFirstClick,
  onConfirm,
  variant = "default",
}: {
  label: string;
  state: ActionState;
  onFirstClick: () => void;
  onConfirm: () => void;
  variant?: "default" | "teal";
}) {
  if (state === "done") {
    return (
      <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-400">
        ✓ Sent
      </span>
    );
  }
  if (state === "loading") {
    return (
      <span className="inline-flex items-center gap-2 rounded-lg border border-glass-border bg-glass px-4 py-2 text-xs font-semibold text-atlas-text-muted">
        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-atlas-text-muted border-t-transparent" />
        Sending…
      </span>
    );
  }
  if (state === "confirm") {
    return (
      <button
        type="button"
        onClick={onConfirm}
        className="inline-flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-xs font-semibold text-amber-400 hover:bg-amber-400/20"
      >
        Click again to confirm
      </button>
    );
  }
  const baseCls =
    variant === "teal"
      ? "border-atlas-teal/40 bg-atlas-teal/10 text-atlas-teal hover:bg-atlas-teal/20"
      : "border-glass-border bg-glass text-atlas-text hover:bg-atlas-surface";
  return (
    <button
      type="button"
      onClick={onFirstClick}
      className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold transition-colors ${baseCls}`}
    >
      {label}
    </button>
  );
}

function MiniScoreBar({
  label,
  value,
  max,
  color = "bg-atlas-teal",
}: {
  label: string;
  value: number;
  max: number;
  color?: string;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-2 text-[10px]">
      <span className="w-20 text-atlas-text-muted truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-atlas-surface rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right font-mono text-atlas-text-secondary">{value}</span>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400/20 text-yellow-400 text-xs font-bold border border-yellow-400/40">
        1
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-300/20 text-slate-200 text-xs font-bold border border-slate-300/40">
        2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-orange-400/20 text-orange-300 text-xs font-bold border border-orange-400/40">
        3
      </span>
    );
  }
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-atlas-surface text-atlas-text-muted text-xs font-mono">
      {rank}
    </span>
  );
}

function SVGEngagementChart({ days }: { days: DailyTeamEngagement[] }) {
  if (days.length === 0) {
    return (
      <div className="text-xs text-atlas-text-muted text-center py-8">
        No engagement data yet
      </div>
    );
  }
  const width = 640;
  const height = 160;
  const padX = 24;
  const padY = 12;
  const plotW = width - padX * 2;
  const plotH = height - padY * 2;
  const maxVal = Math.max(
    ...days.map((d) => Math.max(d.modelTarget ?? 0, d.teamActual ?? 0)),
    1,
  );
  const stepX = days.length > 1 ? plotW / (days.length - 1) : 0;
  const toXY = (v: number, i: number) => {
    const x = padX + stepX * i;
    const y = padY + plotH - (v / maxVal) * plotH;
    return `${x},${y}`;
  };
  const predictedPath = days.map((d, i) => toXY(d.modelTarget ?? 0, i)).join(" ");
  const actualPath = days.map((d, i) => toXY(d.teamActual ?? 0, i)).join(" ");

  // Calculate "beat model" days
  const beatDays = days.filter((d) => (d.teamActual ?? 0) > (d.modelTarget ?? 0)).length;
  const beatPct = days.length > 0 ? Math.round((beatDays / days.length) * 100) : 0;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-4 text-[10px]">
          <span className="flex items-center gap-1 text-atlas-text-muted">
            <span className="inline-block h-0.5 w-4 bg-atlas-text-muted/60" /> Predicted
          </span>
          <span className="flex items-center gap-1 text-atlas-teal">
            <span className="inline-block h-0.5 w-4 bg-atlas-teal" /> Actual
          </span>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
            beatPct >= 60
              ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-400"
              : beatPct >= 40
              ? "border-amber-400/40 bg-amber-400/10 text-amber-400"
              : "border-red-400/40 bg-red-400/10 text-red-400"
          }`}
        >
          Beat model {beatPct}%
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40">
        {/* grid lines */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={padX}
            x2={width - padX}
            y1={padY + plotH * f}
            y2={padY + plotH * f}
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-atlas-text-muted/20"
          />
        ))}
        {/* predicted line (dashed) */}
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          points={predictedPath}
          className="text-atlas-text-muted/70"
        />
        {/* actual line (teal) */}
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          points={actualPath}
          className="text-atlas-teal"
        />
        {/* actual dots */}
        {days.map((d, i) => {
          const [x, y] = toXY(d.teamActual ?? 0, i).split(",").map(Number);
          return <circle key={i} cx={x} cy={y} r="2" className="fill-atlas-teal" />;
        })}
      </svg>
    </div>
  );
}

/* ─── Main page ─── */

export default function AdminDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Tab
  const [tab, setTab] = useState<"access" | "intelligence">("access");

  // Intelligence tab data
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [roster, setRoster] = useState<AdminRosterUser[]>([]);
  const [pipeline, setPipeline] = useState<AdminPipeline | null>(null);
  const [adoption, setAdoption] = useState<AdminAdoption | null>(null);
  const [activityDaily, setActivityDaily] = useState<AdminDailyActivity[]>([]);
  const [feed, setFeed] = useState<AdminFeedEvent[]>([]);
  const [leaderboard, setLeaderboard] = useState<AdminLeaderboardEntry[]>([]);
  const [teamDrafts, setTeamDrafts] = useState<TeamDraft[]>([]);
  const [engagementDaily, setEngagementDaily] = useState<DailyTeamEngagement[]>([]);
  const [teamAnalysts, setTeamAnalysts] = useState<TeamAnalyst[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Access tab data
  const [featureFlags, setFeatureFlags] = useState<FeatureFlagRecord[]>([]);
  const [flagsLoading, setFlagsLoading] = useState(true);
  const [savingFlag, setSavingFlag] = useState<string | null>(null);

  // Roster interactions
  const [rosterFilter, setRosterFilter] = useState<RosterFilter>("all");
  const [rosterSearch, setRosterSearch] = useState("");
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
  const [collapsedRoles, setCollapsedRoles] = useState<Record<string, boolean>>({});

  // Actions
  const [nudgeState, setNudgeState] = useState<ActionState>("idle");
  const [pushState, setPushState] = useState<ActionState>("idle");

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
      api.admin.roster().catch(() => ({ users: [] as AdminRosterUser[] })),
      api.admin.pipeline().catch(() => null),
      api.admin.adoption().catch(() => null),
      api.admin.activityDaily().catch(() => ({ days: [] as AdminDailyActivity[] })),
      api.admin.feed().catch(() => ({ events: [] as AdminFeedEvent[] })),
      api.admin.leaderboard().catch(() => null),
      api.drafts.team(50).catch(() => ({ drafts: [] as TeamDraft[], total: 0 })),
      api.analytics.teamEngagementDaily().catch(() => ({ days: [] as DailyTeamEngagement[] })),
      api.analytics.team().catch(() => ({ analysts: [] as TeamAnalyst[] })),
    ])
      .then(([ov, ro, pi, ad, ac, fe, lb, td, eg, ta]) => {
        setOverview(ov);
        setRoster(
          ((ro?.users ?? []) as AdminRosterUser[]).sort((a, b) => {
            if (!a.lastSeen && !b.lastSeen) return 0;
            if (!a.lastSeen) return 1;
            if (!b.lastSeen) return -1;
            return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
          }),
        );
        setPipeline(pi);
        setAdoption(ad);
        setActivityDaily(ac?.days ?? []);
        setFeed((fe?.events ?? []).slice(0, 20));
        setLeaderboard(((lb?.entries ?? []) as AdminLeaderboardEntry[]).slice().sort((a, b) => b.score - a.score));
        setTeamDrafts(td?.drafts ?? []);
        setEngagementDaily(eg?.days ?? []);
        setTeamAnalysts(ta?.analysts ?? []);
      })
      .finally(() => setDataLoading(false));

    // Fetch feature flags separately — backend may be new/missing
    setFlagsLoading(true);
    api.featureFlags
      .list()
      .then((res) => {
        setFeatureFlags(res?.flags ?? []);
      })
      .catch(() => {
        setFeatureFlags([]);
      })
      .finally(() => setFlagsLoading(false));
  }, [user]);

  /* ─── Memos (must be above early return) ─── */
  const filteredRoster = useMemo(() => {
    const q = rosterSearch.trim().toLowerCase();
    return roster.filter((u) => {
      if (q) {
        const hay = `${u.handle} ${u.displayName ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (rosterFilter === "active") {
        const d = daysSince(u.lastSeen);
        if (d === null || d > 7) return false;
      } else if (rosterFilter === "struggling") {
        if (u.voiceMaturity === "ADVANCED") return false;
        if (u.totalDrafts > 5) return false;
      } else if (rosterFilter === "uncalibrated") {
        if (u.tweetsAnalyzed > 0) return false;
      }
      return true;
    });
  }, [roster, rosterSearch, rosterFilter]);

  const rosterByRole = useMemo(() => {
    const groups: Record<string, AdminRosterUser[]> = { ADMIN: [], MANAGER: [], ANALYST: [] };
    for (const u of filteredRoster) {
      const key = (u.role || "ANALYST").toUpperCase();
      if (!groups[key]) groups[key] = [];
      groups[key].push(u);
    }
    return groups;
  }, [filteredRoster]);

  const effectiveLeaderboard: AdminLeaderboardEntry[] = useMemo(() => {
    if (leaderboard.length > 0) return leaderboard;
    const ranked = rankTeam(teamAnalysts);
    return ranked.map((r) => ({
      userId: r.analyst.id,
      handle: r.analyst.handle,
      displayName: null,
      avatarUrl: null,
      score: r.score.total,
      breakdown: {
        output: r.score.output,
        postRate: r.score.postRate,
        engagementDelta: r.score.engagement,
        voiceMaturity: r.score.maturity,
        feedback: r.score.feedback,
        streak: r.score.streak,
      },
    }));
  }, [leaderboard, teamAnalysts]);

  const topContent = useMemo(() => {
    const cutoff = Date.now() - 7 * 86_400_000;
    return [...teamDrafts]
      .filter((d) => {
        const t = d.postedAt ? new Date(d.postedAt).getTime() : new Date(d.createdAt).getTime();
        return t >= cutoff;
      })
      .filter((d) => typeof d.actualEngagement === "number" && (d.actualEngagement ?? 0) > 0)
      .sort((a, b) => (b.actualEngagement ?? 0) - (a.actualEngagement ?? 0))
      .slice(0, 5);
  }, [teamDrafts]);

  const analystByHandle = useMemo(() => {
    const m: Record<string, TeamAnalyst> = {};
    teamAnalysts.forEach((a) => {
      m[a.handle.toLowerCase()] = a;
    });
    return m;
  }, [teamAnalysts]);

  if (loading || !user || user.role !== "ADMIN") return null;

  /* ─── Derived data ─── */

  const postRate =
    overview && overview.draftsCreated30d > 0
      ? Math.round((overview.draftsPosted30d / overview.draftsCreated30d) * 100)
      : 0;

  const modelAccuracy =
    overview && overview.avgPredictedEngagement30d && overview.avgPredictedEngagement30d > 0
      ? Math.round(
          ((overview.avgActualEngagement30d ?? 0) / overview.avgPredictedEngagement30d) * 100,
        )
      : null;

  // Maturity distribution
  const maturityCounts = { BEGINNER: 0, INTERMEDIATE: 0, ADVANCED: 0 };
  roster.forEach((u) => {
    if (u.voiceMaturity === "BEGINNER") maturityCounts.BEGINNER++;
    else if (u.voiceMaturity === "INTERMEDIATE") maturityCounts.INTERMEDIATE++;
    else if (u.voiceMaturity === "ADVANCED") maturityCounts.ADVANCED++;
  });
  const maturityTotal =
    maturityCounts.BEGINNER + maturityCounts.INTERMEDIATE + maturityCounts.ADVANCED;

  const activityMax = activityDaily.reduce((m, d) => Math.max(m, d.created + d.posted), 0);

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

  /* ─── Handlers ─── */

  async function handleToggle(flagKey: string, column: "admin" | "analyst", currentRole: string) {
    setSavingFlag(flagKey);
    let newRole: string;
    if (column === "analyst") {
      newRole = currentRole === "everyone" ? "managers" : "everyone";
    } else {
      newRole =
        currentRole === "managers" || currentRole === "everyone" ? "admins" : "managers";
    }
    try {
      await api.featureFlags.update(flagKey, { rolloutRole: newRole });
      setFeatureFlags((prev) =>
        prev.map((f) => (f.key === flagKey ? { ...f, rolloutRole: newRole } : f)),
      );
    } catch {
      // no-op — brief error state
    } finally {
      setSavingFlag(null);
    }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    setUpdatingRoleId(userId);
    try {
      await api.users.updateRole(userId, newRole);
      setRoster((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    } catch {
      // no-op
    } finally {
      setUpdatingRoleId(null);
    }
  }

  function handleActionFirst(which: "nudge" | "push") {
    if (which === "nudge") {
      setNudgeState("confirm");
      setTimeout(() => setNudgeState((s) => (s === "confirm" ? "idle" : s)), 4000);
    } else {
      setPushState("confirm");
      setTimeout(() => setPushState((s) => (s === "confirm" ? "idle" : s)), 4000);
    }
  }

  async function handleActionConfirm(which: "nudge" | "push") {
    if (which === "nudge") {
      setNudgeState("loading");
      try {
        await api.users.sendNudge();
        setNudgeState("done");
        setTimeout(() => setNudgeState("idle"), 3000);
      } catch {
        setNudgeState("idle");
      }
    } else {
      setPushState("loading");
      try {
        await api.users.pushTopProfiles();
        setPushState("done");
        setTimeout(() => setPushState("idle"), 3000);
      } catch {
        setPushState("idle");
      }
    }
  }

  function toggleRoleCollapse(role: string) {
    setCollapsedRoles((prev) => ({ ...prev, [role]: !prev[role] }));
  }

  /* ─── Render ─── */

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-atlas-text-muted mb-2">
            God Mode
          </p>
          <h1 className="font-heading font-extrabold tracking-tight text-3xl text-atlas-text">
            Command Center
          </h1>
          <p className="text-atlas-text-secondary mt-2 text-sm">
            Control what the team sees and how they&apos;re performing.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-glass-border">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setTab("access")}
              className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 ${
                tab === "access"
                  ? "border-atlas-teal text-atlas-teal"
                  : "border-transparent text-atlas-text-muted hover:text-atlas-text"
              }`}
            >
              Team Access
            </button>
            <button
              type="button"
              onClick={() => setTab("intelligence")}
              className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 ${
                tab === "intelligence"
                  ? "border-atlas-teal text-atlas-teal"
                  : "border-transparent text-atlas-text-muted hover:text-atlas-text"
              }`}
            >
              Intelligence
            </button>
          </div>
        </div>

        {/* ─── Tab 1: Team Access ─── */}
        {tab === "access" && (
          <div className="space-y-8">
            {/* Feature Matrix */}
            <section>
              <h2 className="font-heading font-bold text-lg text-atlas-text mb-3">Feature Access</h2>
              <p className="text-xs text-atlas-text-muted mb-3">
                Toggle which role levels can see each feature. Owners always have access.
              </p>
              <div className="rounded-xl border border-glass-border bg-glass overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-glass-border">
                      <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wide text-atlas-text-muted">
                        Feature
                      </th>
                      <th className="px-4 py-3 text-center w-24">
                        <span className="text-[10px] uppercase tracking-wide text-yellow-400">Owner</span>
                      </th>
                      <th className="px-4 py-3 text-center w-24">
                        <span className="text-[10px] uppercase tracking-wide text-atlas-teal">Admin</span>
                      </th>
                      <th className="px-4 py-3 text-center w-24">
                        <span className="text-[10px] uppercase tracking-wide text-atlas-text-muted">
                          Analyst
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {flagsLoading && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-sm text-atlas-text-muted">
                          Loading flags…
                        </td>
                      </tr>
                    )}
                    {!flagsLoading && featureFlags.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-sm text-atlas-text-muted">
                          No flags available. Backend may not yet expose /api/admin/feature-flags.
                        </td>
                      </tr>
                    )}
                    {!flagsLoading &&
                      featureFlags.map((flag) => {
                        const isSaving = savingFlag === flag.key;
                        const role = flag.rolloutRole ?? "everyone";
                        const adminOn = flag.enabled && (role === "everyone" || role === "managers");
                        const analystOn = flag.enabled && role === "everyone";
                        const label = flag.name || humanFlagLabel(flag.key);
                        return (
                          <tr key={flag.key} className="border-b border-glass-border/50 last:border-0">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-atlas-text">{label}</span>
                                {!flag.enabled && (
                                  <span className="text-[9px] text-red-400 uppercase font-semibold">
                                    disabled
                                  </span>
                                )}
                              </div>
                              {flag.description && (
                                <p className="text-[10px] text-atlas-text-muted mt-0.5">
                                  {flag.description}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-atlas-teal text-base" title="Owners always have access">
                                ●
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggle(flag.key, "admin", role)}
                                disabled={isSaving || !flag.enabled}
                                className={`text-base transition-opacity ${
                                  isSaving ? "opacity-50" : ""
                                } ${adminOn ? "text-atlas-teal" : "text-atlas-text-muted/40"} ${
                                  !flag.enabled ? "cursor-not-allowed" : "hover:opacity-80"
                                }`}
                                title={flag.enabled ? "Toggle admin access" : "Flag disabled"}
                              >
                                {adminOn ? "●" : "○"}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggle(flag.key, "analyst", role)}
                                disabled={isSaving || !flag.enabled || !adminOn}
                                className={`text-base transition-opacity ${
                                  isSaving ? "opacity-50" : ""
                                } ${analystOn ? "text-atlas-teal" : "text-atlas-text-muted/40"} ${
                                  !flag.enabled || !adminOn
                                    ? "cursor-not-allowed"
                                    : "hover:opacity-80"
                                }`}
                                title={
                                  !flag.enabled
                                    ? "Flag disabled"
                                    : !adminOn
                                    ? "Enable for admins first"
                                    : "Toggle analyst access"
                                }
                              >
                                {analystOn ? "●" : "○"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Roster Controls */}
            <section>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <h2 className="font-heading font-bold text-lg text-atlas-text">Team Roster</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={rosterSearch}
                    onChange={(e) => setRosterSearch(e.target.value)}
                    placeholder="Search…"
                    className="rounded-lg border border-glass-border bg-glass px-3 py-1.5 text-xs text-atlas-text placeholder:text-atlas-text-muted focus:border-atlas-teal focus:outline-none"
                  />
                  {(["all", "active", "struggling", "uncalibrated"] as RosterFilter[]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setRosterFilter(f)}
                      className={`rounded-lg border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition-colors ${
                        rosterFilter === f
                          ? "border-atlas-teal/60 bg-atlas-teal/10 text-atlas-teal"
                          : "border-glass-border bg-glass text-atlas-text-muted hover:text-atlas-text"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <ActionButton
                  label="Send Nudge"
                  state={nudgeState}
                  onFirstClick={() => handleActionFirst("nudge")}
                  onConfirm={() => handleActionConfirm("nudge")}
                />
                <ActionButton
                  label="Push Top Profiles"
                  state={pushState}
                  onFirstClick={() => handleActionFirst("push")}
                  onConfirm={() => handleActionConfirm("push")}
                  variant="teal"
                />
                <span className="text-[10px] text-atlas-text-muted">
                  Click once to arm, again to confirm.
                </span>
              </div>

              {/* Grouped roster */}
              <div className="space-y-4">
                {ROLE_ORDER.map((roleKey) => {
                  const users = rosterByRole[roleKey] ?? [];
                  if (users.length === 0 && rosterFilter === "all" && !rosterSearch) {
                    // Still show empty section header for clarity
                  }
                  const collapsed = collapsedRoles[roleKey] ?? false;
                  return (
                    <div
                      key={roleKey}
                      className="rounded-xl border border-glass-border bg-glass overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => toggleRoleCollapse(roleKey)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-atlas-surface/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                              ROLE_COLORS[roleKey] ?? ROLE_COLORS.ANALYST
                            }`}
                          >
                            {ROLE_LABELS[roleKey] ?? roleKey}
                          </span>
                          <span className="text-xs text-atlas-text-muted">
                            {users.length} {users.length === 1 ? "person" : "people"}
                          </span>
                        </div>
                        <span className="text-atlas-text-muted text-xs">{collapsed ? "▸" : "▾"}</span>
                      </button>
                      {!collapsed && users.length > 0 && (
                        <ul className="divide-y divide-glass-border/50 border-t border-glass-border">
                          {users.map((u) => {
                            const expanded = expandedUserId === u.id;
                            const analyst = analystByHandle[u.handle.toLowerCase()];
                            const vp = analyst?.voiceProfile;
                            const draftPostRate =
                              u.totalDrafts > 0
                                ? Math.round((u.totalPosts / u.totalDrafts) * 100)
                                : 0;
                            return (
                              <li key={u.id}>
                                <div
                                  className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 hover:bg-atlas-surface/40 transition-colors cursor-pointer"
                                  onClick={() => setExpandedUserId(expanded ? null : u.id)}
                                >
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <StatusDot lastSeen={u.lastSeen} />
                                    <div className="min-w-0">
                                      <p className="font-medium text-atlas-text truncate">
                                        @{u.handle}
                                      </p>
                                      {u.displayName && (
                                        <p className="text-[10px] text-atlas-text-muted truncate">
                                          {u.displayName}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4 text-xs text-atlas-text-secondary">
                                    <span className="w-20 text-right">
                                      {u.lastSeen ? relativeTime(u.lastSeen) : "Never"}
                                    </span>
                                    <MaturityBadge maturity={u.voiceMaturity} />
                                    <span className="font-mono text-atlas-text-muted w-12 text-right">
                                      {u.totalDrafts}d
                                    </span>
                                    <select
                                      value={u.role}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        handleRoleChange(u.id, e.target.value);
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      disabled={updatingRoleId === u.id}
                                      className="rounded-md border border-glass-border bg-atlas-surface px-2 py-1 text-[10px] text-atlas-text focus:border-atlas-teal focus:outline-none disabled:opacity-50"
                                    >
                                      {ROLE_ORDER.map((r) => (
                                        <option key={r} value={r}>
                                          {ROLE_LABELS[r]}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                                {expanded && (
                                  <div className="px-4 pb-4 pt-1 bg-atlas-surface/30 border-t border-glass-border/40">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-[10px] uppercase tracking-wide text-atlas-text-muted mb-2">
                                          Voice Dimensions
                                        </p>
                                        {vp ? (
                                          <div className="space-y-1">
                                            <MiniScoreBar label="Humor" value={vp.humor} max={10} />
                                            <MiniScoreBar label="Formality" value={vp.formality} max={10} />
                                            <MiniScoreBar label="Brevity" value={vp.brevity} max={10} />
                                            <MiniScoreBar label="Contrarian" value={vp.contrarianTone} max={10} />
                                          </div>
                                        ) : (
                                          <p className="text-xs text-atlas-text-muted">
                                            Voice not calibrated
                                          </p>
                                        )}
                                      </div>
                                      <div className="space-y-2">
                                        <div className="flex justify-between text-xs">
                                          <span className="text-atlas-text-muted">Draft → Post</span>
                                          <span className="font-mono text-atlas-text">
                                            {draftPostRate}%
                                          </span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                          <span className="text-atlas-text-muted">Events (30d)</span>
                                          <span className="font-mono text-atlas-text">{u.events30d}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                          <span className="text-atlas-text-muted">Tweets Analyzed</span>
                                          <span className="font-mono text-atlas-text">
                                            {u.tweetsAnalyzed}
                                          </span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                          <span className="text-atlas-text-muted">Onboarding</span>
                                          <span className="font-mono text-atlas-text">
                                            {u.onboardingTrack ?? "—"}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                      {!collapsed && users.length === 0 && (
                        <div className="px-4 py-6 text-center text-xs text-atlas-text-muted border-t border-glass-border">
                          No users in this group match the current filter.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* ─── Tab 2: Intelligence ─── */}
        {tab === "intelligence" && (
          <>
            {dataLoading ? (
              <div className="space-y-6">
                <SectionSkeleton h="h-24" />
                <SectionSkeleton h="h-64" />
                <SectionSkeleton h="h-48" />
                <SectionSkeleton h="h-32" />
                <SectionSkeleton h="h-48" />
              </div>
            ) : (
              <div className="space-y-8">
                {/* Section 1 — Platform Pulse */}
                {overview && (
                  <section>
                    <h2 className="font-heading font-bold text-lg text-atlas-text mb-3">
                      Platform Pulse
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      <StatCard value={overview.totalUsers} label="Total Users" />
                      <StatCard value={overview.activeUsers7d} label="Active (7d)" />
                      <StatCard value={overview.draftsCreated30d} label="Drafts (30d)" />
                      <StatCard value={overview.draftsPosted30d} label="Posted (30d)" />
                      <StatCard value={`${postRate}%`} label="Post Rate" />
                      <StatCard
                        value={modelAccuracy !== null ? `${modelAccuracy}%` : "—"}
                        label="Model Accuracy"
                        hint={
                          overview.avgPredictedEngagement30d
                            ? `${Math.round(overview.avgActualEngagement30d ?? 0)} / ${Math.round(
                                overview.avgPredictedEngagement30d,
                              )}`
                            : undefined
                        }
                      />
                    </div>
                  </section>
                )}

                {/* Section 2 — Leaderboard */}
                {effectiveLeaderboard.length > 0 && (
                  <section>
                    <h2 className="font-heading font-bold text-lg text-atlas-text mb-3">
                      Atlas Leaderboard
                    </h2>
                    <div className="rounded-xl border border-glass-border bg-glass overflow-hidden">
                      <ul className="divide-y divide-glass-border/50">
                        {effectiveLeaderboard.slice(0, 10).map((entry, i) => (
                          <li
                            key={entry.userId}
                            className="flex items-center gap-4 px-4 py-3"
                          >
                            <RankBadge rank={i + 1} />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-atlas-text truncate">
                                @{entry.handle}
                              </p>
                              {entry.displayName && (
                                <p className="text-[10px] text-atlas-text-muted truncate">
                                  {entry.displayName}
                                </p>
                              )}
                            </div>
                            <div className="hidden md:grid grid-cols-3 gap-x-4 gap-y-1 text-[10px] w-80">
                              <MiniScoreBar
                                label="Output"
                                value={entry.breakdown.output}
                                max={250}
                              />
                              <MiniScoreBar
                                label="Post"
                                value={entry.breakdown.postRate}
                                max={200}
                              />
                              <MiniScoreBar
                                label="Engage"
                                value={entry.breakdown.engagementDelta}
                                max={200}
                                color="bg-emerald-400"
                              />
                              <MiniScoreBar
                                label="Voice"
                                value={entry.breakdown.voiceMaturity}
                                max={150}
                                color="bg-purple-400"
                              />
                              <MiniScoreBar
                                label="Feedback"
                                value={entry.breakdown.feedback}
                                max={100}
                                color="bg-amber-400"
                              />
                              <MiniScoreBar
                                label="Streak"
                                value={entry.breakdown.streak}
                                max={100}
                                color="bg-orange-400"
                              />
                            </div>
                            <div className="text-right">
                              <p className="font-heading font-extrabold text-xl text-atlas-teal">
                                {entry.score}
                              </p>
                              <p className="text-[9px] uppercase text-atlas-text-muted">score</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </section>
                )}

                {/* Section 3 — Top Content This Week */}
                {topContent.length > 0 && (
                  <section>
                    <h2 className="font-heading font-bold text-lg text-atlas-text mb-3">
                      Top Content This Week
                    </h2>
                    <div className="rounded-xl border border-glass-border bg-glass divide-y divide-glass-border/50">
                      {topContent.map((draft, i) => (
                        <div key={draft.id} className="flex items-start gap-4 px-4 py-3">
                          <span className="text-xs font-mono text-atlas-text-muted w-4 text-right pt-0.5">
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-atlas-text line-clamp-2">{draft.content}</p>
                            <p className="text-[10px] text-atlas-text-muted mt-1">
                              @{draft.user.handle} ·{" "}
                              {draft.postedAt
                                ? relativeTime(draft.postedAt)
                                : relativeTime(draft.createdAt)}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-heading font-bold text-sm text-emerald-400">
                              {(draft.actualEngagement ?? 0).toLocaleString()}
                            </p>
                            <p className="text-[9px] uppercase text-atlas-text-muted">engage</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Section 4 — Engagement Accuracy */}
                <section>
                  <h2 className="font-heading font-bold text-lg text-atlas-text mb-3">
                    Engagement Accuracy
                  </h2>
                  <div className="rounded-xl border border-glass-border bg-glass p-5">
                    <SVGEngagementChart days={engagementDaily} />
                  </div>
                </section>

                {/* Section 5 — Content Pipeline */}
                {pipeline && (
                  <section>
                    <h2 className="font-heading font-bold text-lg text-atlas-text mb-3">
                      Content Pipeline
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="rounded-xl border border-glass-border bg-glass p-5">
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-atlas-text-secondary mb-3">
                          Draft Funnel
                        </h3>
                        <div className="space-y-2">
                          {(() => {
                            const entries = Object.entries(pipeline.funnel);
                            const max = Math.max(...entries.map(([, v]) => v), 1);
                            return entries.map(([status, count]) => (
                              <HorizontalBar
                                key={status}
                                label={status}
                                value={count}
                                max={max}
                              />
                            ));
                          })()}
                        </div>
                      </div>
                      <div className="rounded-xl border border-glass-border bg-glass p-5">
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-atlas-text-secondary mb-3">
                          Source Types
                        </h3>
                        <div className="space-y-2">
                          {(() => {
                            const entries = Object.entries(pipeline.sourceTypes);
                            const max = Math.max(...entries.map(([, v]) => v), 1);
                            return entries.map(([source, count]) => (
                              <HorizontalBar
                                key={source}
                                label={source}
                                value={count}
                                max={max}
                              />
                            ));
                          })()}
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* Section 6 — Feature Adoption */}
                {adoption && adoptionTiles.length > 0 && (
                  <section>
                    <h2 className="font-heading font-bold text-lg text-atlas-text mb-3">
                      Feature Adoption
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {adoptionTiles.map((tile) => {
                        const pct = tile.total > 0 ? Math.round((tile.value / tile.total) * 100) : 0;
                        return (
                          <div
                            key={tile.label}
                            className="rounded-xl border border-glass-border bg-glass p-4"
                          >
                            <p className="text-xs text-atlas-text-secondary">{tile.label}</p>
                            <p className="font-heading font-bold text-lg text-atlas-text mt-1">
                              {tile.value}{" "}
                              <span className="text-xs font-normal text-atlas-text-muted">
                                / {tile.total}
                              </span>
                            </p>
                            <div className="mt-2 h-1 bg-atlas-surface rounded-full overflow-hidden">
                              <div
                                className="h-full bg-atlas-teal rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-atlas-text-muted mt-1">{pct}%</p>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Section 7 — Voice Maturity */}
                {maturityTotal > 0 && (
                  <section>
                    <h2 className="font-heading font-bold text-lg text-atlas-text mb-3">
                      Voice Maturity
                    </h2>
                    <div className="rounded-xl border border-glass-border bg-glass p-5">
                      <div className="flex h-6 rounded-full overflow-hidden">
                        {maturityCounts.BEGINNER > 0 && (
                          <div
                            className="bg-red-400/60 flex items-center justify-center text-[10px] font-bold text-white"
                            style={{
                              width: `${(maturityCounts.BEGINNER / maturityTotal) * 100}%`,
                            }}
                          >
                            {maturityCounts.BEGINNER}
                          </div>
                        )}
                        {maturityCounts.INTERMEDIATE > 0 && (
                          <div
                            className="bg-amber-400/60 flex items-center justify-center text-[10px] font-bold text-white"
                            style={{
                              width: `${(maturityCounts.INTERMEDIATE / maturityTotal) * 100}%`,
                            }}
                          >
                            {maturityCounts.INTERMEDIATE}
                          </div>
                        )}
                        {maturityCounts.ADVANCED > 0 && (
                          <div
                            className="bg-emerald-400/60 flex items-center justify-center text-[10px] font-bold text-white"
                            style={{
                              width: `${(maturityCounts.ADVANCED / maturityTotal) * 100}%`,
                            }}
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
                          <span className="inline-block h-2 w-2 rounded-full bg-amber-400/60" />{" "}
                          Intermediate
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400/60" />{" "}
                          Advanced
                        </span>
                      </div>
                    </div>
                  </section>
                )}

                {/* Section 8 — Activity Trend */}
                {activityDaily.length > 0 && (
                  <section>
                    <h2 className="font-heading font-bold text-lg text-atlas-text mb-3">
                      Activity Trend (30d)
                    </h2>
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
                                style={{
                                  height: `${totalPct}%`,
                                  minHeight: total > 0 ? "2px" : "0px",
                                }}
                              >
                                <div className="absolute inset-0 bg-atlas-teal/60 rounded-t" />
                                {day.posted > 0 && (
                                  <div
                                    className="absolute bottom-0 left-0 right-0 bg-emerald-400"
                                    style={{
                                      height: `${
                                        totalPct > 0 ? (postedPct / totalPct) * 100 : 0
                                      }%`,
                                    }}
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

                {/* Section 9 — Activity Feed */}
                {feed.length > 0 && (
                  <section>
                    <h2 className="font-heading font-bold text-lg text-atlas-text mb-3">
                      Activity Feed
                    </h2>
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
          </>
        )}
      </div>
    </AppShell>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth";
import { api, TeamMember, TeamAnalyst } from "@/lib/api";
import {
  Settings,
  Users,
  BarChart3,
  Shield,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Feature flag definitions
// ---------------------------------------------------------------------------

type FlagScope = "everyone" | "managers" | "admins";

interface FeatureFlag {
  key: string;
  label: string;
  description: string;
  scope: FlagScope;
  defaultEnabled: boolean;
}

const DEFAULT_FLAGS: FeatureFlag[] = [
  { key: "crafting_station", label: "Crafting Station", description: "AI tweet generation", scope: "everyone", defaultEnabled: true },
  { key: "voice_lab", label: "Voice Lab", description: "Voice profile editing and blending", scope: "everyone", defaultEnabled: true },
  { key: "arena", label: "Arena", description: "Competitive leaderboard", scope: "everyone", defaultEnabled: true },
  { key: "campaigns", label: "Campaigns", description: "PDF-to-tweet campaign workflow", scope: "everyone", defaultEnabled: true },
  { key: "queue", label: "Queue & Scheduling", description: "Draft queue with batch scheduling", scope: "everyone", defaultEnabled: true },
  { key: "analytics_advanced", label: "Advanced Analytics", description: "Prediction models and deep engagement metrics", scope: "managers", defaultEnabled: true },
  { key: "signals", label: "Signals & Alerts", description: "Trending topic scanner", scope: "managers", defaultEnabled: true },
  { key: "telegram_bot", label: "Telegram Bot", description: "Alert delivery via Telegram", scope: "everyone", defaultEnabled: false },
  { key: "tweet_tinder", label: "Tweet Tinder", description: "Swipe-based content curation", scope: "everyone", defaultEnabled: false },
  { key: "multi_model", label: "Multi-Model Routing", description: "Best AI model per task", scope: "admins", defaultEnabled: false },
  { key: "super_admin", label: "Super Admin Panel", description: "This control panel", scope: "admins", defaultEnabled: true },
];

const STORAGE_KEY = "atlas-feature-flags";

function loadFlags(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // corrupt data — fall through to defaults
  }
  const defaults: Record<string, boolean> = {};
  for (const f of DEFAULT_FLAGS) defaults[f.key] = f.defaultEnabled;
  return defaults;
}

function saveFlags(flags: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
}

// ---------------------------------------------------------------------------
// Scope badge
// ---------------------------------------------------------------------------

function ScopeBadge({ scope }: { scope: FlagScope }) {
  const styles: Record<FlagScope, string> = {
    everyone: "bg-atlas-teal/15 text-atlas-teal border-atlas-teal/30",
    managers: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    admins: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  };
  const labels: Record<FlagScope, string> = {
    everyone: "Everyone",
    managers: "Managers+",
    admins: "Admins only",
  };
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium ${styles[scope]}`}>
      {labels[scope]}
    </span>
  );
}

// ---------------------------------------------------------------------------
// iOS-style toggle
// ---------------------------------------------------------------------------

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-atlas-teal focus:ring-offset-2 focus:ring-offset-atlas-surface ${
        on ? "bg-atlas-teal" : "bg-atlas-text-muted/40"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg transition-transform duration-200 ${
          on ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Inline toast notification
// ---------------------------------------------------------------------------

function useToast() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 2500);
    return () => clearTimeout(timer);
  }, [message]);

  const toast = (msg: string) => setMessage(msg);

  const ToastEl = message ? (
    <div className="fixed bottom-6 right-6 z-50 animate-pulse rounded-lg border border-atlas-teal/30 bg-atlas-surface px-4 py-2 text-sm text-atlas-teal shadow-xl backdrop-blur-xl">
      {message}
    </div>
  ) : null;

  return { toast, ToastEl };
}

// ---------------------------------------------------------------------------
// Tab type
// ---------------------------------------------------------------------------

type Tab = "flags" | "users" | "usage";

// ---------------------------------------------------------------------------
// Role colors
// ---------------------------------------------------------------------------

function roleColor(role: string): string {
  switch (role) {
    case "ADMIN":
      return "bg-atlas-teal text-atlas-bg";
    case "MANAGER":
      return "bg-amber-500/15 text-amber-400 border border-amber-500/30";
    case "ANALYST":
    default:
      return "bg-white/10 text-atlas-text-secondary border border-glass-border";
  }
}

function avatarBg(role: string): string {
  switch (role) {
    case "ADMIN":
      return "bg-atlas-teal/20 text-atlas-teal border-atlas-teal/40";
    case "MANAGER":
      return "bg-amber-500/20 text-amber-400 border-amber-500/40";
    case "ANALYST":
    default:
      return "bg-white/10 text-atlas-text-secondary border-glass-border";
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ControlPanelPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("flags");

  // Feature flags state
  const [flags, setFlags] = useState<Record<string, boolean>>(loadFlags);

  // User management state
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [localRoles, setLocalRoles] = useState<Record<string, string>>({});

  // Usage analytics state
  const [analysts, setAnalysts] = useState<TeamAnalyst[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  const { toast, ToastEl } = useToast();

  // ---------- Feature flags ----------

  const enabledCount = useMemo(
    () => Object.values(flags).filter(Boolean).length,
    [flags]
  );

  function toggleFlag(key: string) {
    setFlags((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveFlags(next);
      return next;
    });
  }

  // ---------- Fetch team data ----------

  useEffect(() => {
    if (activeTab !== "users" || team.length > 0) return;
    let cancelled = false;
    setTeamLoading(true);
    setTeamError(null);
    api.users
      .team()
      .then((res) => {
        if (cancelled) return;
        setTeam(res.team);
        const roles: Record<string, string> = {};
        for (const m of res.team) roles[m.id] = m.role;
        setLocalRoles(roles);
      })
      .catch((err) => {
        if (cancelled) return;
        setTeamError(err instanceof Error ? err.message : "Failed to fetch team");
      })
      .finally(() => {
        if (!cancelled) setTeamLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, team.length]);

  // ---------- Fetch analytics data ----------

  useEffect(() => {
    if (activeTab !== "usage" || analysts.length > 0) return;
    let cancelled = false;
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    api.analytics
      .team()
      .then((res) => {
        if (cancelled) return;
        setAnalysts(res.analysts);
      })
      .catch((err) => {
        if (cancelled) return;
        setAnalyticsError(err instanceof Error ? err.message : "Failed to fetch analytics");
      })
      .finally(() => {
        if (!cancelled) setAnalyticsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, analysts.length]);

  // ---------- Analytics summary ----------

  const analyticsSummary = useMemo(() => {
    const totalUsers = analysts.length;
    let totalDrafts = 0;
    let totalSessions = 0;
    let totalEvents = 0;
    for (const a of analysts) {
      totalDrafts += a._count.tweetDrafts;
      totalSessions += a._count.sessions;
      totalEvents += a._count.analyticsEvents;
    }
    return { totalUsers, totalDrafts, totalSessions, totalEvents };
  }, [analysts]);

  const sortedAnalysts = useMemo(
    () => [...analysts].sort((a, b) => b._count.tweetDrafts - a._count.tweetDrafts),
    [analysts]
  );

  // ---------- Auth gate ----------

  if (authLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-32">
          <div className="animate-pulse text-sm text-atlas-text-secondary">Loading...</div>
        </div>
      </AppShell>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center gap-6 py-32">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10">
            <ShieldAlert className="h-8 w-8 text-red-400" />
          </div>
          <div className="text-center">
            <h1 className="font-heading text-2xl font-bold text-atlas-text">Access Denied</h1>
            <p className="mt-2 text-sm text-atlas-text-secondary">
              This page is restricted to ADMIN users only.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg bg-atlas-teal/15 px-4 py-2 text-sm font-medium text-atlas-teal transition-colors hover:bg-atlas-teal/25"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </AppShell>
    );
  }

  // ---------- Tab definitions ----------

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "flags", label: "Feature Flags", icon: <ToggleLeft className="h-4 w-4" /> },
    { key: "users", label: "Users", icon: <Users className="h-4 w-4" /> },
    { key: "usage", label: "Usage", icon: <BarChart3 className="h-4 w-4" /> },
  ];

  // ---------- Render ----------

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 py-2">
        {/* Header */}
        <header className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-atlas-teal" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-atlas-teal">
              Admin
            </p>
          </div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-atlas-text sm:text-4xl">
            Control Panel
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-atlas-text-secondary">
            Feature flags, user management, and usage analytics
          </p>
        </header>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-glass-border">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-b-2 border-atlas-teal text-atlas-teal"
                  : "text-atlas-text-muted hover:text-atlas-text-secondary"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "flags" && (
          <FeatureFlagsTab
            flags={flags}
            enabledCount={enabledCount}
            onToggle={toggleFlag}
          />
        )}
        {activeTab === "users" && (
          <UserManagementTab
            team={team}
            loading={teamLoading}
            error={teamError}
            localRoles={localRoles}
            setLocalRoles={setLocalRoles}
            toast={toast}
          />
        )}
        {activeTab === "usage" && (
          <UsageAnalyticsTab
            analysts={sortedAnalysts}
            summary={analyticsSummary}
            loading={analyticsLoading}
            error={analyticsError}
          />
        )}
      </div>

      {ToastEl}
    </AppShell>
  );
}

// ===========================================================================
// Tab 1: Feature Flags
// ===========================================================================

function FeatureFlagsTab({
  flags,
  enabledCount,
  onToggle,
}: {
  flags: Record<string, boolean>;
  enabledCount: number;
  onToggle: (key: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Counter */}
      <div className="flex items-center gap-3">
        <Settings className="h-5 w-5 text-atlas-teal" />
        <span className="text-sm text-atlas-text-secondary">
          <span className="font-semibold text-atlas-text">{enabledCount}</span> of{" "}
          {DEFAULT_FLAGS.length} flags enabled
        </span>
      </div>

      {/* Flag rows */}
      <div className="overflow-hidden rounded-2xl border border-glass-border bg-glass backdrop-blur-xl">
        {DEFAULT_FLAGS.map((flag, idx) => (
          <div
            key={flag.key}
            className={`flex items-center gap-4 px-5 py-4 ${
              idx > 0 ? "border-t border-white/5" : ""
            } transition-colors hover:bg-white/[0.02]`}
          >
            {/* Toggle */}
            <Toggle on={!!flags[flag.key]} onToggle={() => onToggle(flag.key)} />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-atlas-text">{flag.label}</span>
                <ScopeBadge scope={flag.scope} />
              </div>
              <p className="mt-0.5 text-xs text-atlas-text-muted">{flag.description}</p>
            </div>

            {/* Status icon */}
            {flags[flag.key] ? (
              <ToggleRight className="h-5 w-5 shrink-0 text-atlas-teal" />
            ) : (
              <ToggleLeft className="h-5 w-5 shrink-0 text-atlas-text-muted" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ===========================================================================
// Tab 2: User Management
// ===========================================================================

function UserManagementTab({
  team,
  loading,
  error,
  localRoles,
  setLocalRoles,
  toast,
}: {
  team: TeamMember[];
  loading: boolean;
  error: string | null;
  localRoles: Record<string, string>;
  setLocalRoles: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  toast: (msg: string) => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-sm text-atlas-text-secondary">Loading team...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Counter */}
      <div className="flex items-center gap-3">
        <Users className="h-5 w-5 text-atlas-teal" />
        <span className="text-sm text-atlas-text-secondary">
          <span className="font-semibold text-atlas-text">{team.length}</span> team members
        </span>
      </div>

      {/* User cards */}
      <div className="overflow-hidden rounded-2xl border border-glass-border bg-glass backdrop-blur-xl">
        {team.length === 0 && (
          <div className="px-5 py-12 text-center text-sm text-atlas-text-secondary">
            No team members found.
          </div>
        )}
        {team.map((member, idx) => {
          const currentRole = localRoles[member.id] || member.role;
          return (
            <div
              key={member.id}
              className={`flex items-center gap-4 px-5 py-4 ${
                idx > 0 ? "border-t border-white/5" : ""
              } transition-colors hover:bg-white/[0.02]`}
            >
              {/* Avatar */}
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${avatarBg(currentRole)}`}
              >
                {(member.handle || "?")[0].toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-atlas-text truncate">
                    @{member.handle}
                  </span>
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${roleColor(currentRole)}`}
                  >
                    {currentRole}
                  </span>
                </div>
                {member.displayName && (
                  <p className="mt-0.5 text-xs text-atlas-text-muted truncate">
                    {member.displayName}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="hidden items-center gap-4 text-xs text-atlas-text-muted sm:flex">
                <span>
                  <span className="font-semibold text-atlas-text-secondary">
                    {member._count.tweetDrafts}
                  </span>{" "}
                  drafts
                </span>
                <span>
                  <span className="font-semibold text-atlas-text-secondary">
                    {member._count.sessions}
                  </span>{" "}
                  sessions
                </span>
              </div>

              {/* Role selector */}
              <select
                value={currentRole}
                onChange={(e) => {
                  setLocalRoles((prev) => ({
                    ...prev,
                    [member.id]: e.target.value,
                  }));
                  toast("Role change saved locally");
                }}
                className="rounded-lg border border-glass-border bg-atlas-surface px-2 py-1.5 text-xs text-atlas-text focus:border-atlas-teal focus:outline-none"
              >
                <option value="ANALYST">ANALYST</option>
                <option value="MANAGER">MANAGER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===========================================================================
// Tab 3: Usage Analytics
// ===========================================================================

function UsageAnalyticsTab({
  analysts,
  summary,
  loading,
  error,
}: {
  analysts: TeamAnalyst[];
  summary: { totalUsers: number; totalDrafts: number; totalSessions: number; totalEvents: number };
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-sm text-atlas-text-secondary">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  const summaryCards = [
    { label: "Total Users", value: summary.totalUsers, icon: <Users className="h-4 w-4" />, color: "text-atlas-teal" },
    { label: "Total Drafts", value: summary.totalDrafts, icon: <BarChart3 className="h-4 w-4" />, color: "text-delphi-blue-400" },
    { label: "Total Sessions", value: summary.totalSessions, icon: <Settings className="h-4 w-4" />, color: "text-amber-400" },
    { label: "Total Events", value: summary.totalEvents, icon: <BarChart3 className="h-4 w-4" />, color: "text-purple-400" },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-glass-border bg-glass p-4 backdrop-blur-xl"
          >
            <div className={`mb-1 flex items-center gap-2 ${card.color}`}>
              {card.icon}
              <span className="text-2xl font-bold">{card.value}</span>
            </div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-atlas-text-muted">
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* Per-user table */}
      <div className="overflow-hidden rounded-2xl border border-glass-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-glass-border bg-atlas-surface text-xs uppercase tracking-wider text-atlas-text-muted">
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3 text-right">Drafts</th>
                <th className="px-5 py-3 text-right">Sessions</th>
                <th className="px-5 py-3 text-right">Events</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-glass backdrop-blur-xl">
              {analysts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-atlas-text-secondary">
                    No analytics data available.
                  </td>
                </tr>
              )}
              {analysts.map((analyst) => (
                <tr
                  key={analyst.id}
                  className="transition-colors hover:bg-white/[0.02]"
                >
                  <td className="px-5 py-3">
                    <span className="font-medium text-atlas-text">@{analyst.handle}</span>
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-atlas-teal">
                    {analyst._count.tweetDrafts}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-atlas-text-secondary">
                    {analyst._count.sessions}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-atlas-text-secondary">
                    {analyst._count.analyticsEvents}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

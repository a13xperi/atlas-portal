"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import FeatureGate from "@/components/ui/FeatureGate";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import { useAuth } from "@/lib/auth";
import {
  api,
  ArenaLeaderboardEntry,
  ArenaMeEntry,
  ArenaPeriod,
} from "@/lib/api";
import {
  Trophy,
  TrendingUp,
  Flame,
  Minus,
  Zap,
  Loader2,
  AlertTriangle,
  Send,
  Volume2,
  ChevronUp,
  ChevronDown,
  Award,
} from "lucide-react";
import {
  saveSnapshot,
  getPositionChange,
  isSnapshotStale,
} from "@/lib/arena-history";
import { cacheMyTier } from "@/lib/arena-tier-cache";

type PeriodOption = { value: ArenaPeriod; label: string };

const PERIOD_OPTIONS: PeriodOption[] = [
  { value: "last_7_days", label: "7d" },
  { value: "last_30_days", label: "30d" },
  { value: "all_time", label: "All time" },
];

function PositionBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400/20 text-yellow-400 text-sm font-bold">
        1
      </span>
    );
  if (rank === 2)
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-atlas-text-secondary/20 text-atlas-text-secondary text-sm font-bold">
        2
      </span>
    );
  if (rank === 3)
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-400/20 text-orange-400 text-sm font-bold">
        3
      </span>
    );
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-atlas-surface text-atlas-text-secondary text-sm">
      {rank}
    </span>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function ArenaPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<ArenaPeriod>("last_30_days");
  const [entries, setEntries] = useState<ArenaLeaderboardEntry[]>([]);
  const [me, setMe] = useState<ArenaMeEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const isManager = user?.role === "MANAGER" || user?.role === "ADMIN";

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [leaderboard, meData] = await Promise.all([
        api.arena.leaderboard(period),
        api.arena.me(period).catch(() => null),
      ]);
      setEntries(leaderboard.entries ?? []);
      setMe(meData);
    } catch (e) {
      console.error("Failed to load arena:", e);
      setError(e instanceof Error ? e.message : "Failed to load arena");
      setEntries([]);
      setMe(null);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!actionFeedback) return;
    const timer = setTimeout(() => setActionFeedback(null), 5000);
    return () => clearTimeout(timer);
  }, [actionFeedback]);

  const handleManagerAction = async (
    action: "pushTopProfiles" | "sendNudge" | "pushStyle"
  ) => {
    if (!user || actionLoading) return;
    const confirmMsg =
      action === "sendNudge"
        ? "Send a nudge to all inactive analysts?"
        : action === "pushStyle"
          ? "Push this voice style to all analysts?"
          : "Push top-performing voice profiles to the team?";
    if (!confirm(confirmMsg)) return;

    setActionLoading(action);
    setActionFeedback(null);
    try {
      const res =
        action === "pushTopProfiles"
          ? await api.users.pushTopProfiles()
          : action === "sendNudge"
            ? await api.users.sendNudge()
            : await api.users.pushStyle();
      setActionFeedback({
        message: res.message || `Done (${res.affected} affected)`,
        type: "success",
      });
      loadData();
    } catch (e: unknown) {
      setActionFeedback({
        message: e instanceof Error ? e.message : "Action failed",
        type: "error",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Merge `me` into the displayed list if the backend didn't include it
  // (e.g. analyst is ranked below the visible top N).
  const displayEntries: ArenaLeaderboardEntry[] = (() => {
    if (!me) return entries;
    const alreadyPresent = entries.some((e) => e.userId === me.userId);
    if (alreadyPresent) return entries;
    const meAsEntry: ArenaLeaderboardEntry = {
      rank: me.rank,
      userId: me.userId,
      displayName: me.displayName,
      avatarUrl: me.avatarUrl ?? null,
      tweetsPublished: me.tweetsPublished,
      totalEngagement: me.totalEngagement,
      consistencyStreak: me.consistencyStreak,
      badge: me.badge,
    };
    return [...entries, meAsEntry].sort((a, b) => a.rank - b.rank);
  })();

  const myEntry: ArenaLeaderboardEntry | undefined =
    displayEntries.find((e) => e.userId === user?.id) ??
    (me
      ? {
          rank: me.rank,
          userId: me.userId,
          displayName: me.displayName,
          avatarUrl: me.avatarUrl ?? null,
          tweetsPublished: me.tweetsPublished,
          totalEngagement: me.totalEngagement,
          consistencyStreak: me.consistencyStreak,
          badge: me.badge,
        }
      : undefined);

  const viewEntry: ArenaLeaderboardEntry | undefined = selectedUserId
    ? displayEntries.find((e) => e.userId === selectedUserId)
    : myEntry;

  const inactiveEntries = displayEntries.filter(
    (e) => e.tweetsPublished === 0 && e.totalEngagement === 0
  );

  const totalTweets = displayEntries.reduce(
    (s, e) => s + e.tweetsPublished,
    0
  );
  const totalEngagement = displayEntries.reduce(
    (s, e) => s + e.totalEngagement,
    0
  );
  const avgEngagement =
    displayEntries.length > 0
      ? Math.round(totalEngagement / displayEntries.length)
      : 0;

  // Cache user's rank for NavBar badge (reuses the existing tier cache surface).
  useEffect(() => {
    if (myEntry) {
      const label = myEntry.badge ?? `Rank #${myEntry.rank}`;
      cacheMyTier(label, myEntry.totalEngagement, myEntry.rank);
    }
  }, [myEntry]);

  // Save snapshot for position tracking (refresh every 6 hours).
  // arena-history stores by analyst.id; we pass a shim shape with userId→id.
  useEffect(() => {
    if (displayEntries.length > 0 && isSnapshotStale()) {
      const timer = setTimeout(() => {
        const shim = displayEntries.map((e) => ({
          analyst: {
            id: e.userId,
            handle: e.displayName,
            _count: {
              tweetDrafts: e.tweetsPublished,
              analyticsEvents: e.totalEngagement,
              sessions: e.consistencyStreak,
            },
          },
          score: {
            output: 0,
            postRate: 0,
            engagement: e.totalEngagement,
            maturity: 0,
            feedback: 0,
            streak: e.consistencyStreak,
            total: e.totalEngagement,
          },
          tier: {
            name: "Analyst" as const,
            min: 0,
            color: "",
            bgColor: "",
            borderColor: "",
          },
          rank: e.rank,
        }));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        saveSnapshot(shim as any);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [displayEntries]);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-yellow-400" />
            <h1 className="font-heading font-extrabold tracking-tight text-2xl text-atlas-text">
              Atlas Arena
            </h1>
            <p className="mt-2 text-atlas-text-secondary max-w-2xl">
              See how your content stacks up. The leaderboard ranks analysts by
              tweets published, engagement, and consistency — friendly
              competition to sharpen everyone&#39;s edge.
            </p>
          </div>
          {myEntry && (
            <div className="flex items-center gap-2">
              {myEntry.badge && (
                <span className="text-sm font-semibold text-yellow-400">
                  {myEntry.badge}
                </span>
              )}
              <span className="text-2xl font-bold text-atlas-text">
                #{myEntry.rank}
              </span>
            </div>
          )}
        </div>

        {/* Period Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-atlas-text-muted uppercase tracking-wide">
            Period
          </span>
          <div className="inline-flex rounded-lg border border-glass-border bg-atlas-surface/40 p-1">
            {PERIOD_OPTIONS.map((opt) => {
              const active = period === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPeriod(opt.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    active
                      ? "bg-atlas-teal/20 text-atlas-teal"
                      : "text-atlas-text-secondary hover:text-atlas-text"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Hero KPI Cards */}
        {myEntry && (
          <div className="grid grid-cols-3 gap-4">
            <GlassCard className="text-center">
              <p className="text-xs text-atlas-text-secondary uppercase tracking-wide">
                Tweets Published
              </p>
              <p className="text-3xl font-bold text-atlas-text mt-1">
                {myEntry.tweetsPublished}
              </p>
              <p className="text-xs text-atlas-text-muted">this period</p>
            </GlassCard>
            <GlassCard className="text-center">
              <TrendingUp className="h-4 w-4 text-atlas-teal mx-auto mb-1" />
              <p className="text-xs text-atlas-text-secondary uppercase tracking-wide">
                Engagement
              </p>
              <p className="text-3xl font-bold text-atlas-teal mt-1">
                {formatNumber(myEntry.totalEngagement)}
              </p>
              <p className="text-xs text-atlas-text-muted">total</p>
            </GlassCard>
            <GlassCard className="text-center">
              <Flame className="h-4 w-4 text-orange-400 mx-auto mb-1" />
              <p className="text-xs text-atlas-text-secondary uppercase tracking-wide">
                Streak
              </p>
              <p className="text-3xl font-bold text-orange-400 mt-1">
                {myEntry.consistencyStreak}d
              </p>
              <p className="text-xs text-atlas-text-muted">active</p>
            </GlassCard>
          </div>
        )}

        {/* Error banner */}
        {error && !loading && (
          <div className="rounded-xl border border-atlas-error/30 bg-atlas-error/10 px-4 py-3 text-sm text-atlas-error">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Leaderboard */}
          <GlassCard maxWidth="full" data-tour="arena-leaderboard">
            <h2 className="font-heading font-bold text-lg text-atlas-text mb-4">
              Leaderboard
            </h2>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-14 rounded-xl bg-atlas-surface animate-pulse"
                  />
                ))}
              </div>
            ) : displayEntries.length === 0 ? (
              <div className="rounded-xl border border-glass-border bg-atlas-surface/40 px-4 py-8 text-center text-sm text-atlas-text-secondary">
                No arena data yet for this period.
              </div>
            ) : (
              <div className="space-y-2">
                {displayEntries.map((entry) => {
                  const isMe = entry.userId === user?.id;
                  const isSelected = viewEntry?.userId === entry.userId;
                  // Normalized engagement bar: relative to top entry.
                  const topEngagement = Math.max(
                    ...displayEntries.map((e) => e.totalEngagement),
                    1
                  );
                  const pct =
                    topEngagement > 0
                      ? (entry.totalEngagement / topEngagement) * 100
                      : 0;
                  return (
                    <button
                      key={entry.userId}
                      type="button"
                      onClick={() => setSelectedUserId(entry.userId)}
                      className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                        isMe
                          ? "bg-atlas-teal/5 border border-atlas-teal/20"
                          : isSelected
                            ? "bg-atlas-surface/80 border border-glass-border"
                            : "bg-atlas-surface/40 border border-transparent hover:border-glass-border"
                      }`}
                    >
                      <PositionBadge rank={entry.rank} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-sm font-medium ${
                              isMe ? "text-atlas-teal" : "text-atlas-text"
                            }`}
                          >
                            {entry.displayName}
                            {isMe && (
                              <span className="text-xs text-atlas-text-muted ml-1">
                                (you)
                              </span>
                            )}
                          </span>
                          {entry.badge && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 font-medium">
                              {entry.badge}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-atlas-text-muted">
                          <span>{entry.tweetsPublished} tweets</span>
                          <span>·</span>
                          <span>
                            {formatNumber(entry.totalEngagement)} engagement
                          </span>
                          {entry.consistencyStreak > 0 && (
                            <>
                              <span>·</span>
                              <span>{entry.consistencyStreak}d streak</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Engagement bar */}
                      <div className="w-24 hidden sm:block">
                        <div className="h-1.5 rounded-full bg-atlas-surface overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-atlas-teal to-atlas-teal/40 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <span className="text-sm font-bold text-atlas-text w-14 text-right">
                        {formatNumber(entry.totalEngagement)}
                      </span>

                      {/* Position change from last snapshot */}
                      <span className="w-6 text-center">
                        {(() => {
                          const change = getPositionChange(
                            entry.userId,
                            entry.rank
                          );
                          if (change > 0)
                            return (
                              <span className="flex items-center justify-center text-atlas-success text-xs font-medium">
                                <ChevronUp className="h-3 w-3" />
                                {change}
                              </span>
                            );
                          if (change < 0)
                            return (
                              <span className="flex items-center justify-center text-atlas-error text-xs font-medium">
                                <ChevronDown className="h-3 w-3" />
                                {Math.abs(change)}
                              </span>
                            );
                          return (
                            <Minus className="h-3 w-3 text-atlas-text-muted mx-auto" />
                          );
                        })()}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </GlassCard>

          {/* Sidebar: Selected Entry Breakdown + Team Stats */}
          <div className="space-y-6">
            {/* Entry Breakdown */}
            {viewEntry && (
              <GlassCard maxWidth="full" data-tour="arena-your-rank">
                <h3 className="font-heading font-bold text-sm text-atlas-text mb-1">
                  {viewEntry.userId === user?.id
                    ? "Your Stats"
                    : viewEntry.displayName}
                </h3>
                <p className="text-xs text-atlas-text-muted mb-4">
                  Rank{" "}
                  <span className="text-atlas-text font-bold">
                    #{viewEntry.rank}
                  </span>
                  {viewEntry.badge && (
                    <>
                      {" "}
                      ·{" "}
                      <span className="text-yellow-400 font-medium">
                        {viewEntry.badge}
                      </span>
                    </>
                  )}
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-atlas-text-secondary">
                      <Zap className="h-3 w-3" />
                      Tweets published
                    </span>
                    <span className="text-atlas-text font-medium">
                      {viewEntry.tweetsPublished}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-atlas-text-secondary">
                      <TrendingUp className="h-3 w-3" />
                      Total engagement
                    </span>
                    <span className="text-atlas-text font-medium">
                      {formatNumber(viewEntry.totalEngagement)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-atlas-text-secondary">
                      <Flame className="h-3 w-3" />
                      Consistency streak
                    </span>
                    <span className="text-atlas-text font-medium">
                      {viewEntry.consistencyStreak}d
                    </span>
                  </div>
                  {viewEntry.badge && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-atlas-text-secondary">
                        <Award className="h-3 w-3" />
                        Badge
                      </span>
                      <span className="text-yellow-400 font-medium">
                        {viewEntry.badge}
                      </span>
                    </div>
                  )}
                </div>
              </GlassCard>
            )}

            {/* Team Stats */}
            <GlassCard maxWidth="full">
              <h3 className="font-heading font-bold text-sm text-atlas-text mb-3">
                Team Stats
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-atlas-text-secondary">
                    Total analysts
                  </span>
                  <span className="text-atlas-text font-medium">
                    {displayEntries.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-atlas-text-secondary">
                    Active (with tweets)
                  </span>
                  <span className="text-atlas-text font-medium">
                    {
                      displayEntries.filter((e) => e.tweetsPublished > 0)
                        .length
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-atlas-text-secondary">
                    Avg engagement
                  </span>
                  <span className="text-atlas-text font-medium">
                    {formatNumber(avgEngagement)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-atlas-text-secondary">
                    Total tweets
                  </span>
                  <span className="text-atlas-text font-medium">
                    {totalTweets}
                  </span>
                </div>
              </div>
            </GlassCard>

            {/* Manager Controls */}
            {isManager && (
              <GlassCard maxWidth="full">
                <h3 className="font-heading font-bold text-sm text-atlas-text mb-3">
                  Manager Tools
                </h3>

                {actionFeedback && (
                  <div
                    className={`mb-3 rounded-lg px-3 py-2 text-xs ${
                      actionFeedback.type === "success"
                        ? "bg-atlas-success/10 text-atlas-success"
                        : "bg-atlas-error/10 text-atlas-error"
                    }`}
                  >
                    {actionFeedback.message}
                  </div>
                )}

                <div className="space-y-2">
                  <GradientButton
                    fullWidth
                    size="sm"
                    variant="outline"
                    onClick={() => handleManagerAction("sendNudge")}
                    disabled={actionLoading !== null}
                  >
                    {actionLoading === "sendNudge" ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" /> Sending...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="h-3 w-3" /> Nudge Inactive
                      </span>
                    )}
                  </GradientButton>

                  <GradientButton
                    fullWidth
                    size="sm"
                    variant="outline"
                    onClick={() => handleManagerAction("pushStyle")}
                    disabled={actionLoading !== null}
                  >
                    {actionLoading === "pushStyle" ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" /> Pushing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Volume2 className="h-3 w-3" /> Push Voice Style
                      </span>
                    )}
                  </GradientButton>

                  <GradientButton
                    fullWidth
                    size="sm"
                    variant="outline"
                    onClick={() => handleManagerAction("pushTopProfiles")}
                    disabled={actionLoading !== null}
                  >
                    {actionLoading === "pushTopProfiles" ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" /> Pushing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <TrendingUp className="h-3 w-3" /> Push Top Profiles
                      </span>
                    )}
                  </GradientButton>
                </div>

                {/* Inactive Analysts */}
                {inactiveEntries.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-glass-border">
                    <div className="flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="h-3 w-3 text-atlas-warning" />
                      <p className="text-xs text-atlas-warning font-medium">
                        Inactive ({inactiveEntries.length})
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      {inactiveEntries.slice(0, 5).map((entry) => (
                        <div
                          key={entry.userId}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-atlas-text-secondary truncate">
                            {entry.displayName}
                          </span>
                          <span className="text-atlas-text-muted shrink-0">
                            #{entry.rank}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function ArenaPageGated() {
  return (
    <FeatureGate flagKey="arena">
      <ArenaPage />
    </FeatureGate>
  );
}

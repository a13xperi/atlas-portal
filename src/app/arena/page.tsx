"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import { useAuth } from "@/lib/auth";
import { api, TeamAnalyst } from "@/lib/api";
import { rankTeam, RankedAnalyst, TIERS } from "@/lib/atlas-score";
import { Trophy, TrendingUp, Flame, Minus, Zap, BarChart3, Loader2, AlertTriangle, Send, Volume2, ChevronUp, ChevronDown } from "lucide-react";
import { getSuperlatives } from "@/lib/arena-superlatives";
import { saveSnapshot, getPositionChange, isSnapshotStale } from "@/lib/arena-history";
import { cacheMyTier } from "@/lib/arena-tier-cache";

const SCORE_LABELS: Record<string, string> = {
  output: "Output",
  postRate: "Post Rate",
  engagement: "Engagement",
  maturity: "Voice",
  feedback: "Feedback",
  streak: "Streak",
};

const SCORE_MAX: Record<string, number> = {
  output: 250,
  postRate: 200,
  engagement: 200,
  maturity: 150,
  feedback: 100,
  streak: 100,
};

function PositionBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400/20 text-yellow-400 text-sm font-bold">
        1
      </span>
    );
  if (rank === 2)
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-300/20 text-slate-300 text-sm font-bold">
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

export default function ArenaPage() {
  const { user } = useAuth();
  const [analysts, setAnalysts] = useState<TeamAnalyst[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalyst, setSelectedAnalyst] = useState<RankedAnalyst | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const isManager = user?.role === "MANAGER" || user?.role === "ADMIN";

  const loadData = useCallback(async () => {
    try {
      const { analysts: data } = await api.analytics.team();
      setAnalysts(data);
    } catch (e) {
      console.error("Failed to load team:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!actionFeedback) return;
    const timer = setTimeout(() => setActionFeedback(null), 5000);
    return () => clearTimeout(timer);
  }, [actionFeedback]);

  const handleManagerAction = async (action: "pushTopProfiles" | "sendNudge" | "pushStyle") => {
    if (!user || actionLoading) return;
    const confirmMsg =
      action === "sendNudge" ? "Send a nudge to all inactive analysts?" :
      action === "pushStyle" ? "Push this voice style to all analysts?" :
      "Push top-performing voice profiles to the team?";
    if (!confirm(confirmMsg)) return;

    setActionLoading(action);
    setActionFeedback(null);
    try {
      const res =
        action === "pushTopProfiles" ? await api.users.pushTopProfiles() :
        action === "sendNudge" ? await api.users.sendNudge() :
        await api.users.pushStyle();
      setActionFeedback({ message: res.message || `Done (${res.affected} affected)`, type: "success" });
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

  const ranked = rankTeam(analysts);
  const myEntry = ranked.find((r) => r.analyst.id === user?.id);
  const viewEntry = selectedAnalyst || myEntry;
  const inactiveAnalysts = ranked.filter(
    (r) => r.analyst._count.sessions === 0 && r.analyst._count.tweetDrafts === 0
  );

  // Cache user's tier for NavBar badge
  useEffect(() => {
    if (myEntry) {
      cacheMyTier(myEntry.tier.name, myEntry.score.total, myEntry.rank);
    }
  }, [myEntry]);

  // Save snapshot for position tracking (refresh every 6 hours)
  useEffect(() => {
    if (ranked.length > 0 && isSnapshotStale()) {
      // Delay save so we can show changes from previous snapshot first
      const timer = setTimeout(() => saveSnapshot(ranked), 3000);
      return () => clearTimeout(timer);
    }
  }, [ranked]);

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
            <p className="mt-1 text-sm text-atlas-text-secondary">
              Compete with your team — rank up by crafting, refining, and posting.
            </p>
          </div>
          {myEntry && (
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${myEntry.tier.color}`}>
                {myEntry.tier.name}
              </span>
              <span className="text-2xl font-bold text-atlas-text">
                {myEntry.score.total}
              </span>
            </div>
          )}
        </div>

        {/* Hero KPI Cards */}
        {myEntry && (
          <div className="grid grid-cols-3 gap-4">
            <GlassCard className="text-center">
              <p className="text-xs text-atlas-text-secondary uppercase tracking-wide">
                Output
              </p>
              <p className="text-3xl font-bold text-atlas-text mt-1">
                {myEntry.analyst._count.tweetDrafts}
              </p>
              <p className="text-xs text-atlas-text-muted">drafts</p>
            </GlassCard>
            <GlassCard className="text-center">
              <TrendingUp className="h-4 w-4 text-atlas-teal mx-auto mb-1" />
              <p className="text-xs text-atlas-text-secondary uppercase tracking-wide">
                Engagement
              </p>
              <p className="text-3xl font-bold text-atlas-teal mt-1">
                {myEntry.score.engagement}
              </p>
              <p className="text-xs text-atlas-text-muted">/ 200</p>
            </GlassCard>
            <GlassCard className="text-center">
              <Flame className="h-4 w-4 text-orange-400 mx-auto mb-1" />
              <p className="text-xs text-atlas-text-secondary uppercase tracking-wide">
                Streak
              </p>
              <p className="text-3xl font-bold text-orange-400 mt-1">
                {Math.round(myEntry.score.streak / 5)}d
              </p>
              <p className="text-xs text-atlas-text-muted">active</p>
            </GlassCard>
          </div>
        )}

        {/* Superlatives */}
        {ranked.length > 0 && (() => {
          const superlatives = getSuperlatives(ranked);
          const ICONS = {
            climb: TrendingUp,
            streak: Flame,
            engage: BarChart3,
            output: Zap,
          };
          return superlatives.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {superlatives.map((s) => {
                const Icon = ICONS[s.icon];
                return (
                  <div
                    key={s.label}
                    className="flex items-center gap-3 rounded-2xl border border-glass-border bg-glass px-4 py-3"
                  >
                    <Icon className="h-4 w-4 text-atlas-teal shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-atlas-text-muted">{s.label}</p>
                      <p className="text-sm text-atlas-text font-medium truncate">
                        @{s.handle}{" "}
                        <span className="text-atlas-text-secondary font-normal">
                          — {s.value}
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null;
        })()}

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Leaderboard */}
          <GlassCard maxWidth="full">
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
            ) : (
              <div className="space-y-2">
                {ranked.map((entry) => {
                  const isMe = entry.analyst.id === user?.id;
                  const isSelected = viewEntry?.analyst.id === entry.analyst.id;
                  return (
                    <button
                      key={entry.analyst.id}
                      type="button"
                      onClick={() => setSelectedAnalyst(entry)}
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
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-medium ${isMe ? "text-atlas-teal" : "text-atlas-text"}`}
                          >
                            @{entry.analyst.handle}
                            {isMe && (
                              <span className="text-xs text-atlas-text-muted ml-1">
                                (you)
                              </span>
                            )}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${entry.tier.bgColor} ${entry.tier.color}`}
                          >
                            {entry.tier.name}
                          </span>
                        </div>
                      </div>

                      {/* Score bar */}
                      <div className="w-24 hidden sm:block">
                        <div className="h-1.5 rounded-full bg-atlas-surface overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-atlas-teal to-atlas-teal/40 transition-all"
                            style={{
                              width: `${(entry.score.total / 1000) * 100}%`,
                            }}
                          />
                        </div>
                      </div>

                      <span className="text-sm font-bold text-atlas-text w-12 text-right">
                        {entry.score.total}
                      </span>

                      {/* Position change from last snapshot */}
                      <span className="w-6 text-center">
                        {(() => {
                          const change = getPositionChange(entry.analyst.id, entry.rank);
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
                          return <Minus className="h-3 w-3 text-atlas-text-muted mx-auto" />;
                        })()}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </GlassCard>

          {/* Sidebar: Score Breakdown + Team Stats */}
          <div className="space-y-6">
            {/* Score Breakdown */}
            {viewEntry && (
              <GlassCard maxWidth="full">
                <h3 className="font-heading font-bold text-sm text-atlas-text mb-1">
                  {viewEntry.analyst.id === user?.id
                    ? "Your Breakdown"
                    : `@${viewEntry.analyst.handle}`}
                </h3>
                <p className="text-xs text-atlas-text-muted mb-4">
                  Score:{" "}
                  <span className="text-atlas-text font-bold">
                    {viewEntry.score.total}
                  </span>{" "}
                  / 1000
                </p>

                <div className="space-y-3">
                  {(
                    Object.keys(SCORE_LABELS) as Array<
                      keyof typeof SCORE_LABELS
                    >
                  ).map((key) => {
                    const value =
                      viewEntry.score[key as keyof typeof viewEntry.score];
                    const max = SCORE_MAX[key];
                    const pct = typeof value === "number" ? (value / max) * 100 : 0;
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-atlas-text-secondary">
                            {SCORE_LABELS[key]}
                          </span>
                          <span className="text-atlas-text">
                            {typeof value === "number" ? value : 0} / {max}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-atlas-surface overflow-hidden">
                          <div
                            className="h-full rounded-full bg-atlas-teal transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
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
                    {ranked.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-atlas-text-secondary">
                    Active (with drafts)
                  </span>
                  <span className="text-atlas-text font-medium">
                    {ranked.filter((r) => r.analyst._count.tweetDrafts > 0).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-atlas-text-secondary">Avg score</span>
                  <span className="text-atlas-text font-medium">
                    {ranked.length > 0
                      ? Math.round(
                          ranked.reduce((s, r) => s + r.score.total, 0) /
                            ranked.length
                        )
                      : 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-atlas-text-secondary">
                    Total drafts
                  </span>
                  <span className="text-atlas-text font-medium">
                    {ranked.reduce(
                      (s, r) => s + r.analyst._count.tweetDrafts,
                      0
                    )}
                  </span>
                </div>
              </div>

              {/* Tier Distribution */}
              <div className="mt-4 pt-4 border-t border-glass-border">
                <p className="text-xs text-atlas-text-muted uppercase tracking-wide mb-2">
                  Tier distribution
                </p>
                {TIERS.map((tier) => {
                  const count = ranked.filter(
                    (r) => r.tier.name === tier.name
                  ).length;
                  return (
                    <div
                      key={tier.name}
                      className="flex items-center justify-between text-xs py-1"
                    >
                      <span className={tier.color}>{tier.name}</span>
                      <span className="text-atlas-text-secondary">
                        {count}
                      </span>
                    </div>
                  );
                })}
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
                {inactiveAnalysts.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-glass-border">
                    <div className="flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="h-3 w-3 text-atlas-warning" />
                      <p className="text-xs text-atlas-warning font-medium">
                        Inactive ({inactiveAnalysts.length})
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      {inactiveAnalysts.slice(0, 5).map((entry) => (
                        <div
                          key={entry.analyst.id}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-atlas-text-secondary truncate">
                            @{entry.analyst.handle}
                          </span>
                          <span className="text-atlas-text-muted shrink-0">
                            {entry.tier.name}
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

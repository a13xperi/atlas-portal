"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import StatusPill from "@/components/ui/StatusPill";
import GradientButton from "@/components/ui/GradientButton";
import { useAuth } from "@/lib/auth";
import { api, TweetDraft, QueuedDraft, TrendingTopic } from "@/lib/api";
import { PenTool, Bell, BarChart3, Mic2, BookOpen, Users, TrendingUp, X, Clock, Zap, Calendar, Sparkles, ArrowRight, Trophy, Megaphone } from "lucide-react";
import DashboardSkeleton from "@/components/skeletons/DashboardSkeleton";
import OracleWidget from "@/components/oracle/OracleWidget";
import { useRouteEnabled, useFeatureFlags } from "@/lib/feature-flags";

const navCards = [
  { label: "Crafting Station", href: "/crafting", icon: PenTool },
  { label: "Voice Lab", href: "/voice-profiles", icon: Mic2 },
  { label: "Voice Library", href: "/team-library", icon: BookOpen },
  { label: "Campaigns", href: "/campaigns", icon: Megaphone },
  { label: "Arena", href: "/arena", icon: Trophy },
  { label: "Signals", href: "/alerts", icon: Bell },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Management", href: "/management", icon: Users },
];

const defaultStats = {
  drafts: 0,
  posts: 0,
  feedback: 0,
  reports: 0,
};

export default function DashboardPage() {
  const router = useRouter();
const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const isRouteEnabled = useRouteEnabled();
  const { isEnabled } = useFeatureFlags();
  const visibleNavCards = navCards.filter(card => isRouteEnabled(card.href));
  const [stats, setStats] = useState(defaultStats);
  const [drafts, setDrafts] = useState<TweetDraft[]>([]);
  const [quickDraft, setQuickDraft] = useState("");
  const [quickDrafting, setQuickDrafting] = useState(false);
  const [engagementDraftId, setEngagementDraftId] = useState<string | null>(null);
  const [expandedDraftId, setExpandedDraftId] = useState<string | null>(null);
  const [engagementForm, setEngagementForm] = useState({ likes: "", retweets: "", impressions: "" });
  const [engagementSaving, setEngagementSaving] = useState(false);
  const [queue, setQueue] = useState<QueuedDraft[]>([]);
  const [trending, setTrending] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissedCompletionBanner, setDismissedCompletionBanner] =
    useState(false);
  const [briefingText, setBriefingText] = useState<string | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const briefingFiredRef = useRef(false);
  const completionBanner = searchParams.get("banner");
  const showVoiceCalibratedBanner =
    completionBanner === "voice-calibrated" && !dismissedCompletionBanner;

  useEffect(() => {
    setDismissedCompletionBanner(false);
  }, [completionBanner]);

  useEffect(() => {
    if (authLoading || !user) return;

    let cancelled = false;

    const loadDashboard = async () => {
      setLoading(true);
      setError(null);

      let hasWarning = false;

      const loadStats = async () => {
        try {
          const response = await api.analytics.summary();
          if (cancelled) {
            return;
          }

          const nextStats = {
            drafts: response.summary?.draftsCreated ?? 0,
            posts: response.summary?.draftsPosted ?? 0,
            feedback: response.summary?.feedbackGiven ?? 0,
            reports: response.summary?.reportsIngested ?? 0,
          };
          setStats(nextStats);

          if (!briefingFiredRef.current) {
            briefingFiredRef.current = true;
            setBriefingLoading(true);
            const nudge =
              nextStats.drafts > 0 && nextStats.posts === 0
                ? "Nudge them to ship one."
                : nextStats.posts > 0
                  ? "Acknowledge momentum and suggest next action."
                  : "Encourage them to drop their first report.";
            api.oracle
              .chat({
                page: "dashboard",
                messages: [
                  {
                    role: "user",
                    content: `Generate a concise daily briefing (2-3 sentences) for ${user.displayName || user.handle || "an analyst"}. They have created ${nextStats.drafts} drafts this period, posted ${nextStats.posts} to X. ${nudge} Keep it direct, confident, and specific. No fluff.`,
                  },
                ],
              })
              .then((r) => {
                if (!cancelled) setBriefingText(r.text);
              })
              .catch(() => null)
              .finally(() => {
                if (!cancelled) setBriefingLoading(false);
              });
          }
        } catch {
          if (cancelled) {
            return;
          }

          hasWarning = true;
          setStats(defaultStats);
        }
      };

      const loadTrending = async () => {
        try {
          const response = await api.trending.topics();
          if (!cancelled) setTrending(response.topics?.slice(0, 3) ?? []);
        } catch {}
      };

      const loadDrafts = async () => {
        try {
          const response = await api.drafts.list();
          if (cancelled) {
            return;
          }

          setDrafts(response.drafts.slice(0, 5));
        } catch {
          if (cancelled) {
            return;
          }

          hasWarning = true;
          setDrafts([]);
        }
      };

      const loadQueue = async () => {
        try {
          const response = await api.drafts.queue();
          if (!cancelled) setQueue(response.queue ?? []);
        } catch {}
      };

      await Promise.all([loadStats(), loadDrafts(), loadTrending(), loadQueue()]);

      if (cancelled) {
        return;
      }

      if (hasWarning) {
        setError("Some dashboard data is temporarily unavailable.");
      }

      setLoading(false);
    };

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  // Use actual loaded drafts count as a floor when analytics summary lags behind the drafts table
  const statCards = [
    { label: "Drafts this week", value: String(stats.drafts > 0 ? stats.drafts : drafts.length), href: "/crafting" },
    { label: "Posts", value: String(stats.posts), href: "/campaigns?tab=posted" },
    { label: "Feedback given", value: String(stats.feedback), href: "/analytics" },
    { label: "Reports ingested", value: String(stats.reports), href: "/crafting" },
  ];

  const statusMap: Record<string, "draft" | "posted" | "feedback"> = {
    DRAFT: "draft",
    POSTED: "posted",
    APPROVED: "feedback",
    ARCHIVED: "draft",
  };
  const showStatsEmptyState = stats.drafts === 0 && stats.posts === 0;

  const handleEngagementSubmit = async (draftId: string) => {
    const likes = parseInt(engagementForm.likes) || 0;
    const retweets = parseInt(engagementForm.retweets) || 0;
    const impressions = parseInt(engagementForm.impressions) || 0;
    if (likes === 0 && retweets === 0 && impressions === 0) return;
    setEngagementSaving(true);
    try {
      const res = await api.drafts.recordEngagement(draftId, { likes, retweets, impressions });
      setDrafts((prev) => prev.map((d) => d.id === draftId ? { ...d, actualEngagement: res.draft?.actualEngagement ?? likes + retweets } : d));
      setEngagementDraftId(null);
      setEngagementForm({ likes: "", retweets: "", impressions: "" });
    } catch {
      // Silently handle
    }
    setEngagementSaving(false);
  };

  const handleQuickDraftSubmit = () => {
    const trimmedDraft = quickDraft.trim();

    if (!trimmedDraft) {
      return;
    }

    setQuickDrafting(true);
    router.push(`/crafting?draft=${encodeURIComponent(trimmedDraft)}`);
  };

  if (loading) {
    return (
      <AppShell>
        <DashboardSkeleton />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="font-heading font-bold tracking-tight text-2xl text-atlas-text">
        Welcome back, {user?.handle || "Analyst"}
      </h1>
      <p className="mt-2 max-w-2xl text-atlas-text-secondary">
        Your command center. See what&apos;s queued, track recent activity, and
        jump to any part of Atlas from here.
      </p>

      {showVoiceCalibratedBanner && (
        <div
          role="status"
          aria-live="polite"
          className="mt-4 flex items-start justify-between rounded-lg border border-atlas-teal/20 bg-atlas-teal/10 px-4 py-3 text-sm"
        >
          <div>
            <p className="font-semibold text-atlas-teal">Voice calibrated!</p>
            <p className="mt-1 text-atlas-text-secondary">
              Atlas is ready to draft in your baseline voice.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDismissedCompletionBanner(true)}
            aria-label="Dismiss onboarding success banner"
            className="ml-3 text-atlas-text-secondary hover:text-atlas-text"
          >
            ✕
          </button>
        </div>
      )}

      <div className="mt-4" data-tour="oracle-banner">
        <OracleWidget
          message={
            briefingLoading
              ? "Generating your briefing…"
              : briefingText ??
                (stats.drafts > 0
                  ? `You've crafted ${stats.drafts} draft${stats.drafts === 1 ? "" : "s"} this month.`
                  : "Your voice profile is set up. Head to the Crafting Station.")
          }
          context="dashboard"
          actionLabel="Tell me more"
          onAction={() => window.dispatchEvent(new Event("oracle:open"))}
        />
      </div>

      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-4 mt-4 flex items-center justify-between rounded-lg border border-atlas-warning/20 bg-atlas-warning/5 px-4 py-2 text-sm text-atlas-warning"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Dismiss dashboard warning"
            className="ml-2 text-atlas-text-secondary hover:text-atlas-text"
          >
            ✕
          </button>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-glass-border bg-atlas-surface p-4">
        <label
          htmlFor="quick-draft-input"
          className="mb-2 block text-xs text-atlas-text-secondary"
        >
          Quick Draft
        </label>
        <div className="flex gap-2">
          <input
            id="quick-draft-input"
            name="quickDraft"
            type="text"
            value={quickDraft}
            onChange={(event) => setQuickDraft(event.target.value)}
            placeholder="Drop a hot take or paste an article URL..."
            autoComplete="off"
            disabled={quickDrafting}
            className="flex-1 rounded-lg border border-glass-border bg-atlas-bg px-3 py-2 text-sm text-atlas-text placeholder-atlas-text-muted focus:border-atlas-teal focus:outline-none"
            onKeyDown={(event) => {
              if (event.key === "Enter" && quickDraft.trim()) {
                handleQuickDraftSubmit();
              }
            }}
          />
          <GradientButton
            size="sm"
            onClick={handleQuickDraftSubmit}
            disabled={quickDrafting || !quickDraft.trim()}
          >
            Draft
          </GradientButton>
        </div>
      </div>

      <ul className="mt-4 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <li key={stat.label}>
            <Link
              href={stat.href}
              className="bg-atlas-surface border border-glass-border rounded-2xl p-6 card-interactive group block"
              aria-label={`${stat.label}: ${stat.value}`}
            >
              <span className="text-atlas-text-secondary text-sm group-hover:text-atlas-teal transition-colors">
                {stat.label}
              </span>
              <span className="block text-[30px] font-semibold mt-1 text-atlas-text">
                {stat.value}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {showStatsEmptyState && (
        <p className="text-xs text-atlas-text-muted mt-1">
          Get started by crafting your first draft
        </p>
      )}

      <div className="mt-6">
{trending.length > 0 ? (
          <div className="rounded-2xl border border-glass-border bg-atlas-surface p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-atlas-teal">Trending Now</p>
              {isEnabled("signals") && (
                <Link href="/alerts" className="text-xs text-atlas-text-muted hover:text-atlas-teal transition-colors">View all signals &rarr;</Link>
              )}
            </div>
            <div className="mt-3 space-y-2">
              {trending.map((topic) => (
                <Link key={topic.id} href={`/crafting?content=${encodeURIComponent(topic.headline || topic.topic)}`} className="flex items-center justify-between rounded-xl bg-atlas-bg/40 px-4 py-3 group card-interactive">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-atlas-text truncate group-hover:text-atlas-teal transition-colors">{topic.headline || topic.topic}</p>
                    {topic.sentiment && (
                      <p className={`mt-0.5 text-[10px] uppercase tracking-wide ${topic.sentiment === "bullish" ? "text-atlas-success" : topic.sentiment === "bearish" ? "text-atlas-error" : "text-atlas-text-muted"}`}>{topic.sentiment}</p>
                    )}
                  </div>
                  <span className="ml-3 shrink-0 text-[10px] text-atlas-text-muted group-hover:text-atlas-teal transition-colors">Draft &rarr;</span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {isEnabled("briefing") && (
      <Link
        href="/briefing"
        className="mt-8 flex items-center justify-between rounded-2xl border border-atlas-teal/20 bg-gradient-to-r from-atlas-teal/5 to-transparent p-5 ring-1 ring-atlas-teal/10 transition-all hover:ring-atlas-teal/30 hover:shadow-lg hover:shadow-atlas-teal/5"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-atlas-teal/10">
            <Sparkles className="h-5 w-5 text-atlas-teal" />
          </div>
          <div>
            <p className="text-sm font-semibold text-atlas-text">Brief: AI-powered tweet ideas</p>
            <p className="text-xs text-atlas-text-secondary">Pick sources, get tweet angles instantly. Zero thinking required.</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs font-medium text-atlas-teal">
          Try Brief <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </Link>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visibleNavCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            data-testid={`nav-card-${card.label.toLowerCase().replace(/\s+/g, "-")}`}
            className="card-interactive flex flex-col items-center gap-3 rounded-2xl border border-glass-border bg-atlas-surface p-6 text-center text-atlas-text"
          >
            <card.icon className="w-5 h-5 text-atlas-teal" aria-hidden="true" />
            {card.label}
          </Link>
        ))}
      </div>

      {isEnabled("queue") && queue.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-atlas-teal" />
              <p className="text-sm font-semibold text-atlas-text">Your Queue</p>
              <span className="rounded-full bg-atlas-teal/15 px-2 py-0.5 text-[10px] font-medium text-atlas-teal">{queue.length} ready</span>
            </div>
          </div>
          <div className="space-y-3">
            {queue.map((item, index) => {
              const suggestedTime = new Date(item.suggestedAt);
              const isToday = suggestedTime.toDateString() === new Date().toDateString();
              const timeLabel = isToday
                ? suggestedTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
                : suggestedTime.toLocaleDateString([], { weekday: "short", hour: "numeric", minute: "2-digit" });

              return (
                <div key={item.id} className="rounded-xl border border-glass-border bg-atlas-surface p-4 transition-colors hover:border-atlas-teal/30">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        {index === 0 && (
                          <span className="rounded bg-atlas-teal/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-atlas-teal">Next up</span>
                        )}
                        {item.sourceType && (
                          <span className="rounded bg-atlas-nav px-1.5 py-0.5 text-[10px] text-atlas-text-muted">{item.sourceType.replace("_", " ")}</span>
                        )}
                        <span className="text-[10px] text-atlas-text-muted">Score: {item._score}</span>
                      </div>
                      <p className="text-sm leading-relaxed text-atlas-text">{item.content.length > 140 ? `${item.content.slice(0, 140)}...` : item.content}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <div className="flex items-center gap-1 text-xs text-atlas-text-muted">
                        <Clock className="h-3 w-3" />
                        <span>{timeLabel}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => void api.drafts.schedule(item.id, item.suggestedAt).then(() => {
                            setQueue((q) => q.map((d) => d.id === item.id ? { ...d, status: "SCHEDULED" as const } : d));
                          })}
                          className="rounded-lg border border-glass-border px-2.5 py-1 text-[11px] font-medium text-atlas-text-secondary transition-colors hover:border-atlas-teal hover:text-atlas-teal"
                        >
                          <Calendar className="mr-1 inline h-3 w-3" />Schedule
                        </button>
                        <button
                          onClick={() => void api.drafts.postToX(item.id).then(() => {
                            setQueue((q) => q.filter((d) => d.id !== item.id));
                          })}
                          className="rounded-lg bg-atlas-teal px-2.5 py-1 text-[11px] font-semibold text-atlas-bg transition-opacity hover:opacity-90"
                        >
                          Post Now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <Link href="/queue" className="mt-3 block text-center text-xs text-atlas-teal hover:underline">View full queue →</Link>
        </div>
      )}

      <div className="mt-8">
        <p className="text-atlas-text-secondary text-sm mb-4">Recent activity</p>
        {drafts.length > 0 ? (
          <div className="bg-atlas-surface border border-glass-border rounded-2xl divide-y divide-glass-border">
            {drafts.map((draft) => (
              <div key={draft.id} className="px-4 py-3 sm:px-6 sm:py-4 transition-colors hover:bg-white/[0.02]">
                <button
                  type="button"
                  onClick={() => setExpandedDraftId(expandedDraftId === draft.id ? null : draft.id)}
                  className="flex w-full flex-col items-start gap-2 text-left sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="min-w-0 text-xs text-atlas-text sm:text-sm group-hover:text-white">
                    {expandedDraftId === draft.id ? draft.content : `${draft.content.slice(0, 60)}...`}
                  </span>
                  <div className="flex items-center gap-2">
                    {draft.status === "POSTED" && !draft.actualEngagement && (
                      <button
                        onClick={() => setEngagementDraftId(engagementDraftId === draft.id ? null : draft.id)}
                        className="flex items-center gap-1 rounded-lg border border-atlas-teal/30 px-2 py-1 text-xs text-atlas-teal transition-colors hover:bg-atlas-teal/10"
                      >
                        <TrendingUp className="h-3 w-3" />
                        Record Engagement
                      </button>
                    )}
                    {draft.status === "POSTED" && draft.actualEngagement && (
                      <span className="text-xs text-emerald-400">{draft.actualEngagement.toLocaleString()} eng.</span>
                    )}
                    <StatusPill label={draft.status} variant={statusMap[draft.status] || "draft"} />
                  </div>
                </button>
                {expandedDraftId === draft.id && (
                  <div className="mt-3 rounded-xl border border-glass-border bg-atlas-bg/80 p-4">
                    <p className="text-sm leading-relaxed text-atlas-text">{draft.content}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-atlas-text-muted">
                      {draft.sourceType && <span className="rounded bg-atlas-nav px-2 py-0.5">{draft.sourceType.replace("_", " ")}</span>}
                      {draft.confidence != null && <span>Confidence: {Math.round(draft.confidence * 100)}%</span>}
                      {draft.predictedEngagement != null && <span>Predicted: {draft.predictedEngagement.toLocaleString()} eng.</span>}
                      <span>{new Date(draft.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => router.push(`/crafting?draft=${draft.id}`)} className="rounded-lg bg-atlas-teal/10 px-3 py-1.5 text-xs font-medium text-atlas-teal transition-colors hover:bg-atlas-teal/20">
                        Open in Crafting
                      </button>
                    </div>
                  </div>
                )}
                {engagementDraftId === draft.id && (
                  <div className="mt-3 flex flex-wrap items-end gap-2 rounded-lg border border-glass-border bg-atlas-bg p-3">
                    <div>
                      <label className="mb-1 block text-[10px] uppercase tracking-wider text-atlas-text-muted">Likes</label>
                      <input type="number" min="0" aria-label="Likes" value={engagementForm.likes} onChange={(e) => setEngagementForm((f) => ({ ...f, likes: e.target.value }))} className="w-20 rounded border border-glass-border bg-atlas-surface px-2 py-1 text-sm text-atlas-text focus:border-atlas-teal focus:outline-none" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] uppercase tracking-wider text-atlas-text-muted">Retweets</label>
                      <input type="number" min="0" aria-label="Retweets" value={engagementForm.retweets} onChange={(e) => setEngagementForm((f) => ({ ...f, retweets: e.target.value }))} className="w-20 rounded border border-glass-border bg-atlas-surface px-2 py-1 text-sm text-atlas-text focus:border-atlas-teal focus:outline-none" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] uppercase tracking-wider text-atlas-text-muted">Impressions</label>
                      <input type="number" min="0" aria-label="Impressions" value={engagementForm.impressions} onChange={(e) => setEngagementForm((f) => ({ ...f, impressions: e.target.value }))} className="w-24 rounded border border-glass-border bg-atlas-surface px-2 py-1 text-sm text-atlas-text focus:border-atlas-teal focus:outline-none" />
                    </div>
                    <button onClick={() => handleEngagementSubmit(draft.id)} disabled={engagementSaving} className="rounded-lg bg-atlas-teal px-3 py-1 text-xs font-medium text-atlas-bg transition-colors hover:bg-atlas-teal/80 disabled:opacity-50">
                      {engagementSaving ? "Saving..." : "Save"}
                    </button>
                    <button onClick={() => setEngagementDraftId(null)} aria-label="Cancel engagement entry" className="rounded-lg px-2 py-1 text-xs text-atlas-text-muted hover:text-atlas-text">
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-glass-border bg-atlas-surface-glass p-8 text-center backdrop-blur-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-atlas-teal/20 to-atlas-teal/20">
              <PenTool className="h-8 w-8 text-atlas-teal" aria-hidden="true" />
            </div>
            <h3 className="mb-2 font-heading font-bold tracking-tight text-xl text-atlas-text">
              Ready to craft your first draft?
            </h3>
            <p className="mx-auto mb-6 max-w-md text-sm text-atlas-text-secondary">
              Atlas helps you write tweets that sound like you. Start by pasting an
              article, entering a hot take, or replying to a trending topic.
            </p>
            <GradientButton onClick={() => router.push("/crafting")}>
              Open Crafting Station
            </GradientButton>
          </div>
        )}
      </div>
    </AppShell>
  );
}

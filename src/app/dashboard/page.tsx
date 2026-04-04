"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import StatusPill from "@/components/ui/StatusPill";
import GradientButton from "@/components/ui/GradientButton";
import { useAuth } from "@/lib/auth";
import { api, TweetDraft } from "@/lib/api";
import { PenTool, Bell, BarChart3, Mic2, BookOpen, Send, Users, TrendingUp, X } from "lucide-react";
import LoopPanel from "@/components/ui/LoopPanel";
import DashboardSkeleton from "@/components/skeletons/DashboardSkeleton";
import OracleWidget from "@/components/oracle/OracleWidget";

const navCards = [
  { label: "Crafting Station", href: "/crafting", icon: PenTool },
  { label: "Alerts + Momentum", href: "/alerts", icon: Bell },
  { label: "Analytics + Predictions", href: "/analytics", icon: BarChart3 },
  { label: "Voice Profiles", href: "/voice-profiles", icon: Mic2 },
  { label: "Team Style Library", href: "/team-library", icon: BookOpen },
  { label: "Telegram Guide", href: "/telegram", icon: Send },
  { label: "Team Management", href: "/management", icon: Users },
];

const defaultStats = {
  drafts: 0,
  posts: 0,
  feedback: 0,
  reports: 0,
};

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState(defaultStats);
  const [drafts, setDrafts] = useState<TweetDraft[]>([]);
  const [quickDraft, setQuickDraft] = useState("");
  const [quickDrafting, setQuickDrafting] = useState(false);
  const [engagementDraftId, setEngagementDraftId] = useState<string | null>(null);
  const [engagementForm, setEngagementForm] = useState({ likes: "", retweets: "", impressions: "" });
  const [engagementSaving, setEngagementSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

          setStats({
            drafts: response.summary?.draftsCreated ?? 0,
            posts: response.summary?.draftsPosted ?? 0,
            feedback: response.summary?.feedbackGiven ?? 0,
            reports: response.summary?.reportsIngested ?? 0,
          });
        } catch {
          if (cancelled) {
            return;
          }

          hasWarning = true;
          setStats(defaultStats);
        }
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

      await Promise.all([loadStats(), loadDrafts()]);

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
  }, []);

  const statCards = [
    { label: "Drafts this week", value: String(stats.drafts), href: "/crafting" },
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

      <div className="mt-4">
        <OracleWidget
          message={
            stats.drafts > 0
              ? `You've crafted ${stats.drafts} draft${stats.drafts === 1 ? "" : "s"} this month — ${stats.posts > 0 ? `${stats.posts} made it to X. Your voice is sharpening.` : "time to post one and see how it lands."}`
              : "Your voice profile is set up. Head to the Crafting Station and turn some alpha into a tweet."
          }
          context="dashboard"
          actionLabel={stats.drafts === 0 ? "Open Crafting Station" : undefined}
          onAction={stats.drafts === 0 ? () => router.push("/crafting") : undefined}
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

      <dl className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-atlas-surface border border-glass-border rounded-2xl p-6 card-interactive group"
          >
            <dt className="text-atlas-text-secondary text-sm group-hover:text-atlas-teal transition-colors">{stat.label}</dt>
            <dd className="text-[30px] font-semibold mt-1 text-atlas-text">
              {stat.value}
            </dd>
          </Link>
        ))}
      </dl>
      {showStatsEmptyState && (
        <p className="text-xs text-atlas-text-muted mt-1">
          Get started by crafting your first draft
        </p>
      )}

      <div className="mt-6">
        <LoopPanel />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {navCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="card-interactive flex flex-col items-center gap-3 rounded-2xl border border-glass-border bg-atlas-surface p-6 text-center text-atlas-text"
          >
            <card.icon className="w-5 h-5 text-atlas-teal" aria-hidden="true" />
            {card.label}
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <p className="text-atlas-text-secondary text-sm mb-4">Recent activity</p>
        {drafts.length > 0 ? (
          <div className="bg-atlas-surface border border-glass-border rounded-2xl divide-y divide-glass-border">
            {drafts.map((draft) => (
              <div key={draft.id} className="px-4 py-3 sm:px-6 sm:py-4">
                <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="min-w-0 text-xs text-atlas-text sm:text-sm">
                    {draft.content.slice(0, 60)}...
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
                </div>
                {engagementDraftId === draft.id && (
                  <div className="mt-3 flex flex-wrap items-end gap-2 rounded-lg border border-glass-border bg-atlas-bg p-3">
                    <div>
                      <label className="mb-1 block text-[10px] uppercase tracking-wider text-atlas-text-muted">Likes</label>
                      <input type="number" min="0" value={engagementForm.likes} onChange={(e) => setEngagementForm((f) => ({ ...f, likes: e.target.value }))} className="w-20 rounded border border-glass-border bg-atlas-surface px-2 py-1 text-sm text-atlas-text focus:border-atlas-teal focus:outline-none" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] uppercase tracking-wider text-atlas-text-muted">Retweets</label>
                      <input type="number" min="0" value={engagementForm.retweets} onChange={(e) => setEngagementForm((f) => ({ ...f, retweets: e.target.value }))} className="w-20 rounded border border-glass-border bg-atlas-surface px-2 py-1 text-sm text-atlas-text focus:border-atlas-teal focus:outline-none" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] uppercase tracking-wider text-atlas-text-muted">Impressions</label>
                      <input type="number" min="0" value={engagementForm.impressions} onChange={(e) => setEngagementForm((f) => ({ ...f, impressions: e.target.value }))} className="w-24 rounded border border-glass-border bg-atlas-surface px-2 py-1 text-sm text-atlas-text focus:border-atlas-teal focus:outline-none" />
                    </div>
                    <button onClick={() => handleEngagementSubmit(draft.id)} disabled={engagementSaving} className="rounded-lg bg-atlas-teal px-3 py-1 text-xs font-medium text-atlas-bg transition-colors hover:bg-atlas-teal/80 disabled:opacity-50">
                      {engagementSaving ? "Saving..." : "Save"}
                    </button>
                    <button onClick={() => setEngagementDraftId(null)} className="rounded-lg px-2 py-1 text-xs text-atlas-text-muted hover:text-atlas-text">
                      <X className="h-3 w-3" />
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

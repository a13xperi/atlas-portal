"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, RefreshCw, PenTool, Zap, FileText, TrendingUp,
  ArrowRight, Clock, Send, Sparkles,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import FeatureGate from "@/components/ui/FeatureGate";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import { useAuth } from "@/lib/auth";
import {
  api, Briefing, BriefingSection, TweetDraft, Alert, AnalyticsSummary,
} from "@/lib/api";

function timeAgo(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function FeedPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [drafts, setDrafts] = useState<TweetDraft[]>([]);
  const [signals, setSignals] = useState<Alert[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [generatingBrief, setGeneratingBrief] = useState(false);

  useEffect(() => {
    Promise.all([
      api.briefing.history().catch(() => ({ briefings: [] })),
      api.drafts.list().catch(() => ({ drafts: [] })),
      api.alerts.feed("SIGNAL").catch(() => ({ alerts: [] })),
      api.analytics.summary().catch(() => ({ summary: null })),
    ])
      .then(([briefRes, draftRes, alertRes, statsRes]) => {
        setBriefing(briefRes.briefings?.[0] ?? null);
        setDrafts(draftRes.drafts?.slice(0, 5) ?? []);
        setSignals(alertRes.alerts?.slice(0, 4) ?? []);
        setSummary(statsRes.summary ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleGenerateBrief = async () => {
    setGeneratingBrief(true);
    try {
      const res = await api.briefing.generate();
      setBriefing(res.briefing);
    } catch {}
    setGeneratingBrief(false);
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-atlas-teal" />
        </div>
      </AppShell>
    );
  }

  const unpostedDrafts = drafts.filter((d) => d.status !== "POSTED");
  const postedCount = summary?.draftsPosted ?? 0;
  const draftCount = summary?.draftsCreated ?? 0;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6 py-8">
        {/* Header */}
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-atlas-teal">
            Feed
          </p>
          <h1 className="mt-1 font-heading font-extrabold tracking-tight text-3xl text-atlas-text sm:text-4xl">
            Good {getGreeting()}, {user?.handle ?? "analyst"}
          </h1>
          <p className="mt-2 text-sm text-atlas-text-secondary">
            Everything that matters today, in one place.
          </p>
        </header>

        {/* Oracle nudge */}
        {draftCount > 0 && postedCount === 0 && (
          <GlassCard maxWidth="full" className="flex items-center gap-4 border-atlas-teal/30">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-atlas-teal/10">
              <Sparkles className="h-5 w-5 text-atlas-teal" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-atlas-text">
                You&apos;ve crafted <strong>{draftCount} drafts</strong> but haven&apos;t posted yet.
                Pick your strongest one and ship it.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/crafting")}
              className="shrink-0 rounded-lg bg-atlas-teal px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-atlas-teal/80"
            >
              Post your first draft
            </button>
          </GlassCard>
        )}

        {/* Today's Brief */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-atlas-text-muted">
              <FileText className="h-4 w-4" />
              Today&apos;s Brief
            </h2>
            <button
              type="button"
              onClick={handleGenerateBrief}
              disabled={generatingBrief}
              className="flex items-center gap-1.5 text-xs font-medium text-atlas-teal transition-colors hover:text-atlas-teal/80 disabled:opacity-50"
            >
              {generatingBrief ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              {generatingBrief ? "Generating..." : "New brief"}
            </button>
          </div>

          {briefing ? (
            <GlassCard maxWidth="full" className="space-y-3">
              <h3 className="font-heading font-bold text-lg text-atlas-text">{briefing.title}</h3>
              <p className="text-sm leading-relaxed text-atlas-text-secondary">{briefing.summary}</p>
              <div className="space-y-3">
                {(briefing.sections as BriefingSection[]).slice(0, 3).map((s, i) => (
                  <div key={i}>
                    <p className="text-xs font-semibold text-atlas-text">
                      {s.emoji} {s.heading}
                    </p>
                    <ul className="mt-1 space-y-0.5 pl-4">
                      {s.bullets.slice(0, 2).map((b, j) => (
                        <li key={j} className="list-disc text-xs text-atlas-text-secondary">{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 border-t border-glass-border pt-3">
                <button
                  type="button"
                  onClick={() => {
                    const content = briefing.summary + "\n\n" + (briefing.sections as BriefingSection[]).map((s) => s.emoji + " " + s.heading + "\n" + s.bullets.join("\n")).join("\n\n");
                    router.push("/crafting?content=" + encodeURIComponent(content));
                  }}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-atlas-teal to-atlas-teal/60 px-4 py-2 text-xs font-semibold text-white transition-all hover:scale-[1.02]"
                >
                  <PenTool className="h-3.5 w-3.5" />
                  Draft from this brief
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/briefing")}
                  className="flex items-center gap-1 text-xs text-atlas-text-muted transition-colors hover:text-atlas-text"
                >
                  Full briefing <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </GlassCard>
          ) : (
            <GlassCard maxWidth="full" className="py-8 text-center">
              <p className="text-sm text-atlas-text-secondary">No briefing yet today.</p>
              <GradientButton onClick={handleGenerateBrief} disabled={generatingBrief}>
                {generatingBrief ? "Generating..." : "Generate your morning brief"}
              </GradientButton>
            </GlassCard>
          )}
        </section>

        {/* Your Drafts */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-atlas-text-muted">
              <PenTool className="h-4 w-4" />
              Your Drafts
            </h2>
            <button
              type="button"
              onClick={() => router.push("/crafting")}
              className="flex items-center gap-1 text-xs font-medium text-atlas-teal hover:text-atlas-teal/80"
            >
              Crafting Station <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {unpostedDrafts.length > 0 ? (
            <div className="space-y-2">
              {unpostedDrafts.slice(0, 4).map((draft) => (
                <GlassCard key={draft.id} maxWidth="full" className="flex items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-atlas-text">{draft.content}</p>
                    <div className="mt-1.5 flex items-center gap-3 text-[10px] text-atlas-text-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {timeAgo(new Date(draft.createdAt))}
                      </span>
                      <span>{draft.content.length}/280</span>
                      {draft.confidence != null && (
                        <span>{Math.round(draft.confidence * 100)}% confidence</span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => router.push("/crafting")}
                      className="rounded-lg border border-glass-border px-3 py-1.5 text-[11px] font-medium text-atlas-text-secondary transition-colors hover:border-atlas-teal/50 hover:text-atlas-teal"
                    >
                      Refine
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(draft.content);
                      }}
                      className="flex items-center gap-1 rounded-lg bg-atlas-teal/10 px-3 py-1.5 text-[11px] font-medium text-atlas-teal transition-colors hover:bg-atlas-teal/20"
                    >
                      <Send className="h-3 w-3" />
                      Copy
                    </button>
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : (
            <GlassCard maxWidth="full" className="py-6 text-center">
              <p className="text-sm text-atlas-text-secondary">No drafts yet.</p>
              <button
                type="button"
                onClick={() => router.push("/crafting")}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-atlas-teal to-atlas-teal/60 px-5 py-2.5 text-sm font-semibold text-white"
              >
                <PenTool className="h-4 w-4" />
                Draft your first post
              </button>
            </GlassCard>
          )}
        </section>

        {/* Live Signals */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-atlas-text-muted">
              <Zap className="h-4 w-4" />
              Live Signals
            </h2>
            <button
              type="button"
              onClick={() => router.push("/alerts")}
              className="flex items-center gap-1 text-xs font-medium text-atlas-teal hover:text-atlas-teal/80"
            >
              All signals <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {signals.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {signals.map((signal) => (
                <GlassCard key={signal.id} maxWidth="full" className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-atlas-teal">
                      {signal.type.replace(/_/g, " ")}
                    </p>
                    <span className="shrink-0 text-[10px] text-atlas-text-muted">
                      {timeAgo(new Date(signal.createdAt))}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-atlas-text">{signal.title}</p>
                  {signal.context && (
                    <p className="line-clamp-2 text-xs text-atlas-text-secondary">{signal.context}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => router.push("/crafting?content=" + encodeURIComponent(signal.title + (signal.context ? "\n\n" + signal.context : "")))}
                    className="flex items-center gap-1.5 text-[11px] font-medium text-atlas-teal transition-colors hover:text-atlas-teal/80"
                  >
                    <PenTool className="h-3 w-3" />
                    Draft a take
                  </button>
                </GlassCard>
              ))}
            </div>
          ) : (
            <GlassCard maxWidth="full" className="py-6 text-center">
              <p className="text-sm text-atlas-text-secondary">No signals right now. Check back later.</p>
            </GlassCard>
          )}
        </section>

        {/* Quick Stats */}
        {summary && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-atlas-text-muted">
              <TrendingUp className="h-4 w-4" />
              This Week
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Drafts", value: summary.draftsCreated },
                { label: "Posted", value: summary.draftsPosted },
                { label: "Feedback", value: summary.feedbackGiven },
                { label: "Ingested", value: summary.reportsIngested },
              ].map((stat) => (
                <GlassCard key={stat.label} maxWidth="full" className="text-center">
                  <p className="text-2xl font-bold text-atlas-text">{stat.value}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-atlas-text-muted">{stat.label}</p>
                </GlassCard>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

export default function FeedPageGated() {
  return (
    <FeatureGate flagKey="feed">
      <FeedPage />
    </FeatureGate>
  );
}

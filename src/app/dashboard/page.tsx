"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import StatusPill from "@/components/ui/StatusPill";
import { useAuth } from "@/lib/auth";
import { api, TweetDraft, AnalyticsSummary } from "@/lib/api";
import { SkeletonStatCard, SkeletonRow } from "@/components/ui/Skeleton";
import { PenTool, Bell, BarChart3, Mic2, BookOpen, Send, Users } from "lucide-react";
import LoopPanel from "@/components/ui/LoopPanel";

const navCards = [
  { label: "Crafting Station", href: "/crafting", icon: PenTool },
  { label: "Alerts + Momentum", href: "/alerts", icon: Bell },
  { label: "Analytics + Predictions", href: "/analytics", icon: BarChart3 },
  { label: "Voice Profiles", href: "/voice-profiles", icon: Mic2 },
  { label: "Team Style Library", href: "/team-library", icon: BookOpen },
  { label: "Telegram Guide", href: "/telegram", icon: Send },
  { label: "Team Management", href: "/management", icon: Users },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [drafts, setDrafts] = useState<TweetDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.analytics.summary().then((r) => setSummary(r.summary)),
      api.drafts.list().then((r) => setDrafts(r.drafts.slice(0, 5))),
    ])
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: "Drafts this week", value: String(summary?.draftsCreated ?? 0) },
    { label: "Posts", value: String(summary?.draftsPosted ?? 0) },
    { label: "Feedback given", value: String(summary?.feedbackGiven ?? 0) },
    { label: "Reports ingested", value: String(summary?.reportsIngested ?? 0) },
  ];

  const statusMap: Record<string, "draft" | "posted" | "feedback"> = {
    DRAFT: "draft",
    POSTED: "posted",
    APPROVED: "feedback",
    ARCHIVED: "draft",
  };

  return (
    <AppShell>
      <h1 className="font-heading text-2xl text-atlas-text">
        Welcome back, {user?.handle || "Analyst"}
      </h1>

      {error && (
        <div role="alert" className="mt-4 px-4 py-3 bg-atlas-error/10 border border-atlas-error/30 rounded-xl text-atlas-error text-sm">
          Failed to load data: {error}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
          : stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-atlas-surface border border-glass-border rounded-2xl p-6"
              >
                <p className="text-atlas-text-secondary text-sm">{stat.label}</p>
                <p className="text-[30px] font-semibold mt-1 text-atlas-text">
                  {stat.value}
                </p>
              </div>
            ))}
      </div>

      <div className="mt-6">
        <LoopPanel />
      </div>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {navCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-atlas-surface border border-glass-border rounded-2xl p-6 text-center text-atlas-text hover:-translate-y-0.5 hover:shadow-lg transition-all flex flex-col items-center gap-3"
          >
            <card.icon className="w-5 h-5 text-atlas-teal" />
            {card.label}
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <p className="text-atlas-text-secondary text-sm mb-4">Recent activity</p>
        <div className="bg-atlas-surface border border-glass-border rounded-2xl divide-y divide-glass-border">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
          ) : drafts.length > 0 ? (
            drafts.map((draft) => (
              <div
                key={draft.id}
                className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 gap-2"
              >
                <span className="text-xs sm:text-sm text-atlas-text truncate">
                  {draft.content.slice(0, 60)}...
                </span>
                <StatusPill
                  label={draft.status}
                  variant={statusMap[draft.status] || "draft"}
                />
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-atlas-text-secondary text-sm">
              No drafts yet. Head to the Crafting Station to create your first tweet.
            </div>
          ) }
        </div>
      </div>
    </AppShell>
  );
}

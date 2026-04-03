"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import StatusPill from "@/components/ui/StatusPill";
import { useAuth } from "@/lib/auth";
import { api, TweetDraft } from "@/lib/api";
import { PenTool, Bell, BarChart3, Mic2, BookOpen, Send, Users } from "lucide-react";
import LoopPanel from "@/components/ui/LoopPanel";
import DashboardSkeleton from "@/components/skeletons/DashboardSkeleton";

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
  const { user } = useAuth();
  const [stats, setStats] = useState(defaultStats);
  const [drafts, setDrafts] = useState<TweetDraft[]>([]);
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
    { label: "Drafts this week", value: String(stats.drafts) },
    { label: "Posts", value: String(stats.posts) },
    { label: "Feedback given", value: String(stats.feedback) },
    { label: "Reports ingested", value: String(stats.reports) },
  ];

  const statusMap: Record<string, "draft" | "posted" | "feedback"> = {
    DRAFT: "draft",
    POSTED: "posted",
    APPROVED: "feedback",
    ARCHIVED: "draft",
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
      <h1 className="font-heading text-2xl text-atlas-text">
        Welcome back, {user?.handle || "Analyst"}
      </h1>

      {error && (
        <div className="mb-4 mt-4 flex items-center justify-between rounded-lg border border-atlas-warning/20 bg-atlas-warning/5 px-4 py-2 text-sm text-atlas-warning">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-2 text-atlas-text-secondary hover:text-atlas-text"
          >
            ✕
          </button>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
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

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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
          {drafts.length > 0 ? (
            drafts.map((draft) => (
              <div
                key={draft.id}
                className="flex flex-col items-start gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4"
              >
                <span className="min-w-0 text-xs text-atlas-text sm:text-sm">
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
          )}
        </div>
      </div>
    </AppShell>
  );
}

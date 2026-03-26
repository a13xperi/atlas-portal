"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import StatusPill from "@/components/ui/StatusPill";
import { useAuth } from "@/lib/auth";
import { api, TweetDraft, AnalyticsSummary } from "@/lib/api";

const navCards = [
  { label: "Crafting Station", href: "/crafting" },
  { label: "Alerts + Momentum", href: "/alerts" },
  { label: "Analytics + Predictions", href: "/analytics" },
  { label: "Voice Profiles", href: "/voice-profiles" },
  { label: "Team Style Library", href: "/team-library" },
  { label: "Telegram Guide", href: "/telegram" },
  { label: "Team Management", href: "/management" },
];

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [drafts, setDrafts] = useState<TweetDraft[]>([]);

  useEffect(() => {
    if (!token) return;
    api.analytics.summary(token).then((r) => setSummary(r.summary)).catch(() => {});
    api.drafts.list(token).then((r) => setDrafts(r.drafts.slice(0, 5))).catch(() => {});
  }, [token]);

  const stats = [
    { label: "Drafts this week", value: String(summary?.draftsCreated ?? 0) },
    { label: "Posts", value: String(summary?.draftsPosted ?? 0) },
    { label: "Feedback given", value: String(summary?.feedbackGiven ?? 0), color: "text-atlas-success" },
    { label: "Reports ingested", value: String(summary?.reportsIngested ?? 0), color: "text-atlas-teal" },
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

      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-atlas-surface border border-glass-border rounded-2xl p-6"
          >
            <p className="text-atlas-text-secondary text-sm">{stat.label}</p>
            <p className={`text-2xl font-semibold mt-1 ${stat.color || "text-atlas-text"}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-2 lg:grid-cols-3 gap-4">
        {navCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-atlas-surface border border-glass-border rounded-2xl p-6 text-center text-atlas-text hover:-translate-y-0.5 hover:shadow-lg transition-all"
          >
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
          )}
        </div>
      </div>
    </AppShell>
  );
}

"use client";

import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import StatusPill from "@/components/ui/StatusPill";

const stats = [
  { label: "Tweets this week", value: "12" },
  { label: "Engagement total", value: "8.4K" },
  { label: "Confidence trend", value: "↑", color: "text-atlas-success" },
  { label: "Streak", value: "5 days", color: "text-atlas-teal" },
];

const navCards = [
  { label: "Crafting Station", href: "/crafting" },
  { label: "Alerts + Momentum", href: "/alerts" },
  { label: "Analytics + Predictions", href: "/analytics" },
  { label: "Voice Profiles", href: "/voice-profiles" },
  { label: "Team Style Library", href: "/team-library" },
  { label: "Telegram Guide", href: "/telegram" },
  { label: "Team Management", href: "/management" },
];

const recentActivity = [
  { text: "Draft: AI momentum thread — 2h ago", variant: "draft" as const },
  { text: "Posted: ETH staking analysis — 5h ago", variant: "posted" as const },
  { text: "Feedback: Voice calibration update — 8h ago", variant: "feedback" as const },
  { text: "Draft: L2 comparison thread — 12h ago", variant: "draft" as const },
  { text: "Posted: DeFi yield roundup — 1d ago", variant: "posted" as const },
];

export default function DashboardPage() {
  return (
    <AppShell>
      <h1 className="font-heading text-2xl text-atlas-text">
        Welcome back, Analyst
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
          {recentActivity.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 gap-2"
            >
              <span className="text-xs sm:text-sm text-atlas-text truncate">{item.text}</span>
              <StatusPill
                label={item.variant.charAt(0).toUpperCase() + item.variant.slice(1)}
                variant={item.variant}
              />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

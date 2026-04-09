"use client";

import AppShell from "@/components/layout/AppShell";

type Category = "crafting" | "voice" | "analytics" | "platform" | "integrations";
type Status = "shipped" | "in-progress" | "planned";

interface RoadmapItem {
  name: string;
  description: string;
  category: Category;
  status: Status;
}

const ROADMAP_DATA: RoadmapItem[] = [
  // Shipped
  { name: "Crafting Station", description: "AI-powered tweet generation from reports, articles, and ideas", category: "crafting", status: "shipped" },
  { name: "Voice Profiles", description: "Personal writing style captured from your Twitter history", category: "voice", status: "shipped" },
  { name: "Team Library", description: "Shared content feed across the team", category: "platform", status: "shipped" },
  { name: "Analytics Dashboard", description: "Engagement tracking and prediction models", category: "analytics", status: "shipped" },
  { name: "Oracle Onboarding", description: "Conversational guide for new users", category: "platform", status: "shipped" },
  { name: "Arena", description: "Competitive leaderboard with streaks and scoring", category: "platform", status: "shipped" },
  { name: "Alerts & Signals", description: "Real-time trending topic scanner", category: "analytics", status: "shipped" },
  { name: "Queue & Scheduling", description: "Draft queue with batch scheduling", category: "crafting", status: "shipped" },
  { name: "Campaign Workflow", description: "PDF-to-tweet campaign pipeline", category: "crafting", status: "shipped" },
  // In Progress
  { name: "Twitter/X OAuth Login", description: "One-click auth — no separate Atlas profile needed", category: "integrations", status: "in-progress" },
  { name: "Inline Refinement Chips", description: "Per-tweet adjustments: funnier, shorter, bolder", category: "crafting", status: "in-progress" },
  { name: "Voice Lab Redesign", description: "Follow-based inspiration and voice blending", category: "voice", status: "in-progress" },
  { name: "Super Admin Panel", description: "Feature flags, user management, usage analytics", category: "platform", status: "in-progress" },
  // Planned
  { name: "Tweet Tinder", description: "Swipe-based content curation for voice training", category: "voice", status: "planned" },
  { name: "Telegram Bot", description: "Alert delivery and draft review via Telegram", category: "integrations", status: "planned" },
  { name: "Multi-Model Routing", description: "Best AI model per task — speed vs quality", category: "platform", status: "planned" },
  { name: "Engagement Feedback Loop", description: "Post-publish metrics feed back into voice tuning", category: "analytics", status: "planned" },
  { name: "Custom Domains", description: "Branded Atlas instances for teams", category: "platform", status: "planned" },
];

const CATEGORY_STYLES: Record<Category, string> = {
  crafting: "bg-atlas-teal/15 text-atlas-teal",
  voice: "bg-purple-500/15 text-purple-400",
  analytics: "bg-amber-500/15 text-amber-400",
  platform: "bg-delphi-blue-500/15 text-delphi-blue-400",
  integrations: "bg-emerald-500/15 text-emerald-400",
};

const CATEGORY_LABELS: Record<Category, string> = {
  crafting: "Crafting",
  voice: "Voice",
  analytics: "Analytics",
  platform: "Platform",
  integrations: "Integrations",
};

function CategoryPill({ category }: { category: Category }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_STYLES[category]}`}
    >
      {CATEGORY_LABELS[category]}
    </span>
  );
}

function StatusDot({ status }: { status: Status }) {
  if (status === "shipped") {
    return <span className="inline-block h-2.5 w-2.5 rounded-full bg-atlas-success" />;
  }
  if (status === "in-progress") {
    return <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-atlas-teal" />;
  }
  return <span className="inline-block h-2.5 w-2.5 rounded-full bg-atlas-text-muted" />;
}

function RoadmapCard({ item }: { item: RoadmapItem }) {
  return (
    <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl p-4 transition-colors hover:border-atlas-text-muted/20">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-body text-sm font-semibold text-atlas-text">{item.name}</h3>
        <CategoryPill category={item.category} />
      </div>
      <p className="mt-1.5 font-body text-xs leading-relaxed text-atlas-text-secondary">
        {item.description}
      </p>
    </div>
  );
}

function StatusColumn({
  title,
  status,
  items,
}: {
  title: string;
  status: Status;
  items: RoadmapItem[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 px-1">
        <StatusDot status={status} />
        <h2 className="font-heading text-base font-semibold text-atlas-text">{title}</h2>
        <span className="ml-auto rounded-full bg-glass border border-glass-border px-2 py-0.5 text-xs font-medium text-atlas-text-secondary">
          {items.length}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <RoadmapCard key={item.name} item={item} />
        ))}
      </div>
    </div>
  );
}

export default function RoadmapPage() {
  const shipped = ROADMAP_DATA.filter((i) => i.status === "shipped");
  const inProgress = ROADMAP_DATA.filter((i) => i.status === "in-progress");
  const planned = ROADMAP_DATA.filter((i) => i.status === "planned");

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-heading text-3xl font-bold text-atlas-text sm:text-4xl">
            Roadmap
          </h1>
          <p className="mt-2 font-body text-base text-atlas-text-secondary">
            What we&apos;re building and where we&apos;re going
          </p>
          <p className="mt-1 font-body text-xs text-atlas-text-muted">
            Last updated: April 2026
          </p>
        </div>

        {/* Columns */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatusColumn title="Shipped" status="shipped" items={shipped} />
          <StatusColumn title="In Progress" status="in-progress" items={inProgress} />
          <StatusColumn title="Planned" status="planned" items={planned} />
        </div>
      </div>
    </AppShell>
  );
}

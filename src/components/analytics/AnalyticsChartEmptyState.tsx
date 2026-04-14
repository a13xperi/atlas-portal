"use client";

import Link from "next/link";

type AnalyticsChartEmptyStateVariant =
  | "overview"
  | "sparkline"
  | "engagement"
  | "reliability"
  | "growth";

interface AnalyticsChartEmptyStateProps {
  title: string;
  description: string;
  variant?: AnalyticsChartEmptyStateVariant;
  className?: string;
  compact?: boolean;
}

const illustrationByVariant: Record<
  AnalyticsChartEmptyStateVariant,
  { badge: string; linePoints: string; barHeights: string[] }
> = {
  overview: {
    badge: "Atlas signal",
    linePoints: "8,54 28,46 48,38 68,42 88,24 108,30 128,18 148,26",
    barHeights: ["h-10", "h-14", "h-8", "h-16", "h-12", "h-20"],
  },
  sparkline: {
    badge: "Activity",
    linePoints: "8,58 28,54 48,42 68,46 88,28 108,36 128,20 148,24",
    barHeights: ["h-6", "h-9", "h-12", "h-8", "h-14", "h-10"],
  },
  engagement: {
    badge: "Engagement",
    linePoints: "8,60 28,50 48,56 68,34 88,40 108,22 128,18 148,12",
    barHeights: ["h-8", "h-14", "h-10", "h-16", "h-12", "h-20"],
  },
  reliability: {
    badge: "Reliability",
    linePoints: "8,62 28,52 48,46 68,34 88,30 108,24 128,18 148,14",
    barHeights: ["h-12", "h-16", "h-14", "h-[4.5rem]", "h-16", "h-20"],
  },
  growth: {
    badge: "Velocity",
    linePoints: "8,60 28,58 48,50 68,42 88,36 108,28 128,18 148,12",
    barHeights: ["h-5", "h-7", "h-9", "h-12", "h-16", "h-20"],
  },
};

export default function AnalyticsChartEmptyState({
  title,
  description,
  variant = "overview",
  className,
  compact = false,
}: AnalyticsChartEmptyStateProps) {
  const illustration = illustrationByVariant[variant];
  const rootClassName = [
    "flex flex-col items-center justify-center gap-6 rounded-2xl border border-dashed border-glass-border bg-glass/40 px-6 py-8 text-center backdrop-blur-xl",
    compact ? "min-h-[15rem]" : "min-h-[18rem]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClassName}>
      <div
        aria-hidden="true"
        className={[
          "relative overflow-hidden rounded-[28px] border border-glass-border bg-atlas-nav/90",
          compact ? "h-32 w-44" : "h-36 w-52",
        ].join(" ")}
      >
        <div className="absolute inset-x-4 top-4 flex items-center justify-between">
          <span className="rounded-full border border-glass-border bg-atlas-surface/80 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-atlas-text-secondary">
            {illustration.badge}
          </span>
          <span className="h-2.5 w-2.5 rounded-full bg-atlas-teal" />
        </div>

        <div className="absolute inset-x-4 bottom-4 top-12 rounded-[20px] border border-glass-border/70 bg-atlas-surface/40" />
        <div className="absolute inset-x-7 top-[4.9rem] border-t border-dashed border-glass-border/70" />

        <svg
          aria-hidden="true"
          viewBox="0 0 156 72"
          className="absolute inset-x-4 bottom-[1.15rem] h-[4.5rem] text-atlas-teal/80"
        >
          <polyline
            fill="none"
            points={illustration.linePoints}
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />
          <circle cx="148" cy="26" r="4" fill="currentColor" className="text-atlas-success" />
        </svg>

        <div className="absolute inset-x-8 bottom-5 flex items-end justify-between gap-2">
          {illustration.barHeights.map((heightClassName, index) => (
            <div
              key={`${variant}-bar-${index}`}
              className={[
                "flex-1 rounded-t-xl border border-glass-border/70 bg-atlas-teal/20",
                heightClassName,
                index === illustration.barHeights.length - 1
                  ? "bg-atlas-success/40"
                  : index % 2 === 0
                    ? "bg-atlas-teal/30"
                    : "",
              ].join(" ")}
            />
          ))}
        </div>
      </div>

      <div className="max-w-xl">
        <p className="font-heading text-xl font-semibold tracking-tight text-atlas-text">
          {title}
        </p>
        <p className="mt-2 text-sm leading-6 text-atlas-text-secondary">
          {description}
        </p>
      </div>

      <div className="flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/voice-profiles"
          className="gradient-cta inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold"
        >
          Connect X
        </Link>
        <Link
          href="/crafting"
          className="inline-flex items-center justify-center rounded-lg border border-glass-border bg-atlas-surface/60 px-5 py-2.5 text-sm font-semibold text-atlas-text-secondary transition-colors hover:border-atlas-teal/40 hover:text-atlas-text"
        >
          Import data
        </Link>
      </div>
    </div>
  );
}

"use client";

import AnalyticsChartEmptyState from "@/components/analytics/AnalyticsChartEmptyState";
import { LearningLogEntry } from "@/lib/api";

interface ModelReliabilitySectionProps {
  logEntries: LearningLogEntry[];
}

export default function ModelReliabilitySection({
  logEntries,
}: ModelReliabilitySectionProps) {
  const recentEntries = logEntries.slice(-20);
  const positiveSignals = logEntries.filter((entry) => entry.positive).length;
  const hasData = recentEntries.length > 0;

  if (!hasData) {
    return (
      <div className="mb-6 rounded-xl border border-glass-border bg-atlas-surface p-6 sm:p-8">
        <p className="text-[10px] text-atlas-text-secondary uppercase tracking-wide mb-1">
          Confidence Trend
        </p>
        <h3 className="font-heading font-semibold text-lg text-atlas-text">
          Model Reliability
        </h3>
        <p className="mt-2 max-w-2xl text-sm text-atlas-text-secondary">
          Atlas builds confidence scores from imported source material, draft refinements, and live posting outcomes.
        </p>
        <AnalyticsChartEmptyState
          compact
          variant="reliability"
          className="mt-6"
          title="No confidence trend yet"
          description="Connect X and import a report so Atlas can start learning from the drafts you refine and the posts you ship."
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div className="bg-atlas-surface border border-glass-border rounded-xl p-6">
        <p className="text-[10px] text-atlas-text-secondary uppercase tracking-wide mb-1">
          Confidence Trend
        </p>
        <h3 className="font-heading font-semibold text-lg text-atlas-text">
          Model Reliability
        </h3>
        <div className="mt-4 h-20 flex items-end gap-0.5">
          {recentEntries.map((entry, index) => {
            const score = entry.positive ? 70 + index * 1.5 : 30 + index * 1.5;
            return (
              <div
                key={entry.id}
                className={`flex-1 rounded-t ${entry.positive ? "bg-atlas-teal" : "bg-atlas-warning"}`}
                style={{ height: `${Math.min(score, 100)}%` }}
              />
            );
          })}
        </div>
      </div>
      <div className="bg-atlas-surface border border-glass-border rounded-xl p-6 flex items-center">
        <p className="font-heading font-medium text-base text-atlas-text italic leading-relaxed">
          {positiveSignals} positive signals detected across your recent activity.
        </p>
      </div>
    </div>
  );
}

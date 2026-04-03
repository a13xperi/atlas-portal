"use client";

import { LearningLogEntry } from "@/lib/api";

interface ModelReliabilitySectionProps {
  logEntries: LearningLogEntry[];
}

export default function ModelReliabilitySection({
  logEntries,
}: ModelReliabilitySectionProps) {
  const recentEntries = logEntries.slice(-20);
  const positiveSignals = logEntries.filter((entry) => entry.positive).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div className="bg-atlas-surface border border-glass-border rounded-xl p-6">
        <p className="text-[10px] text-atlas-text-secondary uppercase tracking-wide mb-1">
          Confidence Trend
        </p>
        <h3 className="font-heading text-lg text-atlas-text">
          Model Reliability
        </h3>
        <div className="mt-4 h-20 flex items-end gap-0.5">
          {recentEntries.length > 0 ? (
            recentEntries.map((entry, index) => {
              const score = entry.positive ? 70 + index * 1.5 : 30 + index * 1.5;
              return (
                <div
                  key={entry.id}
                  className={`flex-1 rounded-t ${entry.positive ? "bg-atlas-teal" : "bg-atlas-warning"}`}
                  style={{ height: `${Math.min(score, 100)}%` }}
                />
              );
            })
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs text-atlas-text-muted italic">
                Confidence data builds as you create and refine drafts
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="bg-atlas-surface border border-glass-border rounded-xl p-6 flex items-center">
        {logEntries.length > 0 ? (
          <p className="font-heading text-base text-atlas-text italic leading-relaxed">
            {positiveSignals} positive signals detected across your recent activity.
          </p>
        ) : (
          <p className="font-heading text-base text-atlas-text-muted italic leading-relaxed">
            Model insights will appear here as your usage history grows.
          </p>
        )}
      </div>
    </div>
  );
}

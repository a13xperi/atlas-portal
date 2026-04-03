"use client";

import { DailyEngagement } from "@/lib/api";

interface EngagementVelocityChartProps {
  engagementDays: DailyEngagement[];
}

export default function EngagementVelocityChart({
  engagementDays,
}: EngagementVelocityChartProps) {
  const chartMax =
    engagementDays.length > 0
      ? Math.max(...engagementDays.flatMap((day) => [day.predicted, day.actual]), 1)
      : 100;

  const accuracyPct =
    engagementDays.length > 0
      ? Math.round(
          (1 -
            engagementDays.reduce((sum, day) => {
              const maxVal = Math.max(day.predicted, day.actual, 1);
              return sum + Math.abs(day.predicted - day.actual) / maxVal;
            }, 0) /
              engagementDays.length) *
            100
        )
      : null;

  return (
    <div className="bg-atlas-surface border border-glass-border rounded-xl p-6 sm:p-8 mb-6">
      <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-heading font-bold tracking-tight text-xl text-atlas-text">
          Engagement Velocity
        </h2>
        {accuracyPct !== null && (
          <span className="text-xs text-atlas-success bg-atlas-success/10 px-2 py-1 rounded-full font-medium">
            {accuracyPct}% Accuracy
          </span>
        )}
      </div>
      <p className="text-sm text-atlas-text-secondary mb-6">
        Actual performance against neural prediction models.
      </p>

      <div className="relative">
        <div className="min-w-[20rem]">
          <div className="relative h-48">
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-atlas-text-muted pr-2">
              <span>High</span>
              <span>Med</span>
              <span>Low</span>
            </div>
            <div className="ml-10 h-full flex items-end gap-0">
              {engagementDays.length > 0 ? (
                engagementDays.map((day) => (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex h-40 items-end justify-center gap-1">
                      <div
                        className="w-3 rounded-t bg-atlas-teal/60"
                        style={{
                          height: `${(day.predicted / chartMax) * 100}%`,
                          minHeight: day.predicted > 0 ? "32px" : "0px",
                        }}
                        title={`Predicted: ${day.predicted}`}
                      />
                      <div
                        className="w-3 rounded-t bg-atlas-success"
                        style={{
                          height: `${(day.actual / chartMax) * 100}%`,
                          minHeight: day.actual > 0 ? "32px" : "0px",
                        }}
                        title={`Actual: ${day.actual}`}
                      />
                    </div>
                    <span className="text-[10px] text-atlas-text-muted">{day.dayLabel}</span>
                  </div>
                ))
              ) : (
                <p className="ml-2 text-sm italic text-atlas-text-muted">
                  No engagement data yet. Create and post drafts to see predictions vs actuals.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-atlas-teal/60" />
          <span className="text-xs text-atlas-text-secondary">Predicted</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-atlas-success" />
          <span className="text-xs text-atlas-text-secondary">Actual</span>
        </div>
      </div>
    </div>
  );
}

"use client";

import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { DraftPerformance } from "@/lib/api";

interface PerformanceCardProps {
  performance: DraftPerformance;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export default function PerformanceCard({
  performance,
  onRefresh,
  refreshing,
}: PerformanceCardProps) {
  const { predicted, actual, deltaPct, metrics, percentile } = performance;
  const outperformed = deltaPct >= 0;

  return (
    <div className="rounded-xl border border-glass-border bg-atlas-surface/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-atlas-text-muted">
          {outperformed ? (
            <TrendingUp className="h-3.5 w-3.5 text-atlas-success" aria-hidden="true" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-atlas-warning" aria-hidden="true" />
          )}
          Performance
        </p>
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="text-[10px] text-atlas-text-muted hover:text-atlas-teal transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`inline h-3 w-3 mr-1 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
            Refresh
          </button>
        ) : null}
      </div>

      {/* Predicted vs Actual hero row */}
      <div className="flex items-end gap-6 mb-4">
        <div>
          <span className="text-atlas-text-muted text-xs">Predicted</span>
          <p className="font-semibold text-lg text-atlas-text">
            {predicted.toLocaleString()}
          </p>
        </div>
        <div>
          <span className="text-atlas-text-muted text-xs">Actual</span>
          <p className="font-semibold text-lg text-atlas-text">
            {actual.toLocaleString()}
          </p>
        </div>
        <div className="ml-auto text-right">
          <span className="text-atlas-text-muted text-xs">Delta</span>
          <p
            className={`font-bold text-lg ${
              outperformed ? "text-atlas-success" : "text-atlas-warning"
            }`}
          >
            {outperformed ? "+" : ""}
            {Math.round(deltaPct)}%
          </p>
        </div>
      </div>

      {/* Decomposed metrics */}
      <div className="grid grid-cols-5 gap-2 rounded-lg bg-atlas-nav/50 p-3">
        {([
          ["Impressions", metrics.impressions],
          ["Likes", metrics.likes],
          ["Retweets", metrics.retweets],
          ["Replies", metrics.replies],
          ["Bookmarks", metrics.bookmarks],
        ] as const).map(([label, value]) => (
          <div key={label} className="text-center">
            <p className="text-[10px] text-atlas-text-muted">{label}</p>
            <p className="text-sm font-semibold text-atlas-text">
              {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
            </p>
          </div>
        ))}
      </div>

      {/* Percentile badge */}
      {percentile > 0 ? (
        <div className="mt-3 flex items-center gap-2">
          <div
            className="h-1.5 flex-1 rounded-full bg-atlas-surface overflow-hidden"
            role="progressbar"
            aria-label={`${percentile}th percentile`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percentile}
          >
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                percentile >= 75
                  ? "bg-atlas-success"
                  : percentile >= 50
                    ? "bg-atlas-teal"
                    : "bg-atlas-warning"
              }`}
              style={{ width: `${percentile}%` }}
            />
          </div>
          <span className="text-[10px] font-medium text-atlas-text-muted shrink-0">
            Top {100 - percentile}%
          </span>
        </div>
      ) : null}
    </div>
  );
}

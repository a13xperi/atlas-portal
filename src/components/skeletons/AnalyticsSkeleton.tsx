import TableSkeleton from "@/components/skeletons/TableSkeleton";

interface AnalyticsSkeletonProps {
  className?: string;
}

export default function AnalyticsSkeleton({
  className,
}: AnalyticsSkeletonProps) {
  const rootClassName = ["space-y-6", className].filter(Boolean).join(" ");
  const chartHeights = ["h-16", "h-28", "h-20", "h-36", "h-24", "h-32", "h-[4.5rem]"];
  const reliabilityHeights = ["h-10", "h-14", "h-12", "h-16", "h-20", "h-[4.5rem]", "h-24", "h-[5.5rem]"];

  return (
    <div className={rootClassName} aria-hidden="true">
      <div className="space-y-3">
        <div className="h-8 w-52 rounded-full animate-pulse bg-atlas-surface/70" />
        <div className="h-4 w-96 max-w-full rounded-full animate-pulse bg-atlas-nav/80" />
      </div>

      <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl p-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={`analytics-stat-${index}`} className="space-y-3 text-center">
              <div className="h-3 w-16 mx-auto rounded-full animate-pulse bg-atlas-nav/80" />
              <div className="h-8 w-12 mx-auto rounded-full animate-pulse bg-atlas-surface/70" />
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-end gap-2 h-10">
          {Array.from({ length: 18 }).map((_, index) => (
            <div
              key={`analytics-sparkline-${index}`}
              className={[
                "flex-1 rounded-full animate-pulse bg-atlas-teal/40",
                index % 4 === 0
                  ? "h-4"
                  : index % 3 === 0
                    ? "h-7"
                    : index % 2 === 0
                      ? "h-5"
                      : "h-8",
              ].join(" ")}
            />
          ))}
        </div>

        <div className="mt-4 h-3 w-72 max-w-full rounded-full animate-pulse bg-atlas-nav/80" />
      </div>

      <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl p-8">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-3">
            <div className="h-5 w-40 rounded-full animate-pulse bg-atlas-surface/70" />
            <div className="h-3 w-64 max-w-full rounded-full animate-pulse bg-atlas-nav/80" />
          </div>
          <div className="h-7 w-24 rounded-full animate-pulse bg-atlas-nav/80" />
        </div>

        <div className="mt-8">
          <div className="flex items-end gap-3 h-56 pl-10">
            {chartHeights.map((heightClassName, index) => (
              <div key={`analytics-chart-group-${index}`} className="flex-1 flex items-end justify-center gap-1">
                <div
                  className={[
                    "w-3 rounded-t-lg animate-pulse bg-atlas-teal/40",
                    heightClassName,
                  ].join(" ")}
                />
                <div
                  className={[
                    "w-3 rounded-t-lg animate-pulse bg-atlas-success/70",
                    index % 2 === 0 ? "h-24" : "h-32",
                  ].join(" ")}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <div className="h-3 w-20 rounded-full animate-pulse bg-atlas-nav/80" />
          <div className="h-3 w-16 rounded-full animate-pulse bg-atlas-nav/80" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl p-6">
          <div className="space-y-3">
            <div className="h-3 w-24 rounded-full animate-pulse bg-atlas-nav/80" />
            <div className="h-5 w-36 rounded-full animate-pulse bg-atlas-surface/70" />
          </div>

          <div className="mt-6 flex items-end gap-1 h-24">
            {reliabilityHeights.map((heightClassName, index) => (
              <div
                key={`analytics-reliability-${index}`}
                className={[
                  "flex-1 rounded-t-lg animate-pulse",
                  index % 3 === 0 ? "bg-atlas-warning/70" : "bg-atlas-teal/50",
                  heightClassName,
                ].join(" ")}
              />
            ))}
          </div>
        </div>

        <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl p-6 flex items-center">
          <div className="space-y-4 w-full">
            <div className="h-4 w-32 rounded-full animate-pulse bg-atlas-surface/70" />
            <div className="h-4 w-full rounded-full animate-pulse bg-atlas-nav/80" />
            <div className="h-4 w-5/6 rounded-full animate-pulse bg-atlas-nav/80" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="h-5 w-44 rounded-full animate-pulse bg-atlas-surface/70" />
        <TableSkeleton rows={4} columns={3} />
      </div>

      <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl p-8">
        <div className="space-y-4">
          <div className="h-5 w-40 rounded-full animate-pulse bg-atlas-surface/70" />
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`analytics-log-${index}`}
              className={[
                "flex items-center justify-between gap-4 py-4",
                index > 0 ? "border-t border-glass-border/80" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="space-y-2 flex-1">
                <div className="h-3 w-24 rounded-full animate-pulse bg-atlas-nav/80" />
                <div className="h-4 w-3/4 rounded-full animate-pulse bg-atlas-surface/70" />
              </div>
              <div className="h-4 w-16 rounded-full animate-pulse bg-atlas-success/50" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl p-8 space-y-5">
        <div className="h-5 w-36 rounded-full animate-pulse bg-atlas-surface/70" />
        <div className="h-3 w-full rounded-full animate-pulse bg-atlas-nav/80 overflow-hidden">
          <div className="h-full w-2/3 rounded-full animate-pulse bg-atlas-teal/50" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`analytics-growth-${index}`} className="space-y-2">
              <div className="h-3 w-16 rounded-full animate-pulse bg-atlas-nav/80" />
              <div className="h-4 w-12 rounded-full animate-pulse bg-atlas-surface/70" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import TableSkeleton from "@/components/skeletons/TableSkeleton";

interface DashboardSkeletonProps {
  className?: string;
}

export default function DashboardSkeleton({
  className,
}: DashboardSkeletonProps) {
  const rootClassName = ["space-y-6", className].filter(Boolean).join(" ");
  const chartHeights = ["h-24", "h-32", "h-20", "h-40", "h-28", "h-36", "h-24", "h-44"];

  return (
    <div className={rootClassName} aria-hidden="true">
      <div className="space-y-3">
        <div className="h-8 w-56 rounded-full animate-pulse bg-atlas-surface/70" />
        <div className="h-4 w-80 max-w-full rounded-full animate-pulse bg-atlas-nav/80" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`dashboard-kpi-${index}`}
            className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl p-6 space-y-4"
          >
            <div className="h-3 w-20 rounded-full animate-pulse bg-atlas-nav/80" />
            <div className="h-8 w-16 rounded-full animate-pulse bg-atlas-surface/70" />
            <div className="h-2 w-24 rounded-full animate-pulse bg-atlas-nav/80" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)] gap-6">
        <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl p-6">
          <div className="space-y-3">
            <div className="h-4 w-36 rounded-full animate-pulse bg-atlas-surface/70" />
            <div className="h-3 w-56 max-w-full rounded-full animate-pulse bg-atlas-nav/80" />
          </div>

          <div className="mt-8 flex items-end gap-3 h-48">
            {chartHeights.map((heightClassName, index) => (
              <div
                key={`dashboard-chart-bar-${index}`}
                className={[
                  "flex-1 rounded-t-2xl animate-pulse bg-atlas-surface/70",
                  heightClassName,
                ].join(" ")}
              />
            ))}
          </div>

          <div className="mt-6 flex gap-4">
            <div className="h-3 w-20 rounded-full animate-pulse bg-atlas-nav/80" />
            <div className="h-3 w-24 rounded-full animate-pulse bg-atlas-nav/80" />
          </div>
        </div>

        <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl p-6 space-y-5">
          <div className="space-y-3">
            <div className="h-4 w-32 rounded-full animate-pulse bg-atlas-surface/70" />
            <div className="h-3 w-44 rounded-full animate-pulse bg-atlas-nav/80" />
          </div>

          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`dashboard-panel-${index}`}
              className="rounded-2xl border border-glass-border/80 bg-atlas-nav/60 p-4 space-y-3"
            >
              <div className="h-3 w-20 rounded-full animate-pulse bg-atlas-surface/70" />
              <div className="h-3 w-full rounded-full animate-pulse bg-atlas-surface/60" />
              <div className="h-3 w-3/4 rounded-full animate-pulse bg-atlas-surface/60" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`dashboard-shortcut-${index}`}
            className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl p-6 flex flex-col items-center gap-4"
          >
            <div className="h-10 w-10 rounded-full animate-pulse bg-atlas-nav/80" />
            <div className="h-3 w-24 rounded-full animate-pulse bg-atlas-surface/70" />
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="h-3 w-28 rounded-full animate-pulse bg-atlas-nav/80" />
        <TableSkeleton rows={3} columns={2} showHeader={false} />
      </div>
    </div>
  );
}

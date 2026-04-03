interface CraftingSkeletonProps {
  className?: string;
}

export default function CraftingSkeleton({
  className,
}: CraftingSkeletonProps) {
  const rootClassName = ["space-y-6", className].filter(Boolean).join(" ");
  const dimensionWidths = ["w-5/6", "w-3/4", "w-2/3", "w-4/5"];

  return (
    <div className={rootClassName} aria-hidden="true">
      <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="h-10 w-10 rounded-full border border-glass-border animate-pulse bg-atlas-nav/80" />
          <div className="space-y-2 flex-1 sm:flex-none">
            <div className="h-4 w-48 max-w-full rounded-full animate-pulse bg-atlas-surface/70" />
            <div className="h-3 w-64 max-w-full rounded-full animate-pulse bg-atlas-nav/80" />
          </div>
        </div>
        <div className="h-4 w-28 rounded-full animate-pulse bg-atlas-teal/40" />
      </div>

      <div className="space-y-3">
        <div className="h-3 w-40 rounded-full animate-pulse bg-atlas-nav/80" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={`crafting-chip-${index}`}
              className="h-8 w-24 rounded-full border border-glass-border animate-pulse bg-glass"
            />
          ))}
        </div>
      </div>

      <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl p-6 space-y-5">
        <div className="space-y-3">
          <div className="h-3 w-44 rounded-full animate-pulse bg-atlas-nav/80" />
          <div className="h-4 w-80 max-w-full rounded-full animate-pulse bg-atlas-surface/70" />
        </div>

        <div className="rounded-2xl border border-glass-border/80 bg-atlas-nav/60 p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="h-10 w-36 rounded-lg animate-pulse bg-atlas-surface/70" />
            <div className="h-10 w-28 rounded-lg animate-pulse bg-atlas-surface/70" />
            <div className="h-10 w-10 rounded-lg animate-pulse bg-atlas-surface/70" />
          </div>

          <div className="h-40 rounded-2xl animate-pulse bg-atlas-surface/60" />

          <div className="flex items-center justify-between gap-4">
            <div className="h-4 w-32 rounded-full animate-pulse bg-atlas-nav/80" />
            <div className="h-10 w-28 rounded-lg animate-pulse bg-atlas-teal/40" />
          </div>
        </div>
      </div>

      <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl px-4 sm:px-6 py-4 flex flex-col lg:flex-row gap-4">
        <div className="h-10 w-40 rounded-lg animate-pulse bg-atlas-nav/80" />
        <div className="h-10 w-44 rounded-lg animate-pulse bg-atlas-nav/80" />
        <div className="flex-1 flex items-center gap-3">
          <div className="h-4 w-16 rounded-full animate-pulse bg-atlas-nav/80" />
          <div className="h-2 flex-1 rounded-full animate-pulse bg-atlas-surface/70" />
          <div className="h-4 w-10 rounded-full animate-pulse bg-atlas-surface/70" />
        </div>
      </div>

      <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl p-6 space-y-4">
        <div className="h-4 w-full rounded-full animate-pulse bg-atlas-surface/70" />
        <div className="h-4 w-11/12 rounded-full animate-pulse bg-atlas-surface/70" />
        <div className="h-4 w-4/5 rounded-full animate-pulse bg-atlas-surface/70" />
        <div className="h-3 w-20 ml-auto rounded-full animate-pulse bg-atlas-nav/80" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={`crafting-metric-${index}`}
            className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl p-4 space-y-3"
          >
            <div className="h-3 w-24 rounded-full animate-pulse bg-atlas-nav/80" />
            <div className="h-8 w-20 rounded-full animate-pulse bg-atlas-surface/70" />
            <div className="h-2 w-32 rounded-full animate-pulse bg-atlas-nav/80" />
          </div>
        ))}
      </div>

      <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl p-6 space-y-4">
        <div className="h-4 w-36 rounded-full animate-pulse bg-atlas-surface/70" />
        {dimensionWidths.map((widthClassName, index) => (
          <div key={`crafting-dimension-${index}`} className="space-y-2">
            <div className="h-3 w-24 rounded-full animate-pulse bg-atlas-nav/80" />
            <div className="h-2 rounded-full bg-atlas-nav/70 overflow-hidden">
              <div
                className={[
                  "h-full rounded-full animate-pulse bg-atlas-teal/50",
                  widthClassName,
                ].join(" ")}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`crafting-action-${index}`}
            className="h-10 w-36 rounded-lg border border-glass-border animate-pulse bg-glass"
          />
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-12 flex-1 rounded-lg animate-pulse bg-atlas-surface/70" />
          <div className="h-12 w-12 rounded-lg animate-pulse bg-atlas-nav/80" />
        </div>
        <div className="h-3 w-48 rounded-full animate-pulse bg-atlas-nav/80" />
      </div>
    </div>
  );
}

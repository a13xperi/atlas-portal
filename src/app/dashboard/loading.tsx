import AppShell from "@/components/layout/AppShell";

export default function Loading() {
  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="animate-pulse">
          <div className="h-8 bg-atlas-nav rounded w-1/3 mb-2" />
          <div className="h-4 bg-atlas-nav rounded w-2/3" />
        </div>
        {/* Stat cards skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-atlas-surface border border-glass-border rounded-2xl p-5 animate-pulse"
            >
              <div className="h-3 bg-atlas-nav rounded w-2/3 mb-3" />
              <div className="h-7 bg-atlas-nav rounded w-1/2" />
            </div>
          ))}
        </div>
        {/* Content cards skeleton */}
        {[["w-full", "w-3/4"], ["w-3/4", "w-1/2"], ["w-1/2", "w-full"]].map(
          (widths, index) => (
            <div
              key={index}
              className="bg-atlas-surface border border-glass-border rounded-2xl p-6 animate-pulse"
            >
              <div className="space-y-3">
                <div className={`h-4 bg-atlas-nav rounded ${widths[0]}`} />
                <div className={`h-4 bg-atlas-nav rounded ${widths[1]}`} />
              </div>
            </div>
          )
        )}
      </div>
    </AppShell>
  );
}

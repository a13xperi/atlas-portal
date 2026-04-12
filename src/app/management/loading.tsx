import AppShell from "@/components/layout/AppShell";

export default function Loading() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-atlas-nav rounded w-1/4 mb-2" />
          <div className="h-4 bg-atlas-nav rounded w-2/3" />
        </div>
        {/* Summary row */}
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
        {/* Table skeleton */}
        <div className="bg-atlas-surface border border-glass-border rounded-2xl p-6 animate-pulse">
          <div className="h-5 bg-atlas-nav rounded w-1/4 mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-8 w-8 bg-atlas-nav rounded-full shrink-0" />
                <div className="h-4 bg-atlas-nav rounded w-1/4" />
                <div className="h-4 bg-atlas-nav rounded w-1/6 ml-auto" />
                <div className="h-4 bg-atlas-nav rounded w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

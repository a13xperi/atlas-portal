import AppShell from "@/components/layout/AppShell";

export default function Loading() {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-glass-border bg-atlas-surface p-5"
            >
              <div className="h-3 w-1/2 rounded bg-atlas-nav" />
              <div className="mt-3 h-7 w-3/4 rounded bg-atlas-nav" />
            </div>
          ))}
        </div>

        {/* Briefing banner */}
        <div className="animate-pulse rounded-2xl border border-glass-border bg-atlas-surface p-6">
          <div className="h-4 w-1/3 rounded bg-atlas-nav" />
          <div className="mt-3 h-3 w-2/3 rounded bg-atlas-nav" />
          <div className="mt-2 h-3 w-1/2 rounded bg-atlas-nav" />
        </div>

        {/* Trending topics */}
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-glass-border bg-atlas-surface p-5"
            >
              <div className="h-4 w-3/4 rounded bg-atlas-nav" />
              <div className="mt-2 h-3 w-1/2 rounded bg-atlas-nav" />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

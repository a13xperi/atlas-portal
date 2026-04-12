import AppShell from "@/components/layout/AppShell";

export default function Loading() {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        {/* Header + filter bar */}
        <div className="animate-pulse flex items-center justify-between">
          <div className="h-6 w-1/4 rounded bg-atlas-nav" />
          <div className="h-8 w-32 rounded-lg bg-atlas-nav" />
        </div>

        {/* Masonry grid */}
        <div className="columns-1 gap-4 md:columns-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="mb-4 animate-pulse break-inside-avoid rounded-2xl border border-glass-border bg-atlas-surface p-5"
            >
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-atlas-nav" />
                <div className="h-3 w-3/4 rounded bg-atlas-nav" />
                <div className="h-3 w-1/2 rounded bg-atlas-nav" />
              </div>
              <div className="mt-4 flex items-center gap-3 border-t border-glass-border pt-3">
                <div className="h-6 w-6 rounded-full bg-atlas-nav" />
                <div className="h-3 w-24 rounded bg-atlas-nav" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

import AppShell from "@/components/layout/AppShell";

export default function Loading() {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        {/* Header */}
        <div className="animate-pulse">
          <div className="h-6 w-1/3 rounded bg-atlas-nav" />
          <div className="mt-2 h-3 w-1/2 rounded bg-atlas-nav" />
        </div>

        {/* Today's brief card */}
        <div className="animate-pulse rounded-2xl border border-glass-border bg-atlas-surface p-6">
          <div className="h-4 w-1/4 rounded bg-atlas-nav" />
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full rounded bg-atlas-nav" />
            <div className="h-3 w-3/4 rounded bg-atlas-nav" />
            <div className="h-3 w-1/2 rounded bg-atlas-nav" />
          </div>
        </div>

        {/* Draft list */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl border border-glass-border bg-atlas-surface p-5"
          >
            <div className="h-3 w-full rounded bg-atlas-nav" />
            <div className="mt-2 h-3 w-2/3 rounded bg-atlas-nav" />
            <div className="mt-3 flex gap-3">
              <div className="h-3 w-16 rounded bg-atlas-nav" />
              <div className="h-3 w-16 rounded bg-atlas-nav" />
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

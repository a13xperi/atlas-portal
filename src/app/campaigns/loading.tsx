import AppShell from "@/components/layout/AppShell";

export default function Loading() {
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        {/* Header */}
        <div className="animate-pulse">
          <div className="h-6 w-1/4 rounded bg-atlas-nav" />
          <div className="mt-2 h-3 w-1/2 rounded bg-atlas-nav" />
        </div>

        {/* Queue link card */}
        <div className="animate-pulse rounded-2xl border border-glass-border bg-atlas-surface p-5">
          <div className="h-4 w-1/3 rounded bg-atlas-nav" />
          <div className="mt-2 h-3 w-2/3 rounded bg-atlas-nav" />
        </div>

        {/* Campaign cards */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl border border-glass-border bg-atlas-surface p-6"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-1/3 rounded bg-atlas-nav" />
              <div className="h-6 w-20 rounded-full bg-atlas-nav" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-3 w-full rounded bg-atlas-nav" />
              <div className="h-3 w-3/4 rounded bg-atlas-nav" />
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

import AppShell from "@/components/layout/AppShell";

export default function Loading() {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        {/* Header + actions */}
        <div className="animate-pulse flex items-center justify-between">
          <div>
            <div className="h-6 w-48 rounded bg-atlas-nav" />
            <div className="mt-2 h-3 w-64 rounded bg-atlas-nav" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-24 rounded-lg bg-atlas-nav" />
            <div className="h-9 w-24 rounded-lg bg-atlas-nav" />
          </div>
        </div>

        {/* Team member cards grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-glass-border bg-atlas-surface p-5"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-atlas-nav" />
                <div>
                  <div className="h-4 w-28 rounded bg-atlas-nav" />
                  <div className="mt-1 h-3 w-16 rounded bg-atlas-nav" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-2 w-full rounded bg-atlas-nav" />
                <div className="h-2 w-3/4 rounded bg-atlas-nav" />
                <div className="h-2 w-1/2 rounded bg-atlas-nav" />
              </div>
              <div className="mt-3 flex justify-between border-t border-glass-border pt-3">
                <div className="h-3 w-16 rounded bg-atlas-nav" />
                <div className="h-3 w-16 rounded bg-atlas-nav" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

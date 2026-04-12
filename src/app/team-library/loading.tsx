import AppShell from "@/components/layout/AppShell";

export default function Loading() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-atlas-nav rounded w-1/3 mb-2" />
          <div className="h-4 bg-atlas-nav rounded w-1/2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-atlas-surface border border-glass-border rounded-2xl p-6 animate-pulse"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 bg-atlas-nav rounded-full shrink-0" />
                <div className="flex-1">
                  <div className="h-4 bg-atlas-nav rounded w-2/3 mb-2" />
                  <div className="h-3 bg-atlas-nav rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-atlas-nav rounded w-full" />
                <div className="h-2 bg-atlas-nav rounded w-3/4" />
                <div className="h-2 bg-atlas-nav rounded w-1/2" />
                <div className="h-2 bg-atlas-nav rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

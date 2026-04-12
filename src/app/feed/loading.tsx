import AppShell from "@/components/layout/AppShell";

export default function Loading() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-atlas-nav rounded w-1/4 mb-2" />
          <div className="h-4 bg-atlas-nav rounded w-1/2" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-atlas-surface border border-glass-border rounded-2xl p-6 animate-pulse"
          >
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 bg-atlas-nav rounded-full shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-atlas-nav rounded w-1/3" />
                <div className="h-4 bg-atlas-nav rounded w-full" />
                <div className="h-4 bg-atlas-nav rounded w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

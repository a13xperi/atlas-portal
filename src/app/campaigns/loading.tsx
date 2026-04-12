import AppShell from "@/components/layout/AppShell";

export default function Loading() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="animate-pulse flex items-center justify-between">
          <div>
            <div className="h-8 bg-atlas-nav rounded w-48 mb-2" />
            <div className="h-4 bg-atlas-nav rounded w-72" />
          </div>
          <div className="h-10 bg-atlas-nav rounded-lg w-36" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-atlas-surface border border-glass-border rounded-2xl p-6 animate-pulse"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-5 bg-atlas-nav rounded w-1/3" />
              <div className="h-5 bg-atlas-nav rounded-full w-20" />
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-atlas-nav rounded w-full" />
              <div className="h-3 bg-atlas-nav rounded w-3/4" />
            </div>
            <div className="mt-4 flex gap-2">
              <div className="h-6 bg-atlas-nav rounded-full w-16" />
              <div className="h-6 bg-atlas-nav rounded-full w-20" />
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

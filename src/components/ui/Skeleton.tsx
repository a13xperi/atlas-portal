export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-white/5 rounded-lg ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonStatCard() {
  return (
    <div className="bg-atlas-surface border border-glass-border rounded-2xl p-6">
      <Skeleton className="h-3 w-24 mb-3" />
      <Skeleton className="h-8 w-12" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center justify-between px-6 py-4 gap-4">
      <Skeleton className="h-4 flex-1 max-w-xs" />
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  );
}

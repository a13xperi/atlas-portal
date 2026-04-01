import { Skeleton } from "@/components/ui/Skeleton";

export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-atlas-bg">
      {/* NavBar skeleton */}
      <div className="h-14 bg-atlas-nav border-b border-glass-border flex items-center px-6 gap-4">
        <Skeleton className="h-6 w-24" />
        <div className="flex-1" />
        <Skeleton className="h-5 w-32 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>

      {/* Content skeleton */}
      <main className="pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Page heading */}
          <Skeleton className="h-7 w-48 mb-6" />

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-atlas-surface border border-glass-border rounded-2xl p-6"
              >
                <Skeleton className="h-3 w-24 mb-3" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>

          {/* Content cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="bg-atlas-surface border border-glass-border rounded-2xl p-6"
              >
                <Skeleton className="h-5 w-40 mb-4" />
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-3/4 mb-2" />
                <Skeleton className="h-3 w-5/6" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

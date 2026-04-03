import AppShell from "@/components/layout/AppShell";

const skeletonCards = [
  ["w-3/4", "w-full", "w-1/2"],
  ["w-1/2", "w-3/4", "w-full"],
  ["w-full", "w-1/2", "w-3/4"],
];

export default function Loading() {
  return (
    <AppShell>
      <div className="space-y-6">
        {skeletonCards.map((widths, index) => (
          <div
            key={index}
            className="bg-atlas-surface border border-glass-border rounded-2xl p-6 animate-pulse"
          >
            <div className="space-y-3">
              <div className={`h-4 bg-atlas-nav rounded ${widths[0]}`} />
              <div className={`h-4 bg-atlas-nav rounded ${widths[1]}`} />
              <div className={`h-4 bg-atlas-nav rounded ${widths[2]}`} />
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

interface TableSkeletonProps {
  className?: string;
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

export default function TableSkeleton({
  className,
  rows = 5,
  columns = 3,
  showHeader = true,
}: TableSkeletonProps) {
  const safeRows = Math.max(rows, 1);
  const safeColumns = Math.max(columns, 1);
  const rootClassName = [
    "bg-glass backdrop-blur-xl border border-glass-border rounded-2xl overflow-hidden",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const gridTemplateColumns =
    safeColumns === 1
      ? "minmax(0, 1fr)"
      : `minmax(0, 1fr) ${Array.from({ length: safeColumns - 1 })
          .map(() => "minmax(72px, 120px)")
          .join(" ")}`;

  return (
    <div className={rootClassName} aria-hidden="true">
      {showHeader ? (
        <div
          className="hidden sm:grid gap-4 px-6 py-4 border-b border-glass-border"
          style={{ gridTemplateColumns }}
        >
          {Array.from({ length: safeColumns }).map((_, index) => (
            <div
              key={`header-${index}`}
              className={[
                "h-3 rounded-full animate-pulse bg-atlas-nav/80",
                index === 0 ? "w-24" : "w-14 justify-self-end",
              ].join(" ")}
            />
          ))}
        </div>
      ) : null}

      {Array.from({ length: safeRows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className={[
            "grid gap-4 px-4 sm:px-6 py-4",
            rowIndex > 0 ? "border-t border-glass-border/80" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={{ gridTemplateColumns }}
        >
          <div
            className={[
              "h-4 rounded-full animate-pulse bg-atlas-surface/70",
              rowIndex % 2 === 0 ? "w-4/5" : "w-3/5",
            ].join(" ")}
          />

          {Array.from({ length: safeColumns - 1 }).map((_, columnIndex) => (
            <div
              key={`row-${rowIndex}-column-${columnIndex}`}
              className={[
                "h-4 rounded-full animate-pulse bg-atlas-nav/80 justify-self-end",
                columnIndex === safeColumns - 2 ? "w-10" : "w-16",
              ].join(" ")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

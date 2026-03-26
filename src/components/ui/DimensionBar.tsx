"use client";

export interface DimensionBarProps {
  label: string;
  percentage: number;
  interactive?: boolean;
  onChange?: (value: number) => void;
}

export default function DimensionBar({
  label,
  percentage,
  interactive = false,
  onChange,
}: DimensionBarProps) {
  return (
    <div className="flex items-center gap-4 w-full">
      <span className="text-sm text-atlas-text-secondary w-36 shrink-0">
        {label}
      </span>
      <div className="relative flex-1 h-6 border border-atlas-text-secondary/30 rounded-lg overflow-hidden bg-transparent">
        {interactive ? (
          <input
            type="range"
            min={0}
            max={100}
            value={percentage}
            onChange={(e) => onChange?.(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
        ) : null}
        <div
          className="h-full bg-atlas-teal rounded-lg transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm text-atlas-text w-10 text-right">
        {percentage}%
      </span>
    </div>
  );
}

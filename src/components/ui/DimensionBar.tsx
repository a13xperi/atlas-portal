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
      <div className="relative flex-1 h-6 flex items-center">
        {/* Track background */}
        <div className="absolute inset-x-0 h-2 rounded-full bg-atlas-text-secondary/20" />
        {/* Track fill */}
        <div
          className="absolute left-0 h-2 rounded-full bg-atlas-teal transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-atlas-teal border-2 border-atlas-bg shadow-md transition-all duration-300 pointer-events-none"
          style={{ left: `calc(${percentage}% - 8px)` }}
        />
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
      </div>
      <span className="text-sm text-atlas-text w-10 text-right">
        {percentage}%
      </span>
    </div>
  );
}

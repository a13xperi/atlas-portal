"use client";

export interface DimensionBarProps {
  label: string;
  percentage: number;
  interactive?: boolean;
  onChange?: (value: number) => void;
  step?: number;
  valueLabel?: string;
}

export default function DimensionBar({
  label,
  percentage,
  interactive = false,
  onChange,
  step = 1,
  valueLabel,
}: DimensionBarProps) {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="min-w-0 flex-1 text-sm text-atlas-text-secondary">
          {label}
        </span>
        <span className="w-12 shrink-0 text-right text-sm text-atlas-text">
          {valueLabel ?? `${clampedPercentage}%`}
        </span>
      </div>
      <div className="relative flex h-6 items-center">
        <div className="pointer-events-none absolute inset-x-0 h-1 rounded-full bg-atlas-text-secondary/30" />
        <div
          className="pointer-events-none absolute left-0 h-1 rounded-full bg-gradient-to-r from-atlas-teal to-atlas-teal transition-all duration-300"
          style={{ width: `calc(${clampedPercentage}% + ${(50 - clampedPercentage) / 100}rem)` }}
        />
        {interactive ? (
          <input
            type="range"
            min={0}
            max={100}
            step={step}
            value={clampedPercentage}
            onChange={(event) => onChange?.(Number(event.target.value))}
            aria-label={label}
            className="relative z-10 h-6 w-full appearance-none bg-transparent focus:outline-none
              [&::-webkit-slider-runnable-track]:h-1
              [&::-webkit-slider-runnable-track]:rounded-full
              [&::-webkit-slider-runnable-track]:bg-transparent
              [&::-moz-range-track]:h-1
              [&::-moz-range-track]:rounded-full
              [&::-moz-range-track]:bg-transparent
              [&::-webkit-slider-thumb]:mt-[-6px]
              [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:w-4
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:border-2
              [&::-webkit-slider-thumb]:border-atlas-bg
              [&::-webkit-slider-thumb]:bg-atlas-teal
              [&::-webkit-slider-thumb]:shadow-md
              [&::-webkit-slider-thumb]:transition-all
              [&::-webkit-slider-thumb]:duration-200
              [&::-moz-range-thumb]:h-4
              [&::-moz-range-thumb]:w-4
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:border-2
              [&::-moz-range-thumb]:border-solid
              [&::-moz-range-thumb]:border-atlas-bg
              [&::-moz-range-thumb]:bg-atlas-teal
              [&::-moz-range-thumb]:shadow-md
              [&::-moz-range-thumb]:transition-all
              [&::-moz-range-thumb]:duration-200
              hover:[&::-webkit-slider-thumb]:mt-[-8px]
              hover:[&::-webkit-slider-thumb]:h-5
              hover:[&::-webkit-slider-thumb]:w-5
              hover:[&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(78,205,196,0.5)]
              hover:[&::-moz-range-thumb]:h-5
              hover:[&::-moz-range-thumb]:w-5
              hover:[&::-moz-range-thumb]:shadow-[0_0_8px_rgba(78,205,196,0.5)]"
          />
        ) : (
          <div
            className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-atlas-bg bg-atlas-teal shadow-md transition-all duration-200"
            style={{ left: `${clampedPercentage}%` }}
          />
        )}
      </div>
    </div>
  );
}

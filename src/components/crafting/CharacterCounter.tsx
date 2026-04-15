export type CharacterCounterProps = {
  value: number;
  max?: number;
  className?: string;
};

export default function CharacterCounter({
  value,
  max = 280,
  className = "",
}: CharacterCounterProps) {
  const remaining = max - value;
  const ratio = max > 0 ? value / max : 0;
  const progress = Math.min(Math.max(ratio, 0), 1);
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const tone =
    ratio > 1
      ? "text-atlas-error"
      : ratio >= 0.8
        ? "text-atlas-warning"
        : "text-atlas-teal";

  return (
    <div
      aria-atomic="true"
      aria-label={`${remaining} characters remaining`}
      aria-live="polite"
      className={`inline-flex items-center gap-2 text-xs font-mono ${tone} ${className}`.trim()}
    >
      <svg
        aria-hidden="true"
        focusable="false"
        className={`h-6 w-6 -rotate-90 ${tone}`}
        viewBox="0 0 24 24"
      >
        <circle
          cx="12"
          cy="12"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-atlas-surface"
        />
        <circle
          cx="12"
          cy="12"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray={`${progress * circumference} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <span>{remaining}</span>
    </div>
  );
}

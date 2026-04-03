"use client";

export interface RefinementChipOption {
  label: string;
  instruction: string;
}

interface RefinementChipsProps {
  onRefine: (option: RefinementChipOption) => Promise<void>;
  disabled: boolean;
  loading: string | null;
}

const chips: RefinementChipOption[] = [
  { label: "Shorter", instruction: "Make it shorter and more concise" },
  { label: "Snarkier", instruction: "Make it snarkier and more provocative" },
  { label: "Hook", instruction: "Add a stronger hook at the beginning" },
  { label: "Thread it", instruction: "Convert this into a thread format" },
] as const;

function ChipSpinner() {
  return (
    <svg
      className="animate-spin h-3 w-3 inline-block mr-1"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export default function RefinementChips({
  onRefine,
  disabled,
  loading,
}: RefinementChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => {
        const isLoading = loading === chip.label;
        const isDisabled = disabled || !!loading;
        const chipClasses = isLoading
          ? "border-atlas-teal bg-atlas-teal/10 text-atlas-teal cursor-wait"
          : isDisabled
            ? "border-glass-border text-atlas-text-secondary opacity-50 cursor-not-allowed"
            : "border-glass-border text-atlas-text-secondary hover:bg-atlas-teal/10 hover:text-atlas-teal hover:border-atlas-teal";

        return (
          <button
            key={chip.label}
            type="button"
            onClick={() => onRefine(chip)}
            disabled={isDisabled}
            aria-pressed={isLoading}
            className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${chipClasses}`}
          >
            {isLoading ? (
              <>
                <ChipSpinner />
                Refining...
              </>
            ) : (
              chip.label
            )}
          </button>
        );
      })}
    </div>
  );
}

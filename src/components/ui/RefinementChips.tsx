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
  { label: "Make it funnier", instruction: "Make this tweet funnier and more playful while keeping the core message" },
  { label: "More serious", instruction: "Make this tweet more serious and authoritative in tone" },
  { label: "Add evidence", instruction: "Add supporting data, stats, or evidence to strengthen this tweet" },
  { label: "Shorter", instruction: "Make this tweet shorter and more concise — cut the fat" },
  { label: "Bolder take", instruction: "Make this a bolder, more provocative take — don't hedge" },
  { label: "Simpler", instruction: "Simplify the language — make it accessible to a wider audience" },
  { label: "Thread it", instruction: "Expand this tweet into a short thread (2-4 tweets) maintaining the core message and voice" },
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

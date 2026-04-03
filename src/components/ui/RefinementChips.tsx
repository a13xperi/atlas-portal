"use client";

import { Loader2 } from "lucide-react";

export interface RefinementChipOption {
  label: string;
  instruction: string;
}

interface RefinementChipsProps {
  onRefine: (chip: RefinementChipOption) => Promise<void> | void;
  disabled: boolean;
  loadingChip: string | null;
}

const chips: readonly RefinementChipOption[] = [
  {
    label: "Shorter",
    instruction:
      "Rewrite this to be more concise and punchy. Under 200 characters if possible.",
  },
  {
    label: "Snarkier",
    instruction:
      "Rewrite with more wit, sarcasm, and edge. Keep the core message.",
  },
  {
    label: "Take opposite stance",
    instruction:
      "Rewrite arguing the opposite position with equal conviction.",
  },
  {
    label: "Add hook",
    instruction:
      "Add a compelling opening hook that stops the scroll. Keep the rest.",
  },
  {
    label: "Thread it",
    instruction:
      "Expand this into a 3-5 tweet thread. Number each tweet. Each under 280 chars.",
  },
] as const;

export default function RefinementChips({
  onRefine,
  disabled,
  loadingChip,
}: RefinementChipsProps) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Draft refinements">
      {chips.map((chip) => {
        const isLoading = loadingChip === chip.label;
        const isDisabled = disabled || Boolean(loadingChip);

        return (
          <button
            key={chip.label}
            type="button"
            onClick={() => void onRefine(chip)}
            disabled={isDisabled}
            className={`inline-flex items-center gap-1.5 bg-glass border border-glass-border rounded-full px-3 py-1 text-sm text-atlas-text-secondary transition-colors ${
              isDisabled
                ? "cursor-not-allowed opacity-50"
                : "hover:border-atlas-teal hover:text-atlas-teal"
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                <span>{chip.label}</span>
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

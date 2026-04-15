"use client";

import {
  SWIPE_REASON_OPTIONS,
  isKnownSwipeReason,
  normalizeSwipeReason,
} from "@/lib/swipe-signals";
import type { SwipeSignal } from "@/lib/oracle-types";

interface SwipeReasonsStepProps {
  signals: SwipeSignal[];
  onUpdateSignal: (signal: SwipeSignal) => void;
}

function splitReasons(reasons: string[]) {
  const selected = reasons
    .filter((reason) => isKnownSwipeReason(reason))
    .map((reason) => normalizeSwipeReason(reason));
  const custom = reasons.find((reason) => !isKnownSwipeReason(reason)) ?? "";

  return { selected, custom };
}

export default function SwipeReasonsStep({
  signals,
  onUpdateSignal,
}: SwipeReasonsStepProps) {
  const likedSignals = signals.filter((signal) => signal.direction === "like");

  if (likedSignals.length === 0) {
    return (
      <div className="rounded-3xl border border-glass-border bg-glass p-5 text-sm text-atlas-text-secondary backdrop-blur-xl sm:p-6">
        You skipped every tweet in the first pass. That is usable signal too, so you can keep going without tagging reasons here.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-glass-border bg-glass p-5 backdrop-blur-xl sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-atlas-teal">
        What worked?
      </p>
      <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight text-atlas-text">
        Tag the liked tweets
      </h2>
      <p className="mt-2 text-sm leading-6 text-atlas-text-secondary">
        Pick the traits that made each tweet feel right. Add a short custom note when none of the standard tags capture it.
      </p>

      <div className="mt-6 space-y-4">
        {likedSignals.map((signal, index) => {
          const { selected, custom } = splitReasons(signal.reasons);

          return (
            <div
              key={signal.tweetId}
              className="rounded-2xl border border-glass-border bg-atlas-surface/80 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-atlas-text-muted">
                Liked tweet {index + 1}
              </p>
              <p className="mt-2 text-sm leading-6 text-atlas-text">
                {signal.text}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {SWIPE_REASON_OPTIONS.map((option) => {
                  const isSelected = selected.includes(option.value);

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        const nextSelected = isSelected
                          ? selected.filter((value) => value !== option.value)
                          : [...selected, option.value];

                        onUpdateSignal({
                          ...signal,
                          reasons: custom
                            ? [...nextSelected, custom]
                            : nextSelected,
                        });
                      }}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        isSelected
                          ? "border-atlas-teal bg-atlas-teal/15 text-atlas-teal"
                          : "border-glass-border bg-atlas-bg text-atlas-text-secondary hover:border-atlas-teal/40 hover:text-atlas-text"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <label className="mt-4 block text-xs font-medium uppercase tracking-[0.12em] text-atlas-text-muted">
                Other
                <input
                  type="text"
                  value={custom}
                  onChange={(event) => {
                    const nextCustom = event.target.value.trim();
                    onUpdateSignal({
                      ...signal,
                      reasons: nextCustom ? [...selected, nextCustom] : selected,
                    });
                  }}
                  placeholder="Add your own reason"
                  className="mt-2 w-full rounded-xl border border-glass-border bg-atlas-bg px-3 py-2 text-sm normal-case tracking-normal text-atlas-text placeholder:text-atlas-text-muted focus:border-atlas-teal focus:outline-none"
                />
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import DimensionBar from "@/components/ui/DimensionBar";

export interface BlendReference {
  name: string;
  handle?: string;
}

export interface BlendRatioSliderProps {
  selfPercentage: number;
  onChange: (self: number) => void;
  /**
   * Preferred: reference voices with optional X handles for avatar rendering.
   */
  references?: BlendReference[];
  /**
   * Back-compat: plain name list. Used when `references` is not supplied.
   */
  referenceNames?: string[];
  /**
   * Optional callback invoked when individual reference weights change.
   * Weights are normalized so they sum to 100 (share of the reference portion).
   */
  onReferenceWeightsChange?: (weights: number[]) => void;
}

export default function BlendRatioSlider({
  selfPercentage,
  onChange,
  references,
  referenceNames,
  onReferenceWeightsChange,
}: BlendRatioSliderProps) {
  const refs: BlendReference[] =
    references && references.length > 0
      ? references
      : (referenceNames ?? []).map((name) => ({ name }));

  const refPercentage = 100 - selfPercentage;

  // Local weights (share of the reference portion). Default: equal split.
  const [weights, setWeights] = useState<number[]>(() =>
    refs.length > 0 ? refs.map(() => 100 / refs.length) : []
  );

  // Re-sync if the reference list changes length (selection edited upstream).
  if (weights.length !== refs.length) {
    const next =
      refs.length > 0 ? refs.map(() => 100 / refs.length) : [];
    // Defer to effect-like semantics without useEffect; safe because we
    // only mutate when lengths diverge.
    queueMicrotask(() => setWeights(next));
  }

  const handleWeightChange = (index: number, value: number) => {
    if (refs.length <= 1) return;
    const clamped = Math.min(100, Math.max(0, value));
    const others = weights
      .map((w, i) => (i === index ? 0 : w))
      .reduce((a, b) => a + b, 0);
    const remaining = 100 - clamped;
    const next = weights.map((w, i) => {
      if (i === index) return clamped;
      if (others === 0) return remaining / (refs.length - 1);
      return (w / others) * remaining;
    });
    setWeights(next);
    onReferenceWeightsChange?.(next);
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h2 className="font-heading font-bold text-xl text-atlas-text">
          Set your blend ratio
        </h2>
        <p className="text-sm text-atlas-text-secondary">
          How much should your voice lean on your own style vs. your references?
          You can always change this later.
        </p>
      </div>

      <div className="bg-atlas-surface rounded-2xl p-6 space-y-4">
        {/* Master slider: my voice vs. references */}
        <DimensionBar
          label="My voice vs. References"
          percentage={selfPercentage}
          interactive
          onChange={(v) => onChange(Math.round(v))}
          step={5}
          valueLabel={`${selfPercentage}% me`}
        />
        <div className="flex items-center justify-between text-xs text-atlas-text-muted">
          <span>More me</span>
          <span>More references</span>
        </div>
      </div>

      {/* Breakdown */}
      {refs.length > 0 && (
        <div className="bg-atlas-surface/50 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-atlas-text-muted uppercase tracking-wide">
              Blend breakdown
            </p>
            <p className="text-xs text-atlas-text-muted">
              References share {refPercentage}%
            </p>
          </div>

          {/* My voice row */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 shrink-0 rounded-full bg-atlas-teal/20 border border-atlas-teal/40 flex items-center justify-center">
              <span className="text-[10px] font-semibold text-atlas-teal">
                ME
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-atlas-text truncate">My voice</span>
                <span className="text-atlas-teal font-semibold shrink-0 ml-2">
                  {selfPercentage}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-atlas-text-secondary/20 overflow-hidden">
                <div
                  className="h-full bg-atlas-teal transition-all duration-300"
                  style={{ width: `${selfPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Reference voice rows */}
          {refs.map((ref, i) => {
            const share = weights[i] ?? 0;
            // Effective portion of total voice
            const effective = Math.round((share / 100) * refPercentage);
            const interactive = refs.length > 1;
            return (
              <div key={`${ref.name}-${i}`} className="flex items-center gap-3">
                <RefAvatar handle={ref.handle} name={ref.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-atlas-text-secondary truncate">
                      {ref.name}
                    </span>
                    <span className="text-atlas-text-secondary shrink-0 ml-2 tabular-nums">
                      {effective}%
                    </span>
                  </div>
                  {interactive ? (
                    <div className="relative h-1.5 w-full rounded-full bg-atlas-text-secondary/20 overflow-hidden">
                      <div
                        className="pointer-events-none absolute inset-y-0 left-0 bg-atlas-teal/70 transition-all duration-200"
                        style={{ width: `${Math.round(share)}%` }}
                      />
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={Math.round(share)}
                        onChange={(e) =>
                          handleWeightChange(i, Number(e.target.value))
                        }
                        aria-label={`${ref.name} share`}
                        className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                      />
                    </div>
                  ) : (
                    <div className="h-1.5 w-full rounded-full bg-atlas-text-secondary/20 overflow-hidden">
                      <div
                        className="h-full bg-atlas-teal/70 transition-all duration-300"
                        style={{ width: `${Math.round(share)}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RefAvatar({ handle, name }: { handle?: string; name: string }) {
  const [errored, setErrored] = useState(false);
  const initial = (name || "?").trim().charAt(0).toUpperCase();

  if (!handle || errored) {
    return (
      <div className="h-8 w-8 shrink-0 rounded-full bg-atlas-surface border border-atlas-text-secondary/20 flex items-center justify-center">
        <span className="text-[10px] font-semibold text-atlas-text-secondary">
          {initial}
        </span>
      </div>
    );
  }

  const cleanHandle = handle.replace(/^@/, "");
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://unavatar.io/twitter/${cleanHandle}`}
      alt={name}
      onError={() => setErrored(true)}
      className="h-8 w-8 shrink-0 rounded-full object-cover border border-atlas-text-secondary/20 bg-atlas-surface"
    />
  );
}

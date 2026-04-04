"use client";

import DimensionBar from "@/components/ui/DimensionBar";

export interface BlendRatioSliderProps {
  selfPercentage: number;
  onChange: (self: number) => void;
  referenceNames: string[];
}

export default function BlendRatioSlider({
  selfPercentage,
  onChange,
  referenceNames,
}: BlendRatioSliderProps) {
  const refPercentage = 100 - selfPercentage;
  const perRefPercentage =
    referenceNames.length > 0
      ? Math.round(refPercentage / referenceNames.length)
      : 0;

  return (
    <div className="space-y-6">
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
        {/* Main slider */}
        <DimensionBar
          label="My voice"
          percentage={selfPercentage}
          interactive
          onChange={(v) => onChange(Math.round(v))}
          step={5}
          valueLabel={`${selfPercentage}%`}
        />

        {/* Visual split indicator */}
        <div className="flex items-center justify-between text-xs text-atlas-text-muted pt-2">
          <span>More me</span>
          <span>More references</span>
        </div>
      </div>

      {/* Breakdown */}
      {referenceNames.length > 0 && (
        <div className="bg-atlas-surface/50 rounded-2xl p-4 space-y-2">
          <p className="text-xs text-atlas-text-muted uppercase tracking-wide mb-3">
            Blend breakdown
          </p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-atlas-text">My voice</span>
            <span className="text-atlas-teal font-semibold">
              {selfPercentage}%
            </span>
          </div>
          {referenceNames.map((name) => (
            <div key={name} className="flex items-center justify-between text-sm">
              <span className="text-atlas-text-secondary truncate mr-2">
                {name}
              </span>
              <span className="text-atlas-text-secondary shrink-0">
                {perRefPercentage}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

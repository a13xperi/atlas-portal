"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingShell from "@/components/layout/OnboardingShell";
import ProgressBar from "@/components/ui/ProgressBar";
import GradientButton from "@/components/ui/GradientButton";
import { Mic, Check } from "lucide-react";

const styleOptions = ["Fun", "Serious", "Custom mix"];

const referenceVoices = [
  "Cobie",
  "Hsaka",
  "Ansem",
  "Hasu",
  "DegenSpartan",
  "Mando",
];

export default function TrackBPage() {
  const router = useRouter();
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedVoices, setSelectedVoices] = useState<Set<string>>(new Set());
  const [blendValues, setBlendValues] = useState([40, 35, 25]);

  const toggleVoice = (voice: string) => {
    setSelectedVoices((prev) => {
      const next = new Set(prev);
      if (next.has(voice)) next.delete(voice);
      else next.add(voice);
      return next;
    });
  };

  const updateBlend = (index: number, value: number) => {
    const newValues = [...blendValues];
    newValues[index] = value;
    setBlendValues(newValues);
  };

  return (
    <OnboardingShell maxWidth="720px">
      <ProgressBar currentStep={1} totalSteps={7} />

      <div className="mt-8 space-y-8">
        <p className="text-atlas-text text-center">
          No worries, I got you. There is no wrong way to do this.
        </p>

        {/* Style Prompt */}
        <section>
          <h3 className="font-heading text-lg text-atlas-text mb-3">
            What type of style do you like?
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {styleOptions.map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => setSelectedStyle(style)}
                className={`bg-atlas-surface rounded-2xl p-4 text-center text-sm transition-all ${
                  selectedStyle === style
                    ? "border border-atlas-teal ring-1 ring-atlas-teal text-atlas-text"
                    : "border border-glass-border text-atlas-text-secondary hover:border-atlas-text-secondary"
                }`}
              >
                {style}
              </button>
            ))}
          </div>
          <p className="text-atlas-text-muted text-xs italic mt-2">
            You can switch styles anytime — this is just a starting point.
          </p>
        </section>

        {/* Reference Voices */}
        <section>
          <label className="text-xs text-atlas-text-secondary uppercase tracking-wide">
            Pick voices you admire.
          </label>
          <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-3">
            {referenceVoices.map((voice) => {
              const isSelected = selectedVoices.has(voice);
              return (
                <button
                  key={voice}
                  type="button"
                  onClick={() => toggleVoice(voice)}
                  className={`flex flex-col items-center gap-2 bg-atlas-surface rounded-2xl p-3 transition-all ${
                    isSelected
                      ? "border border-atlas-teal"
                      : "border border-glass-border"
                  }`}
                >
                  <div className="relative w-10 h-10 rounded-full bg-atlas-nav flex items-center justify-center text-atlas-text-secondary text-sm">
                    {voice[0]}
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-atlas-teal flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-atlas-bg" />
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-atlas-text-secondary">
                    {voice}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-atlas-teal text-sm mt-3 cursor-pointer hover:underline">
            + Add your own — paste a Twitter handle
          </p>
          <p className="text-atlas-text-muted text-xs mt-1">
            Hover any name to preview their profile.
          </p>
        </section>

        {/* Paste Zone */}
        <section>
          <div className="border-2 border-dashed border-atlas-text-secondary/30 bg-atlas-surface rounded-2xl p-8 text-center">
            <p className="text-atlas-text-secondary text-sm">
              Paste tweet links you like
            </p>
            <p className="text-atlas-text-muted text-xs mt-2">
              You can also send these via Telegram later.
            </p>
          </div>
        </section>

        {/* Upload + Feedback */}
        <section>
          <div className="border-2 border-dashed border-atlas-text-secondary/30 bg-atlas-surface rounded-2xl p-8 text-center">
            <p className="text-atlas-text-secondary text-sm">
              Drop a report or article
            </p>
          </div>
          <p className="text-atlas-text-secondary text-sm mt-3">
            Tell me what you liked about it
          </p>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="text"
              placeholder="Type here or drop a voice note"
              className="flex-1 bg-atlas-surface rounded-lg px-4 py-3 text-sm text-atlas-text placeholder-atlas-text-secondary border border-glass-border focus:outline-none focus:border-atlas-teal"
            />
            <button
              type="button"
              className="p-3 bg-atlas-surface rounded-lg border border-glass-border text-atlas-text-secondary hover:text-atlas-teal transition-colors"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* Blend Sliders */}
        <section>
          <div className="space-y-4">
            {["Reference A", "Reference B", "Custom style"].map((label, i) => (
              <div key={label} className="flex items-center gap-4">
                <span className="text-sm text-atlas-text-secondary w-28 shrink-0">
                  {label}
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={blendValues[i]}
                  onChange={(e) => updateBlend(i, Number(e.target.value))}
                  className="flex-1 accent-atlas-teal"
                />
                <span className="text-sm text-atlas-text w-10 text-right">
                  {blendValues[i]}%
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-atlas-surface rounded-2xl p-4">
            <p className="text-sm text-atlas-text-secondary italic">
              Preview: &quot;DeFi governance is mostly theater — but the 5% of
              proposals that matter are worth paying attention to.&quot;
            </p>
          </div>
          <p className="text-atlas-text-muted text-xs mt-2">
            You can always adjust this later from Voice Profiles.
          </p>
        </section>

        <GradientButton
          fullWidth
          onClick={() => router.push("/onboarding/handoff")}
        >
          Let&apos;s get started
        </GradientButton>
      </div>
    </OnboardingShell>
  );
}

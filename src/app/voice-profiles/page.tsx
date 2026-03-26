"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import DimensionBar from "@/components/ui/DimensionBar";
import GradientButton from "@/components/ui/GradientButton";
import { Check, Plus } from "lucide-react";

const referenceVoices = [
  "Cobie",
  "Hsaka",
  "Ansem",
  "Hasu",
  "DegenSpartan",
  "Mando",
];

const savedBlends = [
  { name: "Default Blend", mix: "40% Me + 30% Cobie + 30% Naval" },
  { name: "Research Mode", mix: "70% Me + 20% Hasu + 10% Hsaka" },
  { name: "Hot Take Mode", mix: "30% Me + 40% DegenSpartan + 30% Cobie" },
];

export default function VoiceProfilesPage() {
  const [selectedVoices, setSelectedVoices] = useState<Set<string>>(
    new Set(["Cobie", "Hasu"])
  );
  const [blendValues, setBlendValues] = useState([40, 30, 20, 10]);

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
    <AppShell>
      <h1 className="font-heading text-2xl text-atlas-text">
        Your Voice Profiles
      </h1>

      {/* Detailed Voice Card */}
      <div className="mt-6 bg-atlas-surface border border-glass-border rounded-2xl p-8">
        <h3 className="font-heading text-lg text-atlas-text mb-4">
          Your Voice — Detailed Breakdown
        </h3>
        <div className="space-y-3">
          <DimensionBar label="Humor" percentage={35} />
          <DimensionBar label="Formality" percentage={20} />
          <DimensionBar label="Brevity" percentage={60} />
          <DimensionBar label="Contrarian tone" percentage={45} />
        </div>
        <div className="mt-4 flex gap-4 text-sm text-atlas-text-secondary">
          <span>Maturity: Advanced</span>
          <span>Based on 847 tweets analyzed.</span>
        </div>
        <p className="text-atlas-text-muted text-sm italic mt-2">
          Tap any dimension to see the tweets that shaped it.
        </p>
      </div>

      {/* Reference Voices */}
      <div className="mt-8">
        <label className="text-xs text-atlas-text-secondary uppercase tracking-wide">
          Reference Voices
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
          + Add your own
        </p>
      </div>

      {/* Saved Blends */}
      <div className="mt-8">
        <label className="text-xs text-atlas-text-secondary uppercase tracking-wide">
          Your Saved Blends
        </label>
        <div className="mt-3 space-y-3">
          {savedBlends.map((blend) => (
            <div
              key={blend.name}
              className="bg-atlas-surface border border-glass-border rounded-2xl p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-sm text-atlas-text font-medium">
                  {blend.name}
                </p>
                <p className="text-xs text-atlas-text-secondary mt-1">
                  {blend.mix}
                </p>
              </div>
              <GradientButton variant="outline-teal">Use</GradientButton>
            </div>
          ))}
        </div>
        <p className="text-atlas-teal text-sm mt-3 cursor-pointer hover:underline">
          + New blend
        </p>
      </div>

      {/* Blend Creator */}
      <div className="mt-8 bg-atlas-surface border border-glass-border rounded-2xl p-8">
        <h3 className="font-heading text-lg text-atlas-text mb-4">
          Create or Edit a Blend
        </h3>
        <div className="space-y-4">
          {["My voice", "Reference A", "Reference B", "Reference C"].map(
            (label, i) => (
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
            )
          )}
        </div>
        <div className="mt-4 bg-atlas-nav rounded-2xl p-4">
          <p className="text-sm text-atlas-text-secondary italic">
            Preview: &quot;The merge was 18 months ago and we&apos;re still
            arguing about MEV. Builders are the new miners — and they&apos;re
            playing a completely different game.&quot;
          </p>
        </div>
        <p className="text-atlas-text-muted text-xs mt-2">
          Add more voices from Reference Voices above.
        </p>
        <div className="mt-4 flex gap-3">
          <GradientButton>Save blend</GradientButton>
          <GradientButton variant="outline-teal">
            Share with team
          </GradientButton>
        </div>
      </div>
    </AppShell>
  );
}

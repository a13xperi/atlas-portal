"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingShell from "@/components/layout/OnboardingShell";
import ProgressBar from "@/components/ui/ProgressBar";
import DimensionBar from "@/components/ui/DimensionBar";
import GradientButton from "@/components/ui/GradientButton";
import { ThumbsUp, ThumbsDown, Mic, Plus } from "lucide-react";

const sampleTweets = [
  "ETH staking yields are compressing fast. The easy alpha is gone — now it's about execution risk and DVT adoption.",
  "Everyone's talking about L2 fees but nobody's asking why L1 gas is still this high during a bear market.",
  "Hot take: most DeFi governance is theater. Token holders vote, whales decide.",
  "The merge was 18 months ago and we're still arguing about MEV. Builders are the new miners.",
];

const referenceAccounts = ["Cobie", "Hsaka", "Ansem", "Hasu"];

export default function TrackAPage() {
  const router = useRouter();
  const [blendValues, setBlendValues] = useState([40, 30, 30]);

  const updateBlend = (index: number, value: number) => {
    const newValues = [...blendValues];
    newValues[index] = value;
    setBlendValues(newValues);
  };

  return (
    <OnboardingShell maxWidth="720px">
      <ProgressBar currentStep={1} totalSteps={6} />

      <div className="mt-8 space-y-8">
        {/* Voice Card */}
        <section>
          <h2 className="font-heading text-xl text-atlas-text mb-4">
            This is what I think your writing voice is.
          </h2>
          <div className="space-y-3">
            <DimensionBar label="Humor" percentage={35} />
            <DimensionBar label="Formality" percentage={20} />
            <DimensionBar label="Brevity" percentage={60} />
            <DimensionBar label="Contrarian tone" percentage={45} />
          </div>
          <p className="text-atlas-text-secondary text-sm italic mt-4">
            Here is why Atlas inferred this — based on 847 tweets analyzed. Rate
            the examples below or paste tweets you like to help me dial it in.
          </p>
        </section>

        {/* Tweet Examples */}
        <section>
          <label className="text-xs text-atlas-text-secondary uppercase tracking-wide">
            Rate these examples to refine your voice.
          </label>
          <div className="mt-3 space-y-3">
            {sampleTweets.map((tweet, i) => (
              <div
                key={i}
                className="bg-atlas-surface rounded-2xl p-4 flex items-start justify-between gap-4"
              >
                <p className="text-sm text-atlas-text flex-1">{tweet}</p>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    className="text-atlas-text-secondary hover:text-atlas-teal transition-colors"
                    title="More like me"
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="text-atlas-text-secondary hover:text-atlas-error transition-colors"
                    title="Less like me"
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Feedback Input */}
        <section>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Tell me why — type here or drop a voice note"
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

        {/* Paste Zone */}
        <section>
          <div className="border-2 border-dashed border-atlas-text-secondary/30 bg-atlas-surface rounded-2xl p-8 text-center">
            <p className="text-atlas-text-secondary text-sm">
              Paste tweet links you like — Atlas uses these as style signals.
            </p>
            <p className="text-atlas-text-muted text-xs mt-2">
              Single tweets add to your style preferences. Full accounts add as
              reference voices.
            </p>
          </div>
        </section>

        {/* Reference Accounts */}
        <section>
          <label className="text-xs text-atlas-text-secondary uppercase tracking-wide">
            Add reference accounts for voice blending.
          </label>
          <div className="mt-3 flex items-center gap-3">
            {referenceAccounts.map((name) => (
              <div
                key={name}
                className="flex flex-col items-center gap-1 cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-full bg-atlas-surface border border-glass-border flex items-center justify-center text-atlas-text-secondary group-hover:border-atlas-teal transition-colors">
                  {name[0]}
                </div>
                <span className="text-xs text-atlas-text-secondary">
                  {name}
                </span>
              </div>
            ))}
            <div className="flex flex-col items-center gap-1 cursor-pointer group">
              <div className="w-12 h-12 rounded-full bg-atlas-surface border border-dashed border-atlas-text-secondary/30 flex items-center justify-center text-atlas-text-secondary group-hover:border-atlas-teal transition-colors">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-xs text-atlas-text-muted">Add</span>
            </div>
          </div>
        </section>

        {/* Blend Sliders */}
        <section>
          <div className="space-y-4">
            {["My voice", "Reference A", "Reference B"].map((label, i) => (
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
              Preview: &quot;ETH staking yields are compressing — the easy alpha
              window is closing and it&apos;s all about execution risk now.&quot;
            </p>
          </div>
          <p className="text-atlas-text-muted text-xs mt-2">
            Set your starting blend — you can always change this later.
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

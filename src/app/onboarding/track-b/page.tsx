"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingShell from "@/components/layout/OnboardingShell";
import ProgressBar from "@/components/ui/ProgressBar";
import GradientButton from "@/components/ui/GradientButton";
import { Mic, Check, Loader2, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

const styleOptions = [
  { label: "Fun", description: "Playful, witty, meme-friendly" },
  { label: "Serious", description: "Professional, data-driven" },
  { label: "Custom mix", description: "Blend it your way (recommended)" },
];

const referenceVoices = [
  "Cobie",
  "Hsaka",
  "Ansem",
  "Hasu",
  "DegenSpartan",
  "Mando",
];

// Map style selection to voice dimensions
function styleToDimensions(style: string | null) {
  switch (style) {
    case "Fun":
      return { humor: 80, formality: 20, brevity: 70, contrarianTone: 50 };
    case "Serious":
      return { humor: 15, formality: 75, brevity: 50, contrarianTone: 40 };
    case "Custom mix":
    default:
      return { humor: 50, formality: 50, brevity: 50, contrarianTone: 50 };
  }
}

export default function TrackBPage() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [selectedStyle, setSelectedStyle] = useState<string | null>("Custom mix");
  const [selectedVoices, setSelectedVoices] = useState<Set<string>>(new Set());
  const [blendValues, setBlendValues] = useState([40, 35, 25]);
  const [saving, setSaving] = useState(false);
  const [addingHandle, setAddingHandle] = useState(false);
  const [newHandle, setNewHandle] = useState("");
  const [tweetLinks, setTweetLinks] = useState("");

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

  const handleAddCustomHandle = () => {
    if (!newHandle.trim()) return;
    const clean = newHandle.trim().replace(/^@/, "");
    setSelectedVoices((prev) => new Set(prev).add(clean));
    setNewHandle("");
    setAddingHandle(false);
  };

  const handleSaveAndContinue = async () => {
    if (!token) return;
    setSaving(true);
    try {
      // 1. Save voice dimensions based on style selection
      const dims = styleToDimensions(selectedStyle);
      await api.voice.updateProfile(token, dims);

      // 2. Save selected reference voices
      const voices = Array.from(selectedVoices);
      for (const voice of voices) {
        try {
          await api.voice.addReference(token, voice, voice);
        } catch {
          // Voice may already exist — skip
        }
      }

      // 3. Create a blend from the slider values if voices selected
      if (voices.length > 0) {
        const blendVoices = voices.slice(0, 3).map((v, i) => ({
          label: v,
          percentage: blendValues[i] || Math.round(100 / voices.length),
        }));
        try {
          await api.voice.createBlend(token, "My starting blend", blendVoices);
        } catch {
          // Blend creation optional
        }
      }

      router.push("/onboarding/handoff");
    } catch (e) {
      console.error("Failed to save voice config:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingShell maxWidth="720px">
      <ProgressBar currentStep={1} totalSteps={7} />

      <div className="mt-8 space-y-8">
        {/* Handle display */}
        {user?.handle && (
          <p className="text-atlas-text-secondary text-sm text-center">
            Setting up voice for{" "}
            <span className="text-atlas-teal">@{user.handle}</span>
          </p>
        )}

        <p className="text-atlas-text text-center">
          No worries, I got you. There is no wrong way to do this.
        </p>

        {/* Style Prompt */}
        <section>
          <h3 className="font-heading text-lg text-atlas-text mb-3">
            What type of style do you like?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {styleOptions.map(({ label, description }) => (
              <button
                key={label}
                type="button"
                onClick={() => setSelectedStyle(label)}
                className={`bg-atlas-surface rounded-2xl p-4 text-center transition-all ${
                  selectedStyle === label
                    ? "border border-atlas-teal ring-1 ring-atlas-teal text-atlas-text"
                    : "border border-glass-border text-atlas-text-secondary hover:border-atlas-text-secondary"
                }`}
              >
                <span className="text-sm font-medium">{label}</span>
                <p className="text-xs text-atlas-text-muted mt-1">{description}</p>
              </button>
            ))}
          </div>
          <p className="text-atlas-text-muted text-xs italic mt-2">
            Your default tone — you can vary it post-by-post from the Crafting Station.
          </p>
        </section>

        {/* Reference Voices */}
        <section>
          <label className="text-xs text-atlas-text-secondary uppercase tracking-wide">
            Pick voices you admire.
          </label>
          <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[...referenceVoices, ...Array.from(selectedVoices).filter((v) => !referenceVoices.includes(v))].map((voice) => {
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
                  <div className="relative w-10 h-10 rounded-full bg-atlas-teal/20 flex items-center justify-center text-atlas-teal text-sm font-medium">
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

          {/* Add custom handle */}
          {addingHandle ? (
            <div className="flex items-center gap-2 mt-3">
              <input
                type="text"
                value={newHandle}
                onChange={(e) => setNewHandle(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddCustomHandle(); }}
                placeholder="@twitterhandle"
                autoFocus
                className="flex-1 bg-atlas-surface rounded-lg px-4 py-2 text-sm text-atlas-text placeholder-atlas-text-secondary border border-glass-border focus:outline-none focus:border-atlas-teal"
              />
              <button
                type="button"
                onClick={handleAddCustomHandle}
                className="px-3 py-2 text-sm rounded-lg bg-atlas-teal/10 text-atlas-teal border border-atlas-teal/30"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setAddingHandle(false)}
                className="px-3 py-2 text-sm text-atlas-text-secondary"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingHandle(true)}
              className="flex items-center gap-1 text-atlas-teal text-sm mt-3 hover:underline"
            >
              <Plus className="w-3 h-3" /> Add your own — paste a Twitter handle
            </button>
          )}
        </section>

        {/* Paste Tweet Links (Optional) */}
        <section>
          <label className="text-xs text-atlas-text-secondary uppercase tracking-wide">
            Paste tweet links you like <span className="text-atlas-text-muted">(optional)</span>
          </label>
          <textarea
            value={tweetLinks}
            onChange={(e) => setTweetLinks(e.target.value)}
            placeholder="Paste one or more tweet URLs — one per line"
            rows={3}
            className="mt-2 w-full bg-atlas-surface rounded-2xl px-4 py-3 text-sm text-atlas-text placeholder-atlas-text-secondary border border-dashed border-atlas-text-secondary/30 focus:outline-none focus:border-atlas-teal resize-none"
          />
          <p className="text-atlas-text-muted text-xs mt-1">
            You can also send these via Telegram later.
          </p>
        </section>

        {/* Blend Sliders */}
        <section>
          <label className="text-xs text-atlas-text-secondary uppercase tracking-wide">
            Adjust your voice blend
          </label>
          <div className="mt-3 space-y-4">
            {["My voice", ...(Array.from(selectedVoices).slice(0, 2).length > 0 ? Array.from(selectedVoices).slice(0, 2) : ["Reference A", "Reference B"])].map((label, i) => (
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
          <p className="text-atlas-text-muted text-xs mt-2">
            You can always adjust this later from Voice Profiles.
          </p>
        </section>

        <GradientButton
          fullWidth
          onClick={handleSaveAndContinue}
          disabled={saving}
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Saving your voice…
            </span>
          ) : (
            "Let\u2019s get started"
          )}
        </GradientButton>
      </div>
    </OnboardingShell>
  );
}

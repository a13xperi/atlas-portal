"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingShell from "@/components/layout/OnboardingShell";
import VoiceDimensionSections from "@/components/voice-profiles/VoiceDimensionSections";
import GradientButton from "@/components/ui/GradientButton";
import {
  Check,
  Loader2,
  PenLine,
  Plus,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import {
  hasAnyVoiceDimension,
  styleToDimensions,
  VoiceDimensions,
} from "@/lib/voice-profile-dimensions";

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

const manualSetupSteps = [
  {
    icon: Sparkles,
    title: "Choose a preset",
    description: "Start with Fun, Serious, or a custom mix.",
  },
  {
    icon: SlidersHorizontal,
    title: "Tune all 12 dimensions",
    description: "Dial the balance until the tone feels right.",
  },
  {
    icon: PenLine,
    title: "Save your baseline",
    description: "Use it as your default voice inside Atlas.",
  },
];

export default function TrackBPage() {
  const router = useRouter();
  const { user } = useAuth();
  const currentStep = 1;
  const totalSteps = 3;
  const [selectedStyle, setSelectedStyle] = useState<string | null>("Custom mix");
  const [dimensions, setDimensions] = useState<VoiceDimensions>(() =>
    styleToDimensions("Custom mix")
  );
  const [selectedVoices, setSelectedVoices] = useState<Set<string>>(new Set());
  const [blendValues, setBlendValues] = useState([40, 35, 25]);
  const [saving, setSaving] = useState(false);
  const [addingHandle, setAddingHandle] = useState(false);
  const [newHandle, setNewHandle] = useState("");
  const [tweetLinks, setTweetLinks] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [displayNameError, setDisplayNameError] = useState("");
  const [dimensionsError, setDimensionsError] = useState("");

  useEffect(() => {
    const fallbackDisplayName = user?.displayName || user?.handle;

    if (!fallbackDisplayName) return;

    setDisplayName((current) => current || fallbackDisplayName);
  }, [user?.displayName, user?.handle]);

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
    const trimmedDisplayName = displayName.trim();
    const hasVoiceDimension = hasAnyVoiceDimension(dimensions);
    let isValid = true;

    if (trimmedDisplayName.length < 2) {
      setDisplayNameError("Display name must be at least 2 characters.");
      isValid = false;
    } else {
      setDisplayNameError("");
    }

    if (!hasVoiceDimension) {
      setDimensionsError("Set at least one voice dimension above 0.");
      isValid = false;
    } else {
      setDimensionsError("");
    }

    if (!isValid) return;

    setSaving(true);
    try {
      await api.users.updateProfile({ displayName: trimmedDisplayName });
      await api.voice.updateProfile(dimensions);

      const voices = Array.from(selectedVoices);
      for (const voice of voices) {
        try {
          await api.voice.addReference(voice, voice);
        } catch {
          // Voice may already exist — skip
        }
      }

      if (voices.length > 0) {
        const blendVoices = voices.slice(0, 3).map((v, i) => ({
          label: v,
          percentage: blendValues[i] || Math.round(100 / voices.length),
        }));
        try {
          await api.voice.createBlend("My starting blend", blendVoices);
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
    <OnboardingShell
      maxWidth="720px"
      step={currentStep}
      totalSteps={totalSteps}
    >
      <div className="mt-8 space-y-8">
        <section className="rounded-3xl border border-glass-border bg-atlas-surface/60 p-6 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-full border border-atlas-teal/30 bg-atlas-teal/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-atlas-teal">
              Track B · Manual setup
            </span>
            <span className="rounded-full border border-glass-border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-atlas-text-secondary">
              Step 1 · Shape your voice
            </span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-[1.1fr_0.9fr] sm:items-start">
            <div>
              <h1 className="font-heading text-3xl text-atlas-text">
                Build Your Voice Manually
              </h1>
              <p className="mt-3 text-sm leading-6 text-atlas-text-secondary">
                Pick a starting style, then fine-tune each dimension to match
                how you write.
              </p>
            </div>

            <div className="grid gap-3">
              {manualSetupSteps.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-glass-border bg-atlas-surface/70 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl border border-atlas-teal/20 bg-atlas-teal/10 p-2 text-atlas-teal">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-atlas-text">{title}</p>
                      <p className="mt-1 text-xs leading-5 text-atlas-text-secondary">
                        {description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {user?.handle && (
          <p className="text-center text-sm text-atlas-text-secondary">
            Setting up voice for{" "}
            <span className="text-atlas-teal">@{user.handle}</span>
          </p>
        )}

        <section>
          <label
            htmlFor="display-name"
            className="text-xs text-atlas-text-secondary uppercase tracking-wide"
          >
            Display name
          </label>
          <input
            id="display-name"
            type="text"
            value={displayName}
            onChange={(event) => {
              const nextDisplayName = event.target.value;
              setDisplayName(nextDisplayName);
              if (displayNameError && nextDisplayName.trim().length >= 2) {
                setDisplayNameError("");
              }
            }}
            placeholder={user?.displayName || user?.handle || "Your display name"}
            className="mt-2 w-full rounded-lg border border-glass-border bg-atlas-surface px-4 py-3 text-sm text-atlas-text placeholder-atlas-text-secondary focus:border-atlas-teal focus:outline-none"
          />
          {displayNameError && (
            <p className="mt-1 text-sm text-red-400">{displayNameError}</p>
          )}
        </section>

        <section>
          <h3 className="mb-3 font-heading text-lg text-atlas-text">
            Choose your starting style
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {styleOptions.map(({ label, description }) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setSelectedStyle(label);
                  setDimensions(styleToDimensions(label));
                  if (dimensionsError) {
                    setDimensionsError("");
                  }
                }}
                className={`rounded-2xl bg-atlas-surface p-4 text-center transition-all ${
                  selectedStyle === label
                    ? "border border-atlas-teal ring-1 ring-atlas-teal text-atlas-text"
                    : "border border-glass-border text-atlas-text-secondary hover:border-atlas-text-secondary"
                }`}
              >
                <span className="text-sm font-medium">{label}</span>
                <p className="mt-1 text-xs text-atlas-text-muted">{description}</p>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs italic text-atlas-text-muted">
            Your default tone — you can vary it post-by-post from the Crafting
            Station.
          </p>
        </section>

        <section>
          <h3 className="mb-3 font-heading text-lg text-atlas-text">
            Fine-tune each voice dimension
          </h3>
          <VoiceDimensionSections
            values={dimensions}
            interactive
            onChange={(field, value) => {
              setSelectedStyle("Custom mix");
              setDimensions((current) => ({
                ...current,
                [field]: value,
              }));
            }}
          />
          <p className="mt-3 text-xs italic text-atlas-text-muted">
            You&apos;ll keep all 12 dimensions editable later in Voice Profiles.
          </p>
          {dimensionsError && (
            <p className="mt-1 text-sm text-red-400">{dimensionsError}</p>
          )}
        </section>

        <section>
          <label className="text-xs text-atlas-text-secondary uppercase tracking-wide">
            Pick voices you admire.
          </label>
          <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {[
              ...referenceVoices,
              ...Array.from(selectedVoices).filter(
                (voice) => !referenceVoices.includes(voice)
              ),
            ].map((voice) => {
              const isSelected = selectedVoices.has(voice);
              return (
                <button
                  key={voice}
                  type="button"
                  onClick={() => toggleVoice(voice)}
                  className={`flex flex-col items-center gap-2 rounded-2xl bg-atlas-surface p-3 transition-all ${
                    isSelected
                      ? "border border-atlas-teal"
                      : "border border-glass-border"
                  }`}
                >
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-atlas-teal/20 text-sm font-medium text-atlas-teal">
                    {voice[0]}
                    {isSelected && (
                      <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-atlas-teal">
                        <Check className="h-2.5 w-2.5 text-atlas-bg" />
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

          {addingHandle ? (
            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={newHandle}
                onChange={(event) => setNewHandle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleAddCustomHandle();
                }}
                placeholder="@twitterhandle"
                autoFocus
                className="flex-1 rounded-lg border border-glass-border bg-atlas-surface px-4 py-2 text-sm text-atlas-text placeholder-atlas-text-secondary focus:border-atlas-teal focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustomHandle}
                className="rounded-lg border border-atlas-teal/30 bg-atlas-teal/10 px-3 py-2 text-sm text-atlas-teal"
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
              className="mt-3 flex items-center gap-1 text-sm text-atlas-teal hover:underline"
            >
              <Plus className="h-3 w-3" /> Add your own — paste a Twitter handle
            </button>
          )}
        </section>

        <section>
          <label className="text-xs text-atlas-text-secondary uppercase tracking-wide">
            Paste tweet links you like{" "}
            <span className="text-atlas-text-muted">(optional)</span>
          </label>
          <textarea
            value={tweetLinks}
            onChange={(event) => setTweetLinks(event.target.value)}
            placeholder="Paste one or more tweet URLs — one per line"
            rows={3}
            className="mt-2 w-full resize-none rounded-2xl border border-dashed border-atlas-text-secondary/30 bg-atlas-surface px-4 py-3 text-sm text-atlas-text placeholder-atlas-text-secondary focus:border-atlas-teal focus:outline-none"
          />
          <p className="mt-1 text-xs text-atlas-text-muted">
            You can also send these via Telegram later.
          </p>
        </section>

        <section>
          <label className="text-xs text-atlas-text-secondary uppercase tracking-wide">
            Adjust your voice blend
          </label>
          <div className="mt-3 space-y-4">
            {[
              "My voice",
              ...(Array.from(selectedVoices).slice(0, 2).length > 0
                ? Array.from(selectedVoices).slice(0, 2)
                : ["Reference A", "Reference B"]),
            ].map((label, index) => (
              <div key={label} className="flex items-center gap-4">
                <span className="w-28 shrink-0 text-sm text-atlas-text-secondary">
                  {label}
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={blendValues[index]}
                  onChange={(event) =>
                    updateBlend(index, Number(event.target.value))
                  }
                  className="flex-1 accent-atlas-teal"
                />
                <span className="w-10 text-right text-sm text-atlas-text">
                  {blendValues[index]}%
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-atlas-text-muted">
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
              <Loader2 className="h-4 w-4 animate-spin" /> Saving your voice...
            </span>
          ) : (
            "Let's get started"
          )}
        </GradientButton>
      </div>
    </OnboardingShell>
  );
}

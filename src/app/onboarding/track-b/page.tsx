"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingShell from "@/components/layout/OnboardingShell";
import VoiceDimensionSections from "@/components/voice-profiles/VoiceDimensionSections";
import GradientButton from "@/components/ui/GradientButton";
import ReferenceVoiceSelector from "@/components/onboarding/ReferenceVoiceSelector";
import BlendRatioSlider from "@/components/onboarding/BlendRatioSlider";
import TopicPicker from "@/components/onboarding/TopicPicker";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import {
  hasAnyVoiceDimension,
  styleToDimensions,
  VoiceDimensions,
} from "@/lib/voice-profile-dimensions";
import {
  buildReferenceBlendVoices,
  getReferenceAccountLookup,
  persistReferenceSelections,
  REFERENCE_ACCOUNT_FALLBACK,
} from "@/lib/reference-accounts";

const styleOptions = [
  { label: "Fun", description: "Playful, witty, meme-friendly" },
  { label: "Serious", description: "Professional, data-driven" },
  { label: "Custom mix", description: "Blend it your way (recommended)" },
];

const referenceAccountLookup = getReferenceAccountLookup(
  REFERENCE_ACCOUNT_FALLBACK
);

export default function TrackBPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const totalSteps = 6;
  const [selectedStyle, setSelectedStyle] = useState<string | null>(
    "Custom mix"
  );
  const [dimensions, setDimensions] = useState<VoiceDimensions>(() =>
    styleToDimensions("Custom mix")
  );
  const [saving, setSaving] = useState(false);
  const [tweetLinks, setTweetLinks] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [displayNameError, setDisplayNameError] = useState("");
  const [dimensionsError, setDimensionsError] = useState("");
  const [selectedRefIds, setSelectedRefIds] = useState<string[]>([]);
  const [selfPercentage, setSelfPercentage] = useState(30);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  useEffect(() => {
    const fallbackDisplayName = user?.displayName || user?.handle;
    if (!fallbackDisplayName) return;
    setDisplayName((current) => current || fallbackDisplayName);
  }, [user?.displayName, user?.handle]);

  // Step 2 → 3: save profile + dimensions
  const handleDimensionsContinue = async () => {
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
      setStep(3);
    } catch (e) {
      console.error("Failed to save voice config:", e);
    } finally {
      setSaving(false);
    }
  };

  // Step 3 → 4: save reference selections
  const handleRefSelectorContinue = async () => {
    if (selectedRefIds.length < 2 || saving) return;
    setSaving(true);
    try {
      await persistReferenceSelections({
        userId: user?.id,
        ids: selectedRefIds,
        saveRemote: api.referenceAccounts.saveSelections,
      });
      for (const referenceId of selectedRefIds) {
        const account = referenceAccountLookup.get(referenceId);
        try {
          await api.voice.addReference(
            account?.displayName || account?.name || referenceId,
            account?.handle || referenceId
          );
        } catch {
          // Reference creation is optional during onboarding.
        }
      }
      setStep(4);
    } catch (error) {
      console.error("Failed to save reference voices:", error);
    } finally {
      setSaving(false);
    }
  };

  // Step 4 → 5: create blend
  const handleBlendContinue = async () => {
    setSaving(true);
    try {
      await api.voice.createBlend(
        "My starting blend",
        buildReferenceBlendVoices(
          selectedRefIds,
          selfPercentage,
          REFERENCE_ACCOUNT_FALLBACK
        )
      );
    } catch {
      // Blend creation is optional during onboarding.
    } finally {
      setSaving(false);
    }
    setStep(5);
  };

  // Step 5 → handoff: save topics
  const handleTopicsContinue = async () => {
    setSaving(true);
    try {
      await api.briefing.updatePreferences({
        deliveryTime: "08:00",
        topics: selectedTopics,
        sources: [],
        channel: "Portal Only",
      });
    } catch {
      // Topic saving is optional during onboarding.
    } finally {
      setSaving(false);
    }
    router.push("/onboarding/handoff?step=6&total=6");
  };

  const referenceNames = selectedRefIds.map((id) => {
    const account = referenceAccountLookup.get(id);
    return account?.displayName || account?.name || id;
  });

  // ── Step 1: Welcome + Style Picker ──────────────────────────────
  if (step === 1) {
    return (
      <OnboardingShell maxWidth="720px" step={1} totalSteps={totalSteps}>
        <div className="mt-8 space-y-8">
          {/* Welcome message */}
          <section className="text-center space-y-3">
            <h1 className="font-heading font-extrabold tracking-tight text-3xl text-atlas-text">
              No worries, I got you.
            </h1>
            <p className="text-atlas-text-secondary text-sm leading-relaxed max-w-md mx-auto">
              There&apos;s no wrong way to do this. Pick a starting style, paste
              some tweets you like, and Atlas will learn your voice from there.
            </p>
          </section>

          {/* Track badge */}
          <div className="flex justify-center">
            <span className="rounded-full border border-atlas-teal/30 bg-atlas-teal/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-atlas-teal">
              Track B · Build from scratch
            </span>
          </div>

          {/* Style picker */}
          <section>
            <h3 className="mb-3 font-heading font-semibold text-lg text-atlas-text">
              What type of style do you like?
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {styleOptions.map(({ label, description }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setSelectedStyle(label);
                    setDimensions(styleToDimensions(label));
                  }}
                  className={`rounded-2xl bg-atlas-surface p-4 text-center transition-all ${
                    selectedStyle === label
                      ? "border border-atlas-teal ring-1 ring-atlas-teal text-atlas-text"
                      : "border border-glass-border text-atlas-text-secondary hover:border-atlas-text-secondary"
                  }`}
                >
                  <span className="text-sm font-medium">{label}</span>
                  <p className="mt-1 text-xs text-atlas-text-muted">
                    {description}
                  </p>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs italic text-atlas-text-muted">
              You can switch styles anytime — this is just a starting point, not
              a permanent choice.
            </p>
          </section>

          {/* Tweet links paste zone */}
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
              Atlas uses these as individual style signals.
            </p>
          </section>

          <GradientButton fullWidth onClick={() => setStep(2)}>
            Continue
          </GradientButton>
        </div>
      </OnboardingShell>
    );
  }

  // ── Step 2: Voice Dimensions ────────────────────────────────────
  if (step === 2) {
    return (
      <OnboardingShell maxWidth="720px" step={2} totalSteps={totalSteps}>
        <div className="mt-8 space-y-8">
          <section className="text-center space-y-2">
            <h2 className="font-heading font-bold text-xl text-atlas-text">
              Fine-tune your voice dimensions
            </h2>
            <p className="text-sm text-atlas-text-secondary">
              Adjust each slider until it feels right. Starting style:{" "}
              <span className="text-atlas-teal">{selectedStyle}</span>
            </p>
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
              placeholder={
                user?.displayName || user?.handle || "Your display name"
              }
              className="mt-2 w-full rounded-lg border border-glass-border bg-atlas-surface px-4 py-3 text-sm text-atlas-text placeholder-atlas-text-secondary focus:border-atlas-teal focus:outline-none"
            />
            {displayNameError && (
              <p className="mt-1 text-sm text-red-400">{displayNameError}</p>
            )}
          </section>

          <section>
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
              You&apos;ll keep all 12 dimensions editable later in Voice
              Profiles.
            </p>
            {dimensionsError && (
              <p className="mt-1 text-sm text-red-400">{dimensionsError}</p>
            )}
          </section>

          <GradientButton
            fullWidth
            onClick={handleDimensionsContinue}
            disabled={saving}
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Saving your
                voice...
              </span>
            ) : (
              "Continue to reference voices"
            )}
          </GradientButton>
        </div>
      </OnboardingShell>
    );
  }

  // ── Step 3: Reference Voices ────────────────────────────────────
  if (step === 3) {
    return (
      <OnboardingShell maxWidth="720px" step={3} totalSteps={totalSteps}>
        <div className="mt-8">
          <ReferenceVoiceSelector
            accounts={REFERENCE_ACCOUNT_FALLBACK}
            selected={selectedRefIds}
            onSelectionChange={setSelectedRefIds}
            onContinue={handleRefSelectorContinue}
          />
        </div>
      </OnboardingShell>
    );
  }

  // ── Step 4: Blend Ratio ─────────────────────────────────────────
  if (step === 4) {
    return (
      <OnboardingShell maxWidth="480px" step={4} totalSteps={totalSteps}>
        <div className="mt-8 space-y-6">
          <BlendRatioSlider
            selfPercentage={selfPercentage}
            onChange={setSelfPercentage}
            referenceNames={referenceNames}
          />
          <GradientButton
            fullWidth
            onClick={handleBlendContinue}
            disabled={saving}
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Saving blend...
              </span>
            ) : (
              "Continue"
            )}
          </GradientButton>
        </div>
      </OnboardingShell>
    );
  }

  // ── Step 5: Topics ──────────────────────────────────────────────
  if (step === 5) {
    return (
      <OnboardingShell maxWidth="480px" step={5} totalSteps={totalSteps}>
        <div className="mt-8 space-y-6">
          <TopicPicker
            selected={selectedTopics}
            onChange={setSelectedTopics}
          />
          <GradientButton
            fullWidth
            onClick={handleTopicsContinue}
            disabled={saving || selectedTopics.length < 1}
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Saving...
              </span>
            ) : (
              "Continue"
            )}
          </GradientButton>
        </div>
      </OnboardingShell>
    );
  }

  // Fallback — shouldn't reach here
  return null;
}

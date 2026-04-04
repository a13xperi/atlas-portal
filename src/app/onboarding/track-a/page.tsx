"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingShell from "@/components/layout/OnboardingShell";
import GradientButton from "@/components/ui/GradientButton";
import ReferenceVoiceSelector from "@/components/onboarding/ReferenceVoiceSelector";
import BlendRatioSlider from "@/components/onboarding/BlendRatioSlider";
import TopicPicker from "@/components/onboarding/TopicPicker";
import {
  AtSign,
  Link2,
  Loader2,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import {
  applyVoiceDimensionDelta,
  TRACK_A_INITIAL_DIMENSIONS,
  VoiceDimensionField,
  VoiceDimensions,
} from "@/lib/voice-profile-dimensions";
import {
  buildReferenceBlendVoices,
  getReferenceAccountLookup,
  persistReferenceSelections,
  REFERENCE_ACCOUNT_FALLBACK,
} from "@/lib/reference-accounts";

const sampleTweets: Array<{
  text: string;
  dims: Partial<Record<VoiceDimensionField, number>>;
}> = [
  {
    text: "ETH staking yields are compressing fast. The easy alpha is gone — now it's about execution risk and DVT adoption.",
    dims: {
      formality: 10,
      brevity: 10,
      technicalDepth: 20,
      evidenceOrientation: 20,
      solutionOrientation: 10,
    },
  },
  {
    text: "Everyone's talking about L2 fees but nobody's asking why L1 gas is still this high during a bear market.",
    dims: {
      contrarianTone: 20,
      directness: 10,
      confidence: 10,
      evidenceOrientation: 10,
      socialPosture: -10,
    },
  },
  {
    text: "Hot take: most DeFi governance is theater. Token holders vote, whales decide.",
    dims: {
      humor: 20,
      formality: -10,
      brevity: 10,
      warmth: 10,
      selfPromotionalIntensity: 10,
    },
  },
  {
    text: "The merge was 18 months ago and we're still arguing about MEV. Builders are the new miners.",
    dims: {
      contrarianTone: 10,
      directness: 10,
      technicalDepth: 10,
      confidence: 10,
      solutionOrientation: 10,
      socialPosture: 20,
      selfPromotionalIntensity: -10,
    },
  },
];

const analysisSignals = ["Recent tweets", "Reply cadence", "Topic mix"];
const referenceAccountLookup = getReferenceAccountLookup(
  REFERENCE_ACCOUNT_FALLBACK
);

export default function TrackAPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const totalSteps = 5;
  const [dimensions, setDimensions] = useState<VoiceDimensions>(
    TRACK_A_INITIAL_DIMENSIONS
  );
  const [ratings, setRatings] = useState<Record<number, "up" | "down" | null>>(
    {}
  );
  const [saving, setSaving] = useState(false);
  const [tweetLinks, setTweetLinks] = useState("");
  const [xHandle, setXHandle] = useState("");
  const [isHandleConfirmed, setIsHandleConfirmed] = useState(false);
  const [calibrating, setCalibrating] = useState(false);
  const [calibrationResult, setCalibrationResult] = useState<{ analysis: string; tweetsAnalyzed: number } | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [displayNameError, setDisplayNameError] = useState("");
  const [selectedRefIds, setSelectedRefIds] = useState<string[]>([]);
  const [selfPercentage, setSelfPercentage] = useState(50);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  useEffect(() => {
    const fallbackDisplayName = user?.displayName || user?.handle;
    const fallbackHandle = user?.handle?.replace(/^@/, "");

    if (fallbackDisplayName) {
      setDisplayName((current) => current || fallbackDisplayName);
    }

    if (fallbackHandle) {
      setXHandle((current) => current || fallbackHandle);
      setIsHandleConfirmed((current) => current || true);
    }
  }, [user?.displayName, user?.handle]);

  const rateTweet = (index: number, rating: "up" | "down") => {
    const tweet = sampleTweets[index];
    const multiplier = rating === "up" ? 1 : -1;

    setDimensions((current) =>
      applyVoiceDimensionDelta(current, tweet.dims, multiplier)
    );
    setRatings((prev) => ({ ...prev, [index]: rating }));
  };

  const normalizedXHandle = xHandle.trim().replace(/^@/, "");

  const handleConfirm = () => {
    if (!normalizedXHandle) return;

    setXHandle(normalizedXHandle);
    setIsHandleConfirmed(true);
  };

  const handleSaveAndContinue = async () => {
    const trimmedDisplayName = displayName.trim();

    if (trimmedDisplayName.length < 2) {
      setDisplayNameError("Display name must be at least 2 characters.");
      return;
    }

    setDisplayNameError("");
    setSaving(true);
    try {
      await api.users.updateProfile({ displayName: trimmedDisplayName });
      await api.voice.updateProfile(dimensions);

      setStep(2);
    } catch (e) {
      console.error("Failed to save:", e);
    } finally {
      setSaving(false);
    }
  };

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
      setStep(3);
    } catch (error) {
      console.error("Failed to save reference voices:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleBlendContinue = async () => {
    setSaving(true);
    try {
      await api.voice.createBlend(
        "Onboarding blend",
        buildReferenceBlendVoices(selectedRefIds, selfPercentage, REFERENCE_ACCOUNT_FALLBACK)
      );
    } catch {
      // Blend creation is optional during onboarding.
    } finally {
      setSaving(false);
    }
    setStep(4);
  };

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
    router.push(`/onboarding/handoff?step=5&total=5`);
  };

  const referenceNames = selectedRefIds.map((id) => {
    const account = referenceAccountLookup.get(id);
    return account?.displayName || account?.name || id;
  });

  if (step === 2) {
    return (
      <OnboardingShell maxWidth="720px" step={2} totalSteps={totalSteps}>
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

  if (step === 3) {
    return (
      <OnboardingShell maxWidth="480px" step={3} totalSteps={totalSteps}>
        <div className="mt-8 space-y-6">
          <BlendRatioSlider
            selfPercentage={selfPercentage}
            onChange={setSelfPercentage}
            referenceNames={referenceNames}
          />
          <GradientButton fullWidth onClick={handleBlendContinue} disabled={saving}>
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Saving blend...
              </span>
            ) : "Continue"}
          </GradientButton>
        </div>
      </OnboardingShell>
    );
  }

  if (step === 4) {
    return (
      <OnboardingShell maxWidth="480px" step={4} totalSteps={totalSteps}>
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
            ) : "Continue"}
          </GradientButton>
        </div>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell maxWidth="720px" step={1} totalSteps={totalSteps}>
      <div className="mt-8 space-y-8">
        <section className="rounded-3xl border border-glass-border bg-glass p-6 backdrop-blur-xl sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-full border border-atlas-teal/30 bg-atlas-teal/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-atlas-teal">
              Track A · Automated voice scan
            </span>
            <span className="rounded-full border border-glass-border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-atlas-text-secondary">
              Step 1 · Connect X
            </span>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-[1.15fr_0.85fr] sm:items-start">
            <div>
              <h1 className="font-heading font-extrabold tracking-tight text-3xl text-atlas-text">
                Connect Your X Account
              </h1>
              <p className="mt-3 text-sm leading-6 text-atlas-text-secondary">
                Atlas will scan your recent tweets to build your voice profile
                automatically.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {analysisSignals.map((signal) => (
                  <span
                    key={signal}
                    className="rounded-full border border-glass-border bg-atlas-surface/60 px-3 py-1 text-xs text-atlas-text-secondary"
                  >
                    {signal}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-glass-border bg-atlas-surface/60 p-4">
              <div className="flex items-center gap-2 text-sm text-atlas-text">
                <Link2 className="h-4 w-4 text-atlas-teal" />
                <span>
                  {user?.handle
                    ? `Signed in as @${user.handle}`
                    : "Paste the handle Atlas should analyze"}
                </span>
              </div>

              <label
                htmlFor="x-handle"
                className="mt-4 block text-xs text-atlas-text-secondary uppercase tracking-wide"
              >
                X handle
              </label>
              <div className="mt-2 flex gap-2">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-atlas-text-secondary">
                    <AtSign className="h-4 w-4" />
                  </span>
                  <input
                    id="x-handle"
                    type="text"
                    value={xHandle}
                    onChange={(event) => {
                      setXHandle(event.target.value.replace(/^@/, ""));
                      setIsHandleConfirmed(false);
                    }}
                    placeholder={user?.handle || "atlasanalyst"}
                    className="w-full rounded-lg border border-glass-border bg-atlas-surface px-4 py-3 pl-10 text-sm text-atlas-text placeholder-atlas-text-secondary focus:border-atlas-teal focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!normalizedXHandle}
                  className="rounded-lg border border-atlas-teal/30 bg-atlas-teal/10 px-4 py-3 text-sm font-medium text-atlas-teal transition-colors hover:border-atlas-teal hover:bg-atlas-teal/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Analyze
                </button>
              </div>

              {isHandleConfirmed && normalizedXHandle && !calibrationResult && (
                <button
                  type="button"
                  onClick={async () => {
                    setCalibrating(true);
                    try {
                      const { profile, calibration } = await api.voice.calibrate(normalizedXHandle);
                      setDimensions({
                        humor: profile.humor,
                        formality: profile.formality,
                        brevity: profile.brevity,
                        contrarianTone: profile.contrarianTone,
                        directness: profile.directness ?? 5,
                        warmth: profile.warmth ?? 5,
                        technicalDepth: profile.technicalDepth ?? 5,
                        confidence: profile.confidence ?? 5,
                        evidenceOrientation: profile.evidenceOrientation ?? 5,
                        solutionOrientation: profile.solutionOrientation ?? 5,
                        socialPosture: profile.socialPosture ?? 5,
                        selfPromotionalIntensity: profile.selfPromotionalIntensity ?? 5,
                      });
                      setCalibrationResult({ analysis: calibration.analysis, tweetsAnalyzed: calibration.tweetsAnalyzed });
                    } catch (err) {
                      console.error("Calibration failed:", err);
                    } finally {
                      setCalibrating(false);
                    }
                  }}
                  disabled={calibrating}
                  className="mt-3 w-full rounded-lg bg-gradient-to-r from-delphi-teal to-delphi-teal/60 px-4 py-3 text-sm font-medium text-white transition-all hover:scale-[1.01] disabled:opacity-50"
                >
                  {calibrating ? (
                    <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Analyzing tweets...</span>
                  ) : (
                    <span className="flex items-center justify-center gap-2"><Sparkles className="h-4 w-4" /> Analyze @{normalizedXHandle}&apos;s Voice</span>
                  )}
                </button>
              )}

              {calibrationResult && (
                <div className="mt-3 rounded-lg border border-atlas-teal/30 bg-atlas-teal/5 p-3">
                  <p className="text-xs font-medium text-atlas-teal">Voice calibrated from {calibrationResult.tweetsAnalyzed} tweets</p>
                  <p className="mt-1 text-xs text-atlas-text-secondary">{calibrationResult.analysis}</p>
                </div>
              )}

              <p className="mt-3 text-xs leading-5 text-atlas-text-muted">
                {calibrationResult
                  ? "Your voice dimensions have been auto-calibrated. Adjust below if needed."
                  : isHandleConfirmed && normalizedXHandle
                  ? "Click above to analyze tweets and auto-calibrate your voice profile."
                  : "Use your current handle or paste a different one to kick off automated voice analysis."}
              </p>
            </div>
          </div>
        </section>

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

        <section className="rounded-2xl border border-glass-border bg-atlas-surface/40 p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl border border-atlas-teal/20 bg-atlas-teal/10 p-3 text-atlas-teal">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading font-bold tracking-tight text-xl text-atlas-text">
                Guide the first pass
              </h2>
              <p className="mt-2 text-sm leading-6 text-atlas-text-secondary">
                Atlas starts from your tweet history. If you want to steer the
                automatic read, react to a few examples below and add any
                reference accounts you want blended in.
              </p>
            </div>
          </div>
        </section>

        <section>
          <label className="text-xs text-atlas-text-secondary uppercase tracking-wide">
            Quick reactions for the auto-analysis
          </label>
          <p className="mt-2 text-sm text-atlas-text-secondary">
            Thumbs up means more like you. Thumbs down means less like you.
          </p>

          <div className="mt-3 space-y-3">
            {sampleTweets.map((tweet, index) => (
              <div
                key={tweet.text}
                className="flex items-start justify-between gap-4 rounded-2xl bg-atlas-surface p-4"
              >
                <p className="flex-1 text-sm text-atlas-text">{tweet.text}</p>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => rateTweet(index, "up")}
                    className={`transition-colors ${
                      ratings[index] === "up"
                        ? "text-atlas-teal"
                        : "text-atlas-text-secondary hover:text-atlas-teal"
                    }`}
                    title="More like me"
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => rateTweet(index, "down")}
                    className={`transition-colors ${
                      ratings[index] === "down"
                        ? "text-atlas-error"
                        : "text-atlas-text-secondary hover:text-atlas-error"
                    }`}
                    title="Less like me"
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
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
            "Continue to reference voices"
          )}
        </GradientButton>
      </div>
    </OnboardingShell>
  );
}

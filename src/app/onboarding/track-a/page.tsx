"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingShell from "@/components/layout/OnboardingShell";
import VoiceDimensionSections from "@/components/voice-profiles/VoiceDimensionSections";
import ProgressBar from "@/components/ui/ProgressBar";
import GradientButton from "@/components/ui/GradientButton";
import { ThumbsUp, ThumbsDown, Plus, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import {
  applyVoiceDimensionDelta,
  hasAnyVoiceDimension,
  TRACK_A_INITIAL_DIMENSIONS,
  VoiceDimensionField,
  VoiceDimensions,
} from "@/lib/voice-profile-dimensions";

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

const referenceAccounts = ["Cobie", "Hsaka", "Ansem", "Hasu"];

export default function TrackAPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [dimensions, setDimensions] = useState<VoiceDimensions>(
    TRACK_A_INITIAL_DIMENSIONS
  );
  const [blendValues, setBlendValues] = useState([40, 30, 30]);
  const [ratings, setRatings] = useState<Record<number, "up" | "down" | null>>(
    {}
  );
  const [saving, setSaving] = useState(false);
  const [tweetLinks, setTweetLinks] = useState("");
  const [selectedRefs, setSelectedRefs] = useState<Set<string>>(new Set());
  const [addingHandle, setAddingHandle] = useState(false);
  const [newHandle, setNewHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [displayNameError, setDisplayNameError] = useState("");
  const [dimensionsError, setDimensionsError] = useState("");

  useEffect(() => {
    const fallbackDisplayName = user?.displayName || user?.handle;

    if (!fallbackDisplayName) return;

    setDisplayName((current) => current || fallbackDisplayName);
  }, [user?.displayName, user?.handle]);

  const updateBlend = (index: number, value: number) => {
    const newValues = [...blendValues];
    newValues[index] = value;
    setBlendValues(newValues);
  };

  const rateTweet = (index: number, rating: "up" | "down") => {
    const tweet = sampleTweets[index];
    const multiplier = rating === "up" ? 1 : -1;

    setDimensions((current) =>
      applyVoiceDimensionDelta(current, tweet.dims, multiplier)
    );
    setRatings((prev) => ({ ...prev, [index]: rating }));

    if (dimensionsError) {
      setDimensionsError("");
    }
  };

  const toggleRef = (name: string) => {
    setSelectedRefs((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleAddCustomHandle = () => {
    if (!newHandle.trim()) return;

    const clean = newHandle.trim().replace(/^@/, "");
    setSelectedRefs((prev) => new Set(prev).add(clean));
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

      for (const ref of Array.from(selectedRefs)) {
        try {
          await api.voice.addReference(ref, ref);
        } catch {
          // Reference creation is optional during onboarding.
        }
      }

      const refs = Array.from(selectedRefs);
      if (refs.length > 0) {
        try {
          await api.voice.createBlend("Onboarding blend", [
            { label: "My voice", percentage: blendValues[0] },
            ...refs.slice(0, 2).map((ref, index) => ({
              label: ref,
              percentage:
                blendValues[index + 1] || Math.round(60 / refs.length),
            })),
          ]);
        } catch {
          // Blend creation is optional during onboarding.
        }
      }

      router.push("/onboarding/handoff");
    } catch (e) {
      console.error("Failed to save:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingShell maxWidth="720px">
      <ProgressBar currentStep={1} totalSteps={6} />

      <div className="mt-8 space-y-8">
        {user?.handle && (
          <p className="text-atlas-text-secondary text-sm text-center">
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
            className="mt-2 w-full bg-atlas-surface rounded-lg px-4 py-3 text-sm text-atlas-text placeholder-atlas-text-secondary border border-glass-border focus:outline-none focus:border-atlas-teal"
          />
          {displayNameError && (
            <p className="text-red-400 text-sm mt-1">{displayNameError}</p>
          )}
        </section>

        <section>
          <h2 className="font-heading text-xl text-atlas-text mb-4">
            This is what I think your writing voice is.
          </h2>
          <VoiceDimensionSections
            values={dimensions}
            interactive
            onChange={(field, value) =>
              setDimensions((current) => ({
                ...current,
                [field]: value,
              }))
            }
          />
          <p className="text-atlas-text-secondary text-sm italic mt-4">
            Rate the examples below to help me dial it in. Thumbs up = more like
            me, thumbs down = less. Every bar uses the same editable 0-10 scale
            you&apos;ll keep after onboarding.
          </p>
          {dimensionsError && (
            <p className="text-red-400 text-sm mt-1">{dimensionsError}</p>
          )}
        </section>

        <section>
          <label className="text-xs text-atlas-text-secondary uppercase tracking-wide">
            Rate these examples to refine your voice.
          </label>
          <div className="mt-3 space-y-3">
            {sampleTweets.map((tweet, index) => (
              <div
                key={tweet.text}
                className="bg-atlas-surface rounded-2xl p-4 flex items-start justify-between gap-4"
              >
                <p className="text-sm text-atlas-text flex-1">{tweet.text}</p>
                <div className="flex gap-2 shrink-0">
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
                    <ThumbsUp className="w-4 h-4" />
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
                    <ThumbsDown className="w-4 h-4" />
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
            className="mt-2 w-full bg-atlas-surface rounded-2xl px-4 py-3 text-sm text-atlas-text placeholder-atlas-text-secondary border border-dashed border-atlas-text-secondary/30 focus:outline-none focus:border-atlas-teal resize-none"
          />
          <p className="text-atlas-text-muted text-xs mt-1">
            You can also send these via Telegram later.
          </p>
        </section>

        <section>
          <label className="text-xs text-atlas-text-secondary uppercase tracking-wide">
            Add reference accounts for voice blending.
          </label>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {referenceAccounts.map((name) => (
              <div
                key={name}
                onClick={() => toggleRef(name)}
                className="flex flex-col items-center gap-1 cursor-pointer group"
              >
                <div
                  className={`w-12 h-12 rounded-full bg-atlas-surface border flex items-center justify-center text-atlas-text-secondary transition-colors ${
                    selectedRefs.has(name)
                      ? "border-atlas-teal ring-1 ring-atlas-teal"
                      : "border-glass-border group-hover:border-atlas-teal"
                  }`}
                >
                  {name[0]}
                </div>
                <span className="text-xs text-atlas-text-secondary">{name}</span>
              </div>
            ))}

            {addingHandle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newHandle}
                  onChange={(event) => setNewHandle(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleAddCustomHandle();
                  }}
                  placeholder="@handle"
                  autoFocus
                  className="bg-atlas-surface rounded-lg px-3 py-2 text-sm text-atlas-text border border-glass-border focus:outline-none focus:border-atlas-teal w-32"
                />
                <button
                  type="button"
                  onClick={handleAddCustomHandle}
                  className="text-atlas-teal text-xs"
                >
                  Add
                </button>
              </div>
            ) : (
              <div
                onClick={() => setAddingHandle(true)}
                className="flex flex-col items-center gap-1 cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-full bg-atlas-surface border border-dashed border-atlas-text-secondary/30 flex items-center justify-center text-atlas-text-secondary group-hover:border-atlas-teal transition-colors">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-xs text-atlas-text-muted">Add</span>
              </div>
            )}
          </div>
        </section>

        <section>
          <label className="text-xs text-atlas-text-secondary uppercase tracking-wide">
            Adjust your voice blend
          </label>
          <div className="mt-3 space-y-4">
            {[
              "My voice",
              ...(Array.from(selectedRefs).slice(0, 2).length > 0
                ? Array.from(selectedRefs).slice(0, 2)
                : ["Reference A", "Reference B"]),
            ].map((label, index) => (
              <div key={label} className="flex items-center gap-4">
                <span className="text-sm text-atlas-text-secondary w-28 shrink-0">
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
                <span className="text-sm text-atlas-text w-10 text-right">
                  {blendValues[index]}%
                </span>
              </div>
            ))}
          </div>
          <p className="text-atlas-text-muted text-xs mt-2">
            Set your starting blend — you can always change this later.
          </p>
        </section>

        <GradientButton fullWidth onClick={handleSaveAndContinue} disabled={saving}>
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Saving your voice...
            </span>
          ) : (
            "Let's get started"
          )}
        </GradientButton>
      </div>
    </OnboardingShell>
  );
}

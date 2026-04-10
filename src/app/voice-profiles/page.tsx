"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Sparkles } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import TweetTinderSection from "./tweet-tinder-section";
import ReferenceVoicesSection from "@/components/voice-profiles/ReferenceVoicesSection";
import RecipeCard from "@/components/voice-profiles/RecipeCard";
import VoiceCard from "@/components/voice-profiles/VoiceCard";
import VoiceEditorModal from "@/components/voice-profiles/VoiceEditorModal";
import { useAuth } from "@/lib/auth";
import {
  api,
  type BlendVoiceInput,
  type ReferenceAccount,
  type ReferenceVoice,
  type SavedBlend,
  type VoiceProfile,
} from "@/lib/api";
import {
  DEFAULT_VOICE_DIMENSIONS,
  formatVoiceDimensionValue,
  pickVoiceDimensions,
  type VoiceDimensions,
} from "@/lib/voice-profile-dimensions";
import { REFERENCE_ACCOUNT_FALLBACK } from "@/lib/reference-accounts";
import {
  buildBlendFingerprint,
  getNotableVoiceDimensions,
} from "@/lib/voice-recipes";

const PERSONAL_VOICE_ID = "__personal__";
const DEFAULT_SELF_PERCENTAGE = 40;

type EditorMode = "create" | "edit-personal" | "edit-blend" | null;

function formatMaturityLabel(maturity?: VoiceProfile["maturity"]) {
  if (!maturity) {
    return "Beginner";
  }

  return `${maturity.charAt(0)}${maturity.slice(1).toLowerCase()}`;
}

function getActiveRecipeLabel(
  activeVoiceId: string,
  blends: SavedBlend[],
  isPersonalDefault = true
) {
  if (activeVoiceId === PERSONAL_VOICE_ID && isPersonalDefault) {
    return "Personal Voice";
  }

  return blends.find((blend) => blend.id === activeVoiceId)?.name ?? "Personal Voice";
}

const BLEND_PREVIEW_DIMENSIONS: Array<[keyof VoiceDimensions, string]> = [
  ["humor", "Humor"],
  ["formality", "Formality"],
  ["brevity", "Brevity"],
  ["contrarianTone", "Contrarian tone"],
  ["directness", "Directness"],
  ["warmth", "Warmth"],
  ["technicalDepth", "Technical depth"],
  ["confidence", "Confidence"],
  ["evidenceOrientation", "Evidence orientation"],
  ["solutionOrientation", "Solution orientation"],
  ["socialPosture", "Social posture"],
  ["selfPromotionalIntensity", "Self-promotion"],
];

function buildBlendPreviewPrompt(blend: SavedBlend, dimensions: VoiceDimensions) {
  const composition = blend.voices
    .map((voice) => `${voice.percentage}% ${voice.label}`)
    .join(", ");
  const dimensionSummary = BLEND_PREVIEW_DIMENSIONS.map(
    ([field, label]) => `${label}: ${formatVoiceDimensionValue(dimensions[field])}`
  ).join(", ");

  return [
    "Write one original sample tweet for a crypto analyst.",
    `Match this saved Atlas voice recipe: ${blend.name}.`,
    `Blend composition: ${composition}.`,
    `Voice fingerprint: ${dimensionSummary}.`,
    "Keep it under 260 characters.",
    "No hashtags, no thread marker, and no surrounding quotation marks.",
    "Make it feel publishable right now, with a specific point of view.",
  ].join(" ");
}

function sanitizeBlendPreview(text: string) {
  return text.trim().replace(/^"+|"+$/g, "");
}

export default function VoiceProfilesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<VoiceProfile | null>(null);
  const [referenceAccounts, setReferenceAccounts] = useState<ReferenceAccount[]>(
    REFERENCE_ACCOUNT_FALLBACK
  );
  const [references, setReferences] = useState<ReferenceVoice[]>([]);
  const [blends, setBlends] = useState<SavedBlend[]>([]);
  const [activeVoiceId, setActiveVoiceId] = useState<string>(PERSONAL_VOICE_ID);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(PERSONAL_VOICE_ID);
  const [editorMode, setEditorMode] = useState<EditorMode>(null);
  const [editorBlendId, setEditorBlendId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calibrateHandle, setCalibrateHandle] = useState("");
  const [showCalibrationInput, setShowCalibrationInput] = useState(false);
  const [previewingBlendId, setPreviewingBlendId] = useState<string | null>(null);
  const [blendPreviewErrors, setBlendPreviewErrors] = useState<
    Record<string, string>
  >({});
  const [blendPreviews, setBlendPreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    const savedBlendId = window.localStorage.getItem("atlas_active_blend");

    if (savedBlendId) {
      setActiveVoiceId(savedBlendId);
    }
  }, []);

  useEffect(() => {
    if (activeVoiceId === PERSONAL_VOICE_ID) {
      window.localStorage.removeItem("atlas_active_blend");
      return;
    }

    window.localStorage.setItem("atlas_active_blend", activeVoiceId);
  }, [activeVoiceId]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [profileResponse, referencesResponse, blendsResponse, accountsResponse] =
        await Promise.all([
          api.voice.getProfile(),
          api.voice.getReferences(),
          api.voice.getBlends(),
          api.referenceAccounts
            .getAll()
            .catch(() => ({ accounts: REFERENCE_ACCOUNT_FALLBACK })),
        ]);

      setProfile(profileResponse.profile);
      setReferences(referencesResponse.voices);
      setBlends(blendsResponse.blends);
      setReferenceAccounts(
        accountsResponse.accounts.length > 0
          ? accountsResponse.accounts
          : REFERENCE_ACCOUNT_FALLBACK
      );
    } catch (loadError: unknown) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load voice data"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if ((profile?.tweetsAnalyzed ?? 0) === 0) {
      setShowCalibrationInput(true);
    }
  }, [profile?.tweetsAnalyzed]);

  useEffect(() => {
    if (
      activeVoiceId !== PERSONAL_VOICE_ID &&
      !blends.some((blend) => blend.id === activeVoiceId)
    ) {
      setActiveVoiceId(PERSONAL_VOICE_ID);
    }
  }, [activeVoiceId, blends]);

  useEffect(() => {
    if (
      editorBlendId &&
      !blends.some((blend) => blend.id === editorBlendId)
    ) {
      setEditorBlendId(null);
      setEditorMode(null);
    }
  }, [blends, editorBlendId]);

  const personalDimensions = useMemo(
    () => pickVoiceDimensions(profile),
    [profile]
  );

  const recipeCards = useMemo(
    () =>
      blends.map((blend) => {
        const dimensions = buildBlendFingerprint(
          blend,
          personalDimensions,
          referenceAccounts
        );

        return {
          blend,
          dimensions,
          notableDimensions: getNotableVoiceDimensions(dimensions),
        };
      }),
    [blends, personalDimensions, referenceAccounts]
  );

  const personalStandouts = useMemo(
    () => getNotableVoiceDimensions(personalDimensions, 3),
    [personalDimensions]
  );

  const selectedBlend = blends.find((b) => b.id === selectedVoiceId);

  const selectedBlendForEditor = useMemo(
    () =>
      recipeCards.find(({ blend }) => blend.id === editorBlendId) ?? null,
    [editorBlendId, recipeCards]
  );

  const activeRecipeLabel = useMemo(
    () => getActiveRecipeLabel(activeVoiceId, blends),
    [activeVoiceId, blends]
  );

  const handlePreviewBlend = useCallback(
    async (blend: SavedBlend, dimensions: VoiceDimensions) => {
      if (previewingBlendId) {
        return;
      }

      setPreviewingBlendId(blend.id);
      setBlendPreviewErrors((current) => {
        const nextErrors = { ...current };
        delete nextErrors[blend.id];
        return nextErrors;
      });

      try {
        const response = await api.oracle.chat({
          page: "voice-profiles",
          messages: [
            {
              role: "user",
              content: buildBlendPreviewPrompt(blend, dimensions),
            },
          ],
        });
        const previewText = sanitizeBlendPreview(response.text);

        if (!previewText) {
          throw new Error("Atlas returned an empty sample tweet.");
        }

        setBlendPreviews((current) => ({
          ...current,
          [blend.id]: previewText,
        }));
        setBlendPreviewErrors((current) => {
          const nextErrors = { ...current };
          delete nextErrors[blend.id];
          return nextErrors;
        });
      } catch (previewError: unknown) {
        setBlendPreviewErrors((current) => ({
          ...current,
          [blend.id]:
            previewError instanceof Error
              ? previewError.message
              : "Couldn't generate a sample tweet for this voice.",
        }));
      } finally {
        setPreviewingBlendId((current) =>
          current === blend.id ? null : current
        );
      }
    },
    [previewingBlendId]
  );

  const handleUseVoice = (voiceId: string) => {
    setActiveVoiceId(voiceId);
    if (voiceId === PERSONAL_VOICE_ID) {
      window.localStorage.removeItem("atlas_active_blend");
    } else {
      window.localStorage.setItem("atlas_active_blend", voiceId);
    }
    router.push("/crafting");
  };

  const buildBlendVoicesFromReferences = (): BlendVoiceInput[] => {
    // Personal voice always anchors the blend at 50%; remaining 50% is split
    // evenly across the user's saved reference voices. If they have no
    // references yet, the blend is just the personal voice at 100%.
    const refs = references.filter((r) => r.isActive);
    if (refs.length === 0) {
      return [{ label: "My voice", percentage: 100 }];
    }
    const personalShare = 50;
    const remaining = 100 - personalShare;
    const each = Math.floor(remaining / refs.length);
    const leftover = remaining - each * refs.length;
    return [
      { label: "My voice", percentage: personalShare },
      ...refs.map((ref, idx) => ({
        label: ref.name,
        percentage: each + (idx === 0 ? leftover : 0),
        referenceVoiceId: ref.id,
      })),
    ];
  };

  const handleSaveVoice = async (name: string, dimensions: VoiceDimensions) => {
    try {
      if (editorMode === "edit-personal") {
        const response = await api.voice.updateProfile(dimensions);
        setProfile(response.profile);
        return;
      }

      if (editorMode === "edit-blend" && selectedBlend) {
        // Persist any voice-percentage changes via the per-voice PATCH endpoint.
        // Today the editor only exposes voice dimensions (not blend percentages),
        // so this branch is a no-op rename hook until the editor surfaces them.
        // We still re-fetch so the UI reflects the latest server state.
        const response = await api.voice.getBlends();
        setBlends(response.blends);
        return;
      }

      // create mode: build a real blend from saved reference voices and persist.
      const voices = buildBlendVoicesFromReferences();
      await api.voice.createBlend(name, voices);
      const response = await api.voice.getBlends();
      setBlends(response.blends);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save voice";
      setError(message);
      throw e;
    }
  };

  const handleCalibrate = async () => {
    const raw = calibrateHandle.trim();
    // Accept full X/Twitter URLs — extract the handle from the path
    const urlMatch = raw.match(/(?:twitter\.com|x\.com)\/([A-Za-z0-9_]+)/);
    const nextHandle = (urlMatch ? urlMatch[1] : raw).replace("@", "");

    if (!nextHandle) {
      return;
    }

    try {
      const response = await api.voice.calibrate(nextHandle);

      setProfile(response.profile);
      setCalibrateHandle("");
      setShowCalibrationInput(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("429") || msg.toLowerCase().includes("rate limit")) {
        setError("Twitter API rate limit hit — try again in a few minutes.");
      } else if (msg.includes("404") || msg.toLowerCase().includes("not found")) {
        setError(`@${nextHandle} not found. Check the handle and try again.`);
      } else if (msg.includes("403") || msg.toLowerCase().includes("protected")) {
        setError(`@${nextHandle} has a protected account — tweets aren't public.`);
      } else if (msg.toLowerCase().includes("no tweets")) {
        setError(`@${nextHandle} has no public tweets to analyze.`);
      } else {
        setError("Calibration failed. Check the handle and try again.");
      }
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-7xl animate-pulse space-y-6 px-4 py-8 sm:px-6 xl:px-8">
          <div className="h-4 w-28 rounded bg-atlas-surface" />
          <div className="h-10 w-64 rounded bg-atlas-surface" />
          <div className="h-32 rounded-2xl bg-atlas-surface" />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((index) => (
              <div key={index} className="h-96 rounded-2xl bg-atlas-surface" />
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div>
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-atlas-error/30 bg-atlas-error/10 px-4 py-3 text-sm text-atlas-error"
          >
            {error}
            <button
              type="button"
              onClick={() => void loadData()}
              className="ml-2 font-semibold underline hover:text-atlas-text"
            >
              Try again
            </button>
          </div>
        )}

        <p className="text-sm font-medium uppercase tracking-[0.2em] text-atlas-teal">
          Voice Lab
        </p>
        <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-atlas-text sm:text-4xl">
          Your Saved Voices
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-atlas-text-secondary">
          Explore saved voice recipes, compare their fingerprints, and pick the
          blend Atlas should use the next time you craft.
        </p>

        {/* Voice Library Grid */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <VoiceCard
            name="Personal Voice"
            isActive={activeVoiceId === PERSONAL_VOICE_ID}
            isPersonal
            isSelected={selectedVoiceId === PERSONAL_VOICE_ID}
            dimensions={personalDimensions}
            onSelect={() => setSelectedVoiceId(PERSONAL_VOICE_ID)}
            onUse={() => handleUseVoice(PERSONAL_VOICE_ID)}
          />
          {blends.map((blend) => (
            <VoiceCard
              key={blend.id}
              name={blend.name}
              isActive={activeVoiceId === blend.id}
              isPersonal={false}
              isSelected={selectedVoiceId === blend.id}
              dimensions={personalDimensions}
              onSelect={() => setSelectedVoiceId(blend.id)}
              onUse={() => handleUseVoice(blend.id)}
            />
          ))}
          {blends.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-glass-border bg-atlas-surface/40 p-5 text-center">
              <Sparkles className="mx-auto h-5 w-5 text-atlas-teal" aria-hidden="true" />
              <p className="mt-2 text-sm font-semibold text-atlas-text-secondary">No blends yet</p>
              <p className="mt-1 text-[11px] text-atlas-text-muted">Combine reference voices to create your own style</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setEditorMode("create")}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-glass-border p-5 text-atlas-text-muted transition-colors hover:border-atlas-teal/40 hover:text-atlas-teal"
          >
            <Plus className="h-6 w-6" aria-hidden="true" />
            <span className="text-xs font-semibold">New Voice</span>
            {blends.length === 0 && (
              <span className="text-[10px] text-atlas-text-muted">Blend references into custom voices</span>
            )}
          </button>
        </div>

        <section className="mt-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-atlas-teal">
                Your Saved Voices
              </p>
              <h2 className="mt-2 font-heading text-2xl font-semibold text-atlas-text">
                Individual creator voices and custom blends for crafting
              </h2>
            </div>
            <div className="rounded-full border border-glass-border bg-atlas-surface/60 px-4 py-2 text-sm text-atlas-text-secondary">
              Active recipe:{" "}
              <span className="font-semibold text-atlas-text">
                {activeRecipeLabel}
              </span>
            </div>
          </div>

          {recipeCards.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-glass-border bg-atlas-surface/40 px-6 py-12 text-center">
              <Sparkles className="mx-auto h-6 w-6 text-atlas-teal" aria-hidden="true" />
              <h3 className="mt-4 font-heading text-xl font-semibold text-atlas-text">
                No voice recipes yet
              </h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-atlas-text-secondary">
                Save a creator voice or blend to use it in the Crafting Station.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {recipeCards.map(({ blend, dimensions, notableDimensions }) => (
                <RecipeCard
                  key={blend.id}
                  blend={blend}
                  dimensions={dimensions}
                  fingerprintDescription={
                    blend.voices.length === 1
                      ? "Built directly from your personal voice profile."
                      : "Estimated from your personal voice plus matched reference archetypes in the library."
                  }
                  notableDimensions={notableDimensions}
                  isActive={activeVoiceId === blend.id}
                  userHandle={user?.handle}
                  onUse={() => handleUseVoice(blend.id)}
                  onPreviewSample={() =>
                    void handlePreviewBlend(blend, dimensions)
                  }
                  previewError={blendPreviewErrors[blend.id]}
                  previewLoading={previewingBlendId === blend.id}
                  previewText={blendPreviews[blend.id]}
                  onEdit={() => {
                    setEditorBlendId(blend.id);
                    setEditorMode("edit-blend");
                  }}
                />
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setEditorMode("create")}
            className="mt-6 flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-glass-border bg-atlas-surface/30 px-6 py-10 text-center transition-colors hover:border-atlas-teal/40 hover:bg-atlas-surface/50"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-atlas-teal/30 bg-atlas-teal/10 text-atlas-teal">
              <Plus className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-heading text-xl font-semibold text-atlas-text">
                Add a Creator Voice
              </p>
              <p className="mt-1 text-sm text-atlas-text-secondary">
                Pick a creator from your follows and shape their voice style.
              </p>
            </div>
          </button>
        </section>

        <div className="mt-10 pb-24" data-tour="reference-voices">
          <ReferenceVoicesSection
            references={references}
            onReferencesChange={setReferences}
          />
        </div>

        <VoiceEditorModal
          isOpen={editorMode !== null}
          mode={editorMode ?? "create"}
          initialName={selectedBlendForEditor?.blend.name ?? ""}
          initialDimensions={
            editorMode === "edit-personal"
              ? personalDimensions
              : selectedBlendForEditor?.dimensions ?? DEFAULT_VOICE_DIMENSIONS
          }
          saveDisabled={editorMode === "edit-blend"}
          saveNotice={
            editorMode === "edit-blend"
              ? "Saved recipe updates are not yet exposed by the API. This modal shows the current fingerprint while the card redesign ships."
              : undefined
          }
          onSave={handleSaveVoice}
          onClose={() => {
            setEditorMode(null);
            setEditorBlendId(null);
          }}
        />

        {/* Tweet Tinder — voice calibration via liked tweets */}
        <div className="mt-8">
          <TweetTinderSection />
        </div>
      </div>
    </AppShell>
  );
}

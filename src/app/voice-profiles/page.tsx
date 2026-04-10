"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Sparkles, Wand2 } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import ReferenceVoicesSection from "@/components/voice-profiles/ReferenceVoicesSection";
import RecipeCard from "@/components/voice-profiles/RecipeCard";
import VoiceEditorModal from "@/components/voice-profiles/VoiceEditorModal";
import { useAuth } from "@/lib/auth";
import {
  api,
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
import {
  buildReferenceBlendVoices,
  REFERENCE_ACCOUNT_FALLBACK,
} from "@/lib/reference-accounts";
import {
  buildBlendFingerprint,
  getNotableVoiceDimensions,
  normalizeReferenceSelectionKey,
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
  const [editorMode, setEditorMode] = useState<EditorMode>(null);
  const [editorBlendId, setEditorBlendId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calibrateHandle, setCalibrateHandle] = useState("");
  const [showCalibrationInput, setShowCalibrationInput] = useState(false);

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

  const selectedBlendForEditor = useMemo(
    () =>
      recipeCards.find(({ blend }) => blend.id === editorBlendId) ?? null,
    [editorBlendId, recipeCards]
  );

  const activeRecipeLabel = useMemo(
    () => getActiveRecipeLabel(activeVoiceId, blends),
    [activeVoiceId, blends]
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

  const handleSaveVoice = async (name: string, dimensions: VoiceDimensions) => {
    if (editorMode === "edit-personal") {
      const response = await api.voice.updateProfile(dimensions);
      setProfile(response.profile);
      return;
    }

    if (editorMode === "edit-blend") {
      setError(
        "Recipe editing will unlock once saved blend updates are supported by the API."
      );
      return;
    }

    const selectedReferenceIds = references
      .map((reference) =>
        normalizeReferenceSelectionKey(reference.handle ?? reference.name ?? reference.id)
      )
      .filter(Boolean);

    const nextBlendVoices =
      selectedReferenceIds.length > 0
        ? buildReferenceBlendVoices(
            selectedReferenceIds,
            DEFAULT_SELF_PERCENTAGE,
            referenceAccounts
          )
        : [{ label: "Personal Voice", percentage: 100 }];

    const response = await api.voice.createBlend(name, nextBlendVoices);
    const blendsResponse = await api.voice.getBlends();

    setBlends(blendsResponse.blends);
    setEditorBlendId(response.blend.id);
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
    } catch {
      setError("Calibration failed. Check the handle and try again.");
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
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 xl:px-8">
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
          Your Voice Recipes
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-atlas-text-secondary">
          Explore saved voice recipes, compare their fingerprints, and pick the
          blend Atlas should use the next time you craft.
        </p>

        <section className="mt-8 rounded-2xl border border-glass-border bg-glass p-6 backdrop-blur-xl">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-atlas-teal/30 bg-atlas-teal/10 px-3 py-1 text-xs font-semibold text-atlas-teal">
                  Personal Voice
                </span>
                <span className="rounded-full border border-glass-border bg-atlas-surface/60 px-3 py-1 text-xs text-atlas-text-secondary">
                  {formatMaturityLabel(profile?.maturity)}
                </span>
                <span className="rounded-full border border-glass-border bg-atlas-surface/60 px-3 py-1 text-xs text-atlas-text-secondary">
                  {profile?.tweetsAnalyzed ?? 0} tweets analyzed
                </span>
                {activeVoiceId === PERSONAL_VOICE_ID && (
                  <span className="rounded-full border border-atlas-teal/30 bg-atlas-teal/10 px-3 py-1 text-xs font-semibold text-atlas-teal">
                    Active in crafting
                  </span>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {personalStandouts.map((dimension) => (
                  <span
                    key={dimension.field}
                    className="rounded-full border border-glass-border bg-atlas-surface/60 px-3 py-2 text-xs text-atlas-text-secondary"
                  >
                    {dimension.label}
                    <span className="ml-2 font-semibold text-atlas-text">
                      {formatVoiceDimensionValue(dimension.value)}
                    </span>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 xl:min-w-[320px]">
              {showCalibrationInput ? (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    placeholder="@handle"
                    value={calibrateHandle}
                    onChange={(event) => setCalibrateHandle(event.target.value)}
                    className="w-full rounded-lg border border-glass-border bg-atlas-bg/70 px-3 py-2 text-sm text-atlas-text placeholder:text-atlas-text-muted focus:border-atlas-teal focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => void handleCalibrate()}
                    disabled={!calibrateHandle.trim()}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-delphi-teal to-delphi-teal/60 px-4 py-2 text-sm font-semibold text-atlas-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Wand2 className="h-4 w-4" />
                    Calibrate
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCalibrationInput(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-delphi-teal to-delphi-teal/60 px-4 py-2 text-sm font-semibold text-atlas-bg transition-opacity hover:opacity-90"
                >
                  <Wand2 className="h-4 w-4" />
                  Recalibrate
                </button>
              )}

              <button
                type="button"
                onClick={() => handleUseVoice(PERSONAL_VOICE_ID)}
                disabled={activeVoiceId === PERSONAL_VOICE_ID}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  activeVoiceId === PERSONAL_VOICE_ID
                    ? "cursor-default border border-atlas-teal/30 bg-atlas-teal/10 text-atlas-teal"
                    : "border border-glass-border text-atlas-text-secondary hover:border-atlas-teal/40 hover:text-atlas-text"
                }`}
              >
                {activeVoiceId === PERSONAL_VOICE_ID
                  ? "Active in Crafting"
                  : "Use Personal Voice"}
              </button>

              <button
                type="button"
                onClick={() => setEditorMode("edit-personal")}
                className="rounded-lg border border-glass-border px-4 py-2 text-sm font-semibold text-atlas-text-secondary transition-colors hover:border-atlas-teal/40 hover:text-atlas-text"
              >
                Tune Profile
              </button>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-atlas-teal">
                Your Voice Recipes
              </p>
              <h2 className="mt-2 font-heading text-2xl font-semibold text-atlas-text">
                Recipe cards for every saved blend
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
              <Sparkles className="mx-auto h-6 w-6 text-atlas-teal" />
              <h3 className="mt-4 font-heading text-xl font-semibold text-atlas-text">
                No voice recipes yet
              </h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-atlas-text-secondary">
                Save a blend to turn your references into reusable recipes with
                a clear composition and dimension fingerprint.
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
              <Plus className="h-5 w-5" />
            </span>
            <div>
              <p className="font-heading text-xl font-semibold text-atlas-text">
                Create New Recipe
              </p>
              <p className="mt-1 text-sm text-atlas-text-secondary">
                Start a new saved blend from your current voice plus selected
                references.
              </p>
            </div>
          </button>
        </section>

        <div className="mt-10" data-tour="reference-voices">
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
      </div>
    </AppShell>
  );
}

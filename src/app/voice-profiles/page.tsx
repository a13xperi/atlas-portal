"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Loader2, Plus, Sparkles, Wand2, X } from "lucide-react";
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
  type TwitterFollow,
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
  const searchParams = useSearchParams();
  const { user } = useAuth();
  // Role gate: blend create/edit controls are only available to MANAGER/ADMIN.
  // ANALYST users can still view recipe cards, preview, and apply blends —
  // they just can't mutate them.
  const canManageBlends = user?.role === "MANAGER" || user?.role === "ADMIN";
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
  const [dismissedSetupPrompt, setDismissedSetupPrompt] = useState(false);
  const [dismissedRecalibrateNudge, setDismissedRecalibrateNudge] = useState(false);
  const [showCalibrationInput, setShowCalibrationInput] = useState(false);
  const [previewingBlendId, setPreviewingBlendId] = useState<string | null>(null);
  const [blendPreviewErrors, setBlendPreviewErrors] = useState<
    Record<string, string>
  >({});
  const [blendPreviews, setBlendPreviews] = useState<Record<string, string>>({});
  const [compareAllTopic, setCompareAllTopic] = useState(
    "Bitcoin just reclaimed $100k after a brutal 3-week drawdown. Open interest is climbing again, funding is neutral, and ETF flows flipped positive yesterday."
  );
  const [compareAllResults, setCompareAllResults] = useState<
    Array<{ id: string; label: string; text: string | null; error: string | null }>
  >([]);
  const [compareAllLoading, setCompareAllLoading] = useState(false);
  const [compareVsMineBlendId, setCompareVsMineBlendId] = useState<string | null>(null);
  const [compareVsMineResults, setCompareVsMineResults] = useState<{
    personal: { text: string | null; error: string | null };
    blend: { text: string | null; error: string | null; label: string };
  } | null>(null);
  const [compareVsMineLoading, setCompareVsMineLoading] = useState(false);
  const comparisonSectionRef = useRef<HTMLDivElement>(null);
  const [calibrateHandle, setCalibrateHandle] = useState("");
  const [blendSelectMode, setBlendSelectMode] = useState(false);
  const [blendSourceId, setBlendSourceId] = useState<string | null>(null);
  const setupPrompt = searchParams.get("prompt");
  const showSetupPrompt =
    setupPrompt === "complete-voice-setup" && !dismissedSetupPrompt;

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

  useEffect(() => {
    setDismissedSetupPrompt(false);
  }, [setupPrompt]);

  const selectedIsPersonal = selectedVoiceId === PERSONAL_VOICE_ID;
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

  const handleCompareAll = useCallback(async () => {
    if (compareAllLoading || !compareAllTopic.trim()) return;
    const topic = compareAllTopic.trim();
    const voiceTargets = [
      { id: PERSONAL_VOICE_ID, label: "Personal Voice", blendId: undefined as string | undefined },
      ...blends.map((b) => ({ id: b.id, label: b.name, blendId: b.id })),
    ];
    setCompareAllLoading(true);
    setCompareAllResults(voiceTargets.map((v) => ({ id: v.id, label: v.label, text: null, error: null })));
    const settled = await Promise.allSettled(
      voiceTargets.map((v) =>
        api.drafts.generate({ sourceContent: topic, sourceType: "MANUAL", blendId: v.blendId })
      )
    );
    setCompareAllResults(
      voiceTargets.map((v, i) => {
        const r = settled[i];
        return {
          id: v.id,
          label: v.label,
          text: r.status === "fulfilled" ? r.value.draft.content : null,
          error:
            r.status === "rejected"
              ? r.reason instanceof Error
                ? r.reason.message
                : "Generation failed"
              : null,
        };
      })
    );
    setCompareAllLoading(false);
  }, [blends, compareAllLoading, compareAllTopic]);

  const handleCompareVsMine = useCallback(
    async (blendId: string) => {
      if (compareVsMineLoading) return;
      const blend = blends.find((b) => b.id === blendId);
      if (!blend) return;

      setCompareVsMineBlendId(blendId);
      setCompareVsMineLoading(true);
      setCompareVsMineResults(null);

      const topic =
        compareAllTopic.trim() ||
        "Bitcoin just reclaimed $100k after a brutal 3-week drawdown.";

      const [personalResult, blendResult] = await Promise.allSettled([
        api.drafts.generate({
          sourceContent: topic,
          sourceType: "MANUAL",
        }),
        api.drafts.generate({
          sourceContent: topic,
          sourceType: "MANUAL",
          blendId,
        }),
      ]);

      setCompareVsMineResults({
        personal: {
          text:
            personalResult.status === "fulfilled"
              ? personalResult.value.draft.content
              : null,
          error:
            personalResult.status === "rejected"
              ? personalResult.reason instanceof Error
                ? personalResult.reason.message
                : "Generation failed"
              : null,
        },
        blend: {
          text:
            blendResult.status === "fulfilled"
              ? blendResult.value.draft.content
              : null,
          error:
            blendResult.status === "rejected"
              ? blendResult.reason instanceof Error
                ? blendResult.reason.message
                : "Generation failed"
              : null,
          label: blend.name,
        },
      });

      setCompareVsMineLoading(false);

      // Scroll the comparison section into view after results render
      setTimeout(() => {
        comparisonSectionRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    },
    [blends, compareAllTopic, compareVsMineLoading]
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

  const handleCreatePairedBlend = async (targetId: string) => {
    const sourceName =
      blendSourceId === PERSONAL_VOICE_ID
        ? "Personal"
        : blends.find((b) => b.id === blendSourceId)?.name ?? "Voice A";
    const targetName =
      targetId === PERSONAL_VOICE_ID
        ? "Personal"
        : blends.find((b) => b.id === targetId)?.name ?? "Voice B";
    const blendName = `${sourceName} × ${targetName}`;

    const sourceVoice: BlendVoiceInput =
      blendSourceId === PERSONAL_VOICE_ID
        ? { label: "My voice", percentage: 50 }
        : { label: sourceName, percentage: 50, referenceVoiceId: blendSourceId ?? undefined };
    const targetVoice: BlendVoiceInput =
      targetId === PERSONAL_VOICE_ID
        ? { label: "My voice", percentage: 50 }
        : { label: targetName, percentage: 50, referenceVoiceId: targetId };

    try {
      await api.voice.createBlend(blendName, [sourceVoice, targetVoice]);
      const response = await api.voice.getBlends();
      setBlends(response.blends);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create blend");
    } finally {
      setBlendSelectMode(false);
      setBlendSourceId(null);
    }
  };

  const handleBlendSelect = (voiceId: string) => {
    if (!blendSelectMode) {
      setBlendSelectMode(true);
      setBlendSourceId(voiceId);
    } else if (voiceId === blendSourceId) {
      setBlendSelectMode(false);
      setBlendSourceId(null);
    } else {
      void handleCreatePairedBlend(voiceId);
    }
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

  const handleSaveVoice = async (name: string, dimensions: VoiceDimensions, selectedFollow: TwitterFollow | null) => {
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

      // create mode: if a single creator was picked, build a 50/50 blend of
      // the user's personal voice + that one creator. Otherwise fall back to
      // distributing across all saved reference voices.
      let voices: BlendVoiceInput[];
      if (selectedFollow) {
        // Ensure the creator exists as a reference voice, then use its ID.
        const existingRef = references.find(
          (ref) => ref.handle?.replace(/^@/, "").toLowerCase() === selectedFollow.handle.toLowerCase()
        );
        let refId: string;
        if (existingRef) {
          refId = existingRef.id;
        } else {
          const { voice: newRef } = await api.voice.addReference(
            selectedFollow.displayName || selectedFollow.handle,
            selectedFollow.handle
          );
          refId = newRef.id;
        }
        voices = [
          { label: "My voice", percentage: 50 },
          { label: selectedFollow.displayName || selectedFollow.handle, percentage: 50, referenceVoiceId: refId },
        ];
      } else {
        voices = buildBlendVoicesFromReferences();
      }

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

        {showSetupPrompt && (
          <div
            role="status"
            aria-live="polite"
            className="mb-6 flex items-start justify-between rounded-xl border border-atlas-teal/20 bg-atlas-teal/10 px-4 py-3 text-sm"
          >
            <div>
              <p className="font-semibold text-atlas-teal">
                Complete your voice setup
              </p>
              <p className="mt-1 text-atlas-text-secondary">
                Review your voice, add references, and save a blend before you
                start drafting.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDismissedSetupPrompt(true)}
              aria-label="Dismiss voice setup prompt"
              className="ml-3 text-atlas-text-secondary hover:text-atlas-text"
            >
              ✕
            </button>
          </div>
        )}

        {profile && !profile.analysis && !dismissedRecalibrateNudge && (
          <div
            role="status"
            aria-live="polite"
            className="mb-6 flex items-start justify-between rounded-xl border border-atlas-teal/20 bg-atlas-teal/10 px-4 py-3 text-sm"
          >
            <div>
              <p className="font-semibold text-atlas-teal">Improve your voice quality</p>
              <p className="mt-1 text-atlas-text-secondary">
                Re-calibrate your voice to unlock better draft quality — takes about 30 seconds.
              </p>
            </div>
            <div className="ml-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowCalibrationInput(true)}
                className="rounded-lg border border-atlas-teal/30 bg-atlas-teal/15 px-3 py-1.5 text-xs font-semibold text-atlas-teal transition-colors hover:bg-atlas-teal/25"
              >
                Re-calibrate
              </button>
              <button
                type="button"
                onClick={() => setDismissedRecalibrateNudge(true)}
                aria-label="Dismiss calibration nudge"
                className="text-atlas-text-secondary hover:text-atlas-text"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <p className="text-sm font-medium uppercase tracking-[0.2em] text-atlas-teal">Voice Studio</p>
        <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-atlas-text">Your Voices</h1>
        <p className="mt-1 text-sm text-atlas-text-secondary">
          Add inspirations, then blend them into voices you can craft with.
        </p>

        {/* Inspirations — seed your voice before seeing blends */}
        <div className="mt-8 scroll-mt-20" data-tour="reference-voices">
          <ReferenceVoicesSection
            references={references}
            onReferencesChange={setReferences}
          />
        </div>

        {/* Blends — only shown after user has added at least one inspiration */}
        <div className="mt-10 scroll-mt-20 border-t border-glass-border pt-10">

        {blendSelectMode && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-atlas-teal/20 bg-atlas-teal/10 px-4 py-3 text-sm">
            <span className="font-semibold text-atlas-teal">
              Select a second voice to blend with{" "}
              <span className="text-atlas-text">
                {blendSourceId === PERSONAL_VOICE_ID
                  ? "Personal Voice"
                  : blends.find((b) => b.id === blendSourceId)?.name}
              </span>
            </span>
            <button
              type="button"
              onClick={() => {
                setBlendSelectMode(false);
                setBlendSourceId(null);
              }}
              aria-label="Cancel blend selection"
              className="text-atlas-text-muted hover:text-atlas-text"
            >
              ✕
            </button>
          </div>
        )}

        {/* Voice Library Grid */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <VoiceCard
            name="Personal Voice"
            isActive={activeVoiceId === PERSONAL_VOICE_ID}
            isPersonal
            isSelected={selectedVoiceId === PERSONAL_VOICE_ID}
            notableDimensions={personalStandouts}
            userHandle={user?.handle}
            onSelect={() => setSelectedVoiceId(PERSONAL_VOICE_ID)}
            onUse={() => handleUseVoice(PERSONAL_VOICE_ID)}
            onBlend={
              canManageBlends
                ? () => handleBlendSelect(PERSONAL_VOICE_ID)
                : undefined
            }
            blendTargetMode={
              canManageBlends &&
              blendSelectMode &&
              blendSourceId !== PERSONAL_VOICE_ID
            }
          />
          {recipeCards.map(({ blend, notableDimensions }) => (
            <VoiceCard
              key={blend.id}
              name={blend.name}
              isActive={activeVoiceId === blend.id}
              isPersonal={false}
              isSelected={selectedVoiceId === blend.id}
              notableDimensions={notableDimensions}
              userHandle={user?.handle}
              onSelect={() => setSelectedVoiceId(blend.id)}
              onUse={() => handleUseVoice(blend.id)}
              onBlend={
                canManageBlends ? () => handleBlendSelect(blend.id) : undefined
              }
              blendTargetMode={
                canManageBlends && blendSelectMode && blendSourceId !== blend.id
              }
            />
          ))}
          {blends.length === 0 && references.length > 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-glass-border bg-atlas-surface/40 p-5 text-center">
              <Sparkles className="mx-auto h-5 w-5 text-atlas-teal" aria-hidden="true" />
              <p className="mt-2 text-sm font-semibold text-atlas-text-secondary">No blends yet</p>
              <p className="mt-1 text-[11px] text-atlas-text-muted">Combine inspirations to create your own style</p>
            </div>
          )}
          {references.length > 0 && canManageBlends && (
            <button
              type="button"
              onClick={() => setEditorMode("create")}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-glass-border p-5 text-atlas-text-muted transition-colors hover:border-atlas-teal/40 hover:text-atlas-teal"
            >
              <Plus className="h-6 w-6" aria-hidden="true" />
              <span className="text-xs font-semibold">New Creator Voice</span>
              {blends.length === 0 && (
                <span className="text-[10px] text-atlas-text-muted">Start from a single creator you follow</span>
              )}
            </button>
          )}
        </div>

        <section className="mt-10 scroll-mt-20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-atlas-teal">
                Your Blends
              </p>
              <h2 className="mt-2 font-heading text-2xl font-semibold text-atlas-text">
                Mix your inspirations into custom voices for crafting
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
                  fingerprintDescription={(() => {
                    if (blend.voices.length === 1) return "Derived directly from your personal voice profile.";
                    const creatorVoice = blend.voices.find(v => v.referenceVoiceId);
                    if (blend.voices.length === 2 && creatorVoice) {
                      return `Modeled after ${creatorVoice.label}.`;
                    }
                    return `A blend of your personal voice and ${blend.voices.length - 1} inspiration${blend.voices.length - 1 === 1 ? "" : "s"}.`;
                  })()}
                  notableDimensions={notableDimensions}
                  isActive={activeVoiceId === blend.id}
                  userHandle={user?.handle}
                  onCompareVsMine={() =>
                    void handleCompareVsMine(blend.id)
                  }
                  onUse={() => handleUseVoice(blend.id)}
                  onPreviewSample={() =>
                    void handlePreviewBlend(blend, dimensions)
                  }
                  previewError={blendPreviewErrors[blend.id]}
                  previewLoading={previewingBlendId === blend.id}
                  previewText={blendPreviews[blend.id]}
                  onEdit={
                    canManageBlends
                      ? () => {
                          setEditorBlendId(blend.id);
                          setEditorMode("edit-blend");
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          )}

          {references.length > 0 && canManageBlends && (
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
                  Create New Voice
                </p>
                <p className="mt-1 text-sm text-atlas-text-secondary">
                  Start from a creator you follow. Mix with others as an optional step.
                </p>
              </div>
            </button>
          )}
        </section>
        </div>{/* end blends wrapper */}

        <section ref={comparisonSectionRef} className="mt-10 scroll-mt-20 rounded-2xl border border-glass-border bg-atlas-surface/40 p-6">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-atlas-teal">
              Voice Comparison
            </p>
            <h2 className="mt-2 font-heading text-xl font-semibold text-atlas-text">
              See your topic in every voice
            </h2>
            <p className="mt-1 max-w-xl text-sm text-atlas-text-secondary">
              Enter a topic or market take below. Atlas generates one tweet per
              saved voice simultaneously so you can pick the version that lands
              best.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            <textarea
              value={compareAllTopic}
              onChange={(e) => setCompareAllTopic(e.target.value)}
              placeholder="Type a topic, market take, or paste raw content…"
              rows={3}
              maxLength={1000}
              className="w-full resize-none rounded-xl border border-glass-border bg-atlas-surface px-4 py-3 text-sm text-atlas-text placeholder-atlas-text-muted focus:border-atlas-teal/50 focus:outline-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-atlas-text-muted">
                {compareAllTopic.length}/1000
              </span>
              <button
                type="button"
                onClick={() => void handleCompareAll()}
                disabled={compareAllLoading || !compareAllTopic.trim()}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-atlas-teal to-atlas-teal/60 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {compareAllLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Wand2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Generate in all voices
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Compare vs Mine — focused 2-column comparison */}
          {(compareVsMineLoading || compareVsMineResults) && (
            <div className="mt-6 rounded-2xl border border-atlas-teal/20 bg-atlas-teal/5 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-atlas-text">
                  Comparing:{" "}
                  <span className="text-atlas-text-secondary">
                    Personal Voice vs.{" "}
                    {compareVsMineResults?.blend.label ??
                      blends.find((b) => b.id === compareVsMineBlendId)?.name ??
                      "Blend"}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCompareVsMineResults(null);
                    setCompareVsMineBlendId(null);
                    setCompareVsMineLoading(false);
                  }}
                  aria-label="Dismiss comparison"
                  className="rounded-lg p-1 text-atlas-text-muted transition-colors hover:bg-atlas-surface/60 hover:text-atlas-text"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {compareVsMineLoading ? (
                <div className="mt-4 flex items-center justify-center gap-2 py-8 text-sm text-atlas-text-muted">
                  <Loader2 className="h-4 w-4 animate-spin text-atlas-teal" />
                  Generating comparison...
                </div>
              ) : compareVsMineResults ? (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Personal Voice column */}
                  <div
                    className="rounded-2xl border border-glass-border bg-atlas-surface/60 p-4"
                    aria-label="Personal voice result"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-atlas-text-muted">
                      Personal Voice
                    </p>
                    {compareVsMineResults.personal.error ? (
                      <p className="mt-3 text-xs text-atlas-error">
                        {compareVsMineResults.personal.error}
                      </p>
                    ) : compareVsMineResults.personal.text ? (
                      <p className="mt-3 text-sm leading-6 text-atlas-text">
                        {compareVsMineResults.personal.text}
                      </p>
                    ) : null}
                  </div>

                  {/* Blend column */}
                  <div
                    className="rounded-2xl border border-atlas-teal/30 bg-atlas-surface/60 p-4"
                    aria-label={`${compareVsMineResults.blend.label} result`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-atlas-teal">
                      {compareVsMineResults.blend.label}
                    </p>
                    {compareVsMineResults.blend.error ? (
                      <p className="mt-3 text-xs text-atlas-error">
                        {compareVsMineResults.blend.error}
                      </p>
                    ) : compareVsMineResults.blend.text ? (
                      <>
                        <p className="mt-3 text-sm leading-6 text-atlas-text">
                          {compareVsMineResults.blend.text}
                        </p>
                        {compareVsMineBlendId && (
                          <button
                            type="button"
                            onClick={() =>
                              handleUseVoice(compareVsMineBlendId)
                            }
                            className="mt-3 text-xs font-medium text-atlas-teal hover:underline"
                          >
                            Use this voice →
                          </button>
                        )}
                      </>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {compareAllResults.length > 0 && (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {compareAllResults.map((result) => {
                const isPersonal = result.id === PERSONAL_VOICE_ID;
                const isActive = activeVoiceId === result.id;
                return (
                  <div
                    key={result.id}
                    className={`rounded-2xl border p-4 transition-colors ${
                      isPersonal
                        ? "border-glass-border bg-atlas-surface/70"
                        : isActive
                        ? "border-atlas-teal/40 bg-atlas-teal/5"
                        : "border-glass-border bg-atlas-surface/50"
                    }`}
                    aria-label={`${result.label} comparison result`}
                  >
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-xs font-semibold uppercase tracking-wider ${
                          isPersonal
                            ? "text-atlas-text-muted"
                            : isActive
                            ? "text-atlas-teal"
                            : "text-atlas-text-secondary"
                        }`}
                      >
                        {result.label}
                      </p>
                      {isActive && (
                        <span className="rounded-full bg-atlas-teal/15 px-2 py-0.5 text-[10px] font-semibold text-atlas-teal">
                          Active
                        </span>
                      )}
                    </div>
                    {result.text === null && result.error === null ? (
                      <div className="mt-3 flex items-center justify-center py-4" aria-busy="true" aria-label="Generating tweet">
                        <Loader2 className="h-4 w-4 animate-spin text-atlas-teal" />
                      </div>
                    ) : result.error ? (
                      <p className="mt-3 text-xs text-atlas-error">{result.error}</p>
                    ) : (
                      <p className="mt-3 text-sm leading-6 text-atlas-text">
                        {result.text}
                      </p>
                    )}
                    {result.text && isPersonal && activeVoiceId === PERSONAL_VOICE_ID && (
                      <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-atlas-teal">
                        <Check className="h-3 w-3" />
                        Active
                      </span>
                    )}
                    {result.text && !isPersonal && (
                      <button
                        type="button"
                        onClick={() => handleUseVoice(result.id)}
                        className="mt-3 text-xs font-medium text-atlas-teal hover:underline"
                      >
                        Use this voice →
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

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
        <div className="mt-8 scroll-mt-20">
          <TweetTinderSection />
        </div>
      </div>
    </AppShell>
  );
}

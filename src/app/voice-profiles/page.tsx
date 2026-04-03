"use client";

import { useEffect, useState } from "react";
import { Check, Wand2 } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import VoiceDimensionSections from "@/components/voice-profiles/VoiceDimensionSections";
import GradientButton from "@/components/ui/GradientButton";
import {
  api,
  ReferenceVoice,
  SavedBlend,
  VoiceProfile,
} from "@/lib/api";
import {
  DEFAULT_VOICE_DIMENSIONS,
  pickVoiceDimensions,
  VoiceDimensionField,
  VoiceDimensions,
  VOICE_DIMENSION_FIELDS,
} from "@/lib/voice-profile-dimensions";

const VOICE_PRESETS: Array<{
  label: string;
  values: VoiceDimensions;
}> = [
  {
    label: "CT Degen",
    values: {
      ...DEFAULT_VOICE_DIMENSIONS,
      humor: 80,
      formality: 20,
      brevity: 90,
      contrarianTone: 70,
    },
  },
  {
    label: "Research Analyst",
    values: {
      ...DEFAULT_VOICE_DIMENSIONS,
      humor: 20,
      formality: 80,
      brevity: 30,
      contrarianTone: 30,
    },
  },
  {
    label: "Balanced",
    values: {
      ...DEFAULT_VOICE_DIMENSIONS,
    },
  },
];

function formatMaturityLabel(maturity?: VoiceProfile["maturity"]) {
  if (!maturity) {
    return "Beginner";
  }

  return `${maturity.charAt(0)}${maturity.slice(1).toLowerCase()}`;
}

export default function VoiceProfilesPage() {
  const [profile, setProfile] = useState<VoiceProfile | null>(null);
  const [draftDimensions, setDraftDimensions] = useState<VoiceDimensions>(
    DEFAULT_VOICE_DIMENSIONS
  );
  const [references, setReferences] = useState<ReferenceVoice[]>([]);
  const [blends, setBlends] = useState<SavedBlend[]>([]);
  const [activeBlendId, setActiveBlendId] = useState<string | null>(null);
  const [selectedVoices, setSelectedVoices] = useState<Set<string>>(new Set());
  const [blendValues, setBlendValues] = useState([40, 30, 20, 10]);
  const [showAddVoice, setShowAddVoice] = useState(false);
  const [showNewBlend, setShowNewBlend] = useState(false);
  const [blendName, setBlendName] = useState("");
  const [blendVoices, setBlendVoices] = useState<
    { label: string; percentage: number; referenceVoiceId?: string }[]
  >([{ label: "Personal", percentage: 50 }]);
  const [savingBlend, setSavingBlend] = useState(false);
  const [newVoiceName, setNewVoiceName] = useState("");
  const [newVoiceHandle, setNewVoiceHandle] = useState("");
  const [addingVoice, setAddingVoice] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingDimensions, setSavingDimensions] = useState(false);
  const [calibrateHandle, setCalibrateHandle] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("atlas_active_blend");
    if (saved) {
      setActiveBlendId(saved);
    }
  }, []);

  useEffect(() => {
    if (activeBlendId) {
      localStorage.setItem("atlas_active_blend", activeBlendId);
    } else {
      localStorage.removeItem("atlas_active_blend");
    }
  }, [activeBlendId]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      api.voice.getProfile().then((response) => {
        setProfile(response.profile);
        setDraftDimensions(pickVoiceDimensions(response.profile));
      }),
      api.voice.getReferences().then((response) => setReferences(response.voices)),
      api.voice.getBlends().then((response) => setBlends(response.blends)),
    ])
      .catch((loadError: Error) => {
        setError(loadError.message || "Failed to load voice profiles");
      })
      .finally(() => setLoading(false));
  }, []);

  const persistedDimensions = pickVoiceDimensions(profile);
  const hasUnsavedChanges = VOICE_DIMENSION_FIELDS.some(
    (field) => draftDimensions[field] !== persistedDimensions[field]
  );

  if (loading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-4xl animate-pulse space-y-8 px-4 py-8">
          <div className="space-y-2">
            <div className="h-4 w-24 rounded bg-atlas-surface" />
            <div className="h-8 w-72 rounded bg-atlas-surface" />
          </div>

          <div className="space-y-4 rounded-2xl border border-glass-border bg-atlas-surface p-6">
            <div className="h-5 w-32 rounded bg-atlas-bg" />
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-3 w-24 rounded bg-atlas-bg" />
                  <div className="h-3 w-8 rounded bg-atlas-bg" />
                </div>
                <div className="h-2 w-full rounded-full bg-atlas-bg" />
              </div>
            ))}
          </div>

          <div className="space-y-3 rounded-2xl border border-glass-border bg-atlas-surface p-6">
            <div className="h-5 w-40 rounded bg-atlas-bg" />
            <div className="flex gap-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-10 w-28 rounded-lg bg-atlas-bg" />
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-glass-border bg-atlas-surface p-6">
            <div className="h-5 w-32 rounded bg-atlas-bg" />
            <div className="grid grid-cols-2 gap-3">
              {[1, 2].map((item) => (
                <div key={item} className="h-24 rounded-xl bg-atlas-bg" />
              ))}
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  const updateDimension = (field: VoiceDimensionField, value: number) => {
    setDraftDimensions((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const persistDimensions = async (
    dimensions: VoiceDimensions,
    fallbackMessage: string
  ) => {
    setSavingDimensions(true);
    setError(null);

    try {
      const response = await api.voice.updateProfile(dimensions);
      setProfile(response.profile);
      setDraftDimensions(pickVoiceDimensions(response.profile));
      return response.profile;
    } catch (saveError: unknown) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : fallbackMessage
      );
      return null;
    } finally {
      setSavingDimensions(false);
    }
  };

  const saveDimensions = async () => {
    if (!hasUnsavedChanges) {
      return;
    }

    await persistDimensions(draftDimensions, "Failed to save voice profile");
  };

  const handleResetDimensions = async () => {
    if (!window.confirm("Reset all voice dimensions to defaults?")) {
      return;
    }

    await persistDimensions(
      DEFAULT_VOICE_DIMENSIONS,
      "Failed to reset voice profile"
    );
  };

  const handlePresetSelect = async (presetValues: VoiceDimensions) => {
    await persistDimensions(presetValues, "Failed to apply voice preset");
  };

  const toggleVoice = (id: string) => {
    setSelectedVoices((previous) => {
      const next = new Set(previous);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const updateBlend = (index: number, value: number) => {
    setBlendValues((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  };

  const getBlendedDimensions = () => {
    if (!activeBlendId || !profile) {
      return null;
    }

    const blend = blends.find((item) => item.id === activeBlendId);

    if (!blend) {
      return null;
    }

    return blend.voices.map((voice) => ({
      label: voice.label,
      percentage: voice.percentage,
    }));
  };

  const displayBlends = blends.map((blend) => ({
    id: blend.id,
    name: blend.name,
    mix: blend.voices.map((voice) => `${voice.percentage}% ${voice.label}`).join(" + "),
    isTemplate:
      (blend as SavedBlend & { isTemplate?: boolean }).isTemplate === true,
  }));
  const blendedDimensions = getBlendedDimensions();

  return (
    <AppShell>
      {error ? (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-atlas-error/30 bg-atlas-error/10 px-4 py-3 text-sm text-atlas-error"
        >
          {error}
        </div>
      ) : null}

      <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-atlas-teal">
        Voice Studio
      </p>
      <h1 className="font-heading text-2xl text-atlas-text">
        Your Voice — Detailed Breakdown
      </h1>

      {profile?.tweetsAnalyzed === 0 ? (
        <div className="mt-6 rounded-2xl border border-atlas-teal/30 bg-atlas-teal/5 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-atlas-teal/20">
              <Wand2 className="h-5 w-5 text-atlas-teal" />
            </div>
            <div className="flex-1">
              <h3 className="font-heading text-lg text-atlas-text">
                Auto-calibrate your voice
              </h3>
              <p className="mt-1 text-sm text-atlas-text-secondary">
                Connect your X account and Atlas will analyze your tweets to set
                your voice dimensions automatically.
              </p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  aria-label="Calibration X handle"
                  type="text"
                  placeholder="Your X handle (e.g. @vitalik)"
                  value={calibrateHandle}
                  onChange={(event) => setCalibrateHandle(event.target.value)}
                  className="w-full rounded-lg border border-glass-border bg-atlas-bg px-3 py-2 text-sm text-atlas-text placeholder-atlas-text-muted focus:border-atlas-teal focus:outline-none sm:w-64"
                />
                <GradientButton
                  size="sm"
                  onClick={() => {
                    const trimmedHandle = calibrateHandle.trim().replace("@", "");

                    if (!trimmedHandle) {
                      return;
                    }

                    api.voice
                      .calibrate(trimmedHandle)
                      .then((response) => {
                        setProfile(response.profile);
                        setDraftDimensions(pickVoiceDimensions(response.profile));
                        setCalibrateHandle("");
                      })
                      .catch(console.error);
                  }}
                  disabled={!calibrateHandle.trim()}
                >
                  Calibrate
                </GradientButton>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-glass-border bg-atlas-surface-glass p-8 backdrop-blur-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.18em] text-atlas-text-secondary">
                Voice dimensions
              </p>
              <button
                type="button"
                onClick={handleResetDimensions}
                disabled={loading || savingDimensions}
                className="text-xs text-atlas-text-muted transition-colors hover:text-atlas-warning disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reset to defaults
              </button>
            </div>
            <p className="text-sm italic text-atlas-text-muted">
              SignalSocial-style depth, but still fully adjustable whenever your
              voice evolves.
            </p>
          </div>

          <GradientButton
            onClick={saveDimensions}
            disabled={loading || savingDimensions || !hasUnsavedChanges}
          >
            {savingDimensions ? "Saving..." : "Save voice profile"}
          </GradientButton>
        </div>

        <div className="mt-6">
          {activeBlendId && blendedDimensions ? (
            <div className="mb-4 rounded-xl border border-atlas-teal/30 bg-atlas-teal/5 p-3">
              <p className="mb-2 text-xs font-medium text-atlas-teal">
                Active Blend
              </p>
              <div className="flex items-center gap-2">
                {blendedDimensions.map((voice, index) => (
                  <span
                    key={`${voice.label}-${voice.percentage}`}
                    className="text-xs text-atlas-text"
                  >
                    {voice.percentage}% {voice.label}
                    {index < blendedDimensions.length - 1 ? (
                      <span className="mx-1 text-atlas-text-muted">+</span>
                    ) : null}
                  </span>
                ))}
              </div>
              <p className="mt-1 text-[10px] text-atlas-text-muted">
                Drafts will use this blend&apos;s voice mix
              </p>
            </div>
          ) : null}
          <div className="mb-4">
            <p className="mb-2 text-xs uppercase tracking-[0.18em] text-atlas-text-secondary">
              Quick presets
            </p>
            <div className="flex flex-wrap gap-2">
              {VOICE_PRESETS.map((preset) => {
                const isActive = VOICE_DIMENSION_FIELDS.every(
                  (field) => draftDimensions[field] === preset.values[field]
                );

                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handlePresetSelect(preset.values)}
                    disabled={loading || savingDimensions}
                    aria-pressed={isActive}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "border-atlas-teal bg-atlas-teal/10 text-atlas-teal"
                        : "border-glass-border bg-atlas-surface text-atlas-text-secondary hover:border-atlas-teal/40 hover:text-atlas-text"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
          <VoiceDimensionSections
            values={draftDimensions}
            interactive
            loading={loading}
            onChange={updateDimension}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-atlas-text-secondary">
          <span>Maturity: {formatMaturityLabel(profile?.maturity)}</span>
          <span>Based on {profile?.tweetsAnalyzed ?? 0} tweets analyzed.</span>
          {!loading && hasUnsavedChanges ? (
            <span className="text-atlas-teal">Unsaved slider changes</span>
          ) : null}
        </div>
      </div>

      <div className="mt-8">
        <p className="text-xs uppercase tracking-wide text-atlas-text-secondary">
          Reference Voices
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {references.length === 0 ? (
            <div className="col-span-full py-8 text-center">
              <p className="text-sm text-atlas-text-muted">
                No reference voices yet. Add Twitter handles to start building
                your unique style.
              </p>
            </div>
          ) : (
            references.map((voice) => {
              const isSelected = selectedVoices.has(voice.id);

              return (
                <button
                  key={voice.id}
                  type="button"
                  onClick={() => toggleVoice(voice.id)}
                  aria-pressed={isSelected}
                  className={`flex items-center gap-3 rounded-2xl bg-atlas-surface p-3 transition-all ${
                    isSelected
                      ? "border border-atlas-teal"
                      : "border border-glass-border"
                  }`}
                >
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-atlas-nav text-sm text-atlas-text-secondary">
                    {voice.name[0]}
                    {isSelected ? (
                      <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-atlas-teal">
                        <Check className="h-2.5 w-2.5 text-atlas-bg" />
                      </div>
                    ) : null}
                  </div>
                  <span className="text-sm text-atlas-text-secondary">
                    {voice.name}
                  </span>
                </button>
              );
            })
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowAddVoice(true)}
          className="mt-3 text-sm text-atlas-teal hover:underline"
        >
          + Add your own
        </button>
        {showAddVoice ? (
          <div className="mt-3 space-y-3 rounded-xl border border-glass-border bg-atlas-surface p-4">
            <input
              aria-label="Reference voice name"
              type="text"
              placeholder="Voice name (e.g. Hasu)"
              value={newVoiceName}
              onChange={(event) => setNewVoiceName(event.target.value)}
              className="w-full rounded-lg border border-glass-border bg-atlas-bg px-3 py-2 text-sm text-atlas-text placeholder-atlas-text-secondary focus:border-atlas-teal focus:outline-none"
            />
            <input
              aria-label="Reference voice handle"
              type="text"
              placeholder="X handle (optional)"
              value={newVoiceHandle}
              onChange={(event) => setNewVoiceHandle(event.target.value)}
              className="w-full rounded-lg border border-glass-border bg-atlas-bg px-3 py-2 text-sm text-atlas-text placeholder-atlas-text-secondary focus:border-atlas-teal focus:outline-none"
            />
            <div className="flex gap-2">
              <GradientButton
                size="sm"
                onClick={async () => {
                  if (!newVoiceName.trim()) {
                    return;
                  }

                  setAddingVoice(true);

                  try {
                    await api.voice.addReference(
                      newVoiceName.trim(),
                      newVoiceHandle.trim() || undefined
                    );
                    setNewVoiceName("");
                    setNewVoiceHandle("");
                    setShowAddVoice(false);

                    const response = await api.voice.getReferences();
                    setReferences(response.voices);
                  } catch (addVoiceError) {
                    console.error(addVoiceError);
                  } finally {
                    setAddingVoice(false);
                  }
                }}
                disabled={addingVoice || !newVoiceName.trim()}
              >
                {addingVoice ? "Adding..." : "Add Voice"}
              </GradientButton>
              <button
                type="button"
                onClick={() => setShowAddVoice(false)}
                className="text-sm text-atlas-text-secondary hover:text-atlas-text"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-8">
        <p className="text-xs uppercase tracking-wide text-atlas-text-secondary">
          Your Saved Blends
        </p>
        <div className="mt-3 space-y-3">
          {displayBlends.length === 0 ? (
            <div className="col-span-full py-8 text-center">
              <p className="text-sm text-atlas-text-muted">
                No saved blends yet. Create your first blend using the sliders
                above.
              </p>
            </div>
          ) : (
            displayBlends.map((blend) => (
              <div
                key={blend.id}
                className={`flex items-center justify-between rounded-2xl border p-4 ${
                  activeBlendId === blend.id
                    ? "border-atlas-teal bg-atlas-teal/5"
                    : "border-glass-border bg-atlas-surface"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-atlas-text">
                      {blend.name}
                    </p>
                    {blend.isTemplate ? (
                      <span className="rounded bg-atlas-text-secondary/10 px-1.5 py-0.5 text-[10px] text-atlas-text-secondary">
                        Template
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-atlas-text-secondary">
                    {blend.mix}
                  </p>
                </div>
                <GradientButton
                  aria-label={
                    activeBlendId === blend.id
                      ? `Deactivate saved blend ${blend.name}`
                      : `Use saved blend ${blend.name}`
                  }
                  size="sm"
                  variant={activeBlendId === blend.id ? "solid" : "outline"}
                  onClick={() => {
                    setActiveBlendId(activeBlendId === blend.id ? null : blend.id);
                  }}
                >
                  {activeBlendId === blend.id ? "Active" : "Use"}
                </GradientButton>
              </div>
            ))
          )}
        </div>
        <button
          type="button"
          className="mt-3 text-sm text-atlas-teal hover:underline"
          onClick={() => setShowNewBlend(true)}
        >
          + New blend
        </button>
        {showNewBlend ? (
          <div className="mt-3 space-y-3 rounded-xl border border-glass-border bg-atlas-surface p-4">
            <input
              aria-label="Blend name"
              type="text"
              placeholder="Blend name"
              value={blendName}
              onChange={(event) => setBlendName(event.target.value)}
              className="w-full rounded-lg border border-glass-border bg-atlas-bg px-3 py-2 text-sm text-atlas-text placeholder-atlas-text-secondary focus:border-atlas-teal focus:outline-none"
            />
            <p className="text-xs text-atlas-text-muted">
              Add voices and adjust percentages (must total 100%)
            </p>
            {blendVoices.map((voice, index) => (
              <div key={`${voice.label}-${index}`} className="flex items-center gap-2">
                <select
                  aria-label={`Voice ${index + 1} in the blend`}
                  value={voice.label}
                  onChange={(event) => {
                    const referenceVoice = references.find(
                      (reference) => reference.name === event.target.value
                    );

                    setBlendVoices((current) => {
                      const updated = [...current];
                      updated[index] = {
                        ...updated[index],
                        label: event.target.value,
                        referenceVoiceId: referenceVoice?.id,
                      };
                      return updated;
                    });
                  }}
                  className="flex-1 rounded-lg border border-glass-border bg-atlas-bg px-3 py-2 text-sm text-atlas-text"
                >
                  <option value="Personal">Personal</option>
                  {references.map((reference) => (
                    <option key={reference.id} value={reference.name}>
                      {reference.name}
                    </option>
                  ))}
                </select>
                <input
                  aria-label={`Percentage for voice ${index + 1} in the blend`}
                  type="number"
                  min={0}
                  max={100}
                  value={voice.percentage}
                  onChange={(event) => {
                    const nextPercentage = Number(event.target.value);

                    setBlendVoices((current) => {
                      const updated = [...current];
                      updated[index] = {
                        ...updated[index],
                        percentage: nextPercentage,
                      };
                      return updated;
                    });
                  }}
                  className="w-20 rounded-lg border border-glass-border bg-atlas-bg px-3 py-2 text-center text-sm text-atlas-text"
                />
                <span className="text-xs text-atlas-text-muted">%</span>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setBlendVoices([
                  ...blendVoices,
                  { label: "Personal", percentage: 0 },
                ])
              }
              className="text-xs text-atlas-teal hover:underline"
            >
              + Add voice
            </button>
            <div className="flex gap-2 pt-2">
              <GradientButton
                size="sm"
                onClick={async () => {
                  if (!blendName.trim()) {
                    return;
                  }

                  setSavingBlend(true);

                  try {
                    await api.voice.createBlend(blendName.trim(), blendVoices);
                    setBlendName("");
                    setBlendVoices([{ label: "Personal", percentage: 50 }]);
                    setShowNewBlend(false);

                    const response = await api.voice.getBlends();
                    setBlends(response.blends);
                  } catch (saveBlendError) {
                    console.error(saveBlendError);
                  } finally {
                    setSavingBlend(false);
                  }
                }}
                disabled={savingBlend || !blendName.trim()}
              >
                {savingBlend ? "Saving..." : "Save Blend"}
              </GradientButton>
              <button
                type="button"
                onClick={() => setShowNewBlend(false)}
                className="text-sm text-atlas-text-secondary hover:text-atlas-text"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-8 rounded-2xl border border-glass-border bg-atlas-surface-glass p-8 backdrop-blur-sm">
        <h3 className="font-heading text-lg text-atlas-text">
          Create or Edit a Blend
        </h3>
        <div className="mt-4 space-y-4">
          {[
            "My voice",
            ...(references.length > 0
              ? references.slice(0, 3).map((reference) => reference.name)
              : ["Reference A", "Reference B", "Reference C"]),
          ].map((label, index) => (
            <div key={label} className="flex items-center gap-4">
              <span className="w-28 shrink-0 truncate text-sm text-atlas-text-secondary">
                {label}
              </span>
              <input
                aria-label={`${label} blend percentage`}
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
        <div className="mt-4 rounded-2xl bg-atlas-nav p-4">
          <p className="text-sm italic text-atlas-text-secondary">
            Preview will generate once you save a blend and craft your first
            draft with it.
          </p>
        </div>
        <p className="mt-2 text-xs text-atlas-text-muted">
          Add more voices from Reference Voices above.
        </p>
        <div className="mt-4 flex gap-3">
          <GradientButton>Save blend</GradientButton>
          <GradientButton variant="outline-teal">Share with team</GradientButton>
        </div>
      </div>
    </AppShell>
  );
}

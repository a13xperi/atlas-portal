"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);

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

  const saveDimensions = async () => {
    if (!hasUnsavedChanges) {
      return;
    }

    setSavingDimensions(true);
    setError(null);

    try {
      const response = await api.voice.updateProfile(draftDimensions);
      setProfile(response.profile);
      setDraftDimensions(pickVoiceDimensions(response.profile));
    } catch (saveError: unknown) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save voice profile"
      );
    } finally {
      setSavingDimensions(false);
    }
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

  const displayBlends = blends.map((blend) => ({
    name: blend.name,
    mix: blend.voices.map((voice) => `${voice.percentage}% ${voice.label}`).join(" + "),
    isTemplate:
      (blend as SavedBlend & { isTemplate?: boolean }).isTemplate === true,
  }));

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

      <div className="mt-6 rounded-2xl border border-glass-border bg-atlas-surface-glass p-8 backdrop-blur-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
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
        <label className="text-xs uppercase tracking-wide text-atlas-text-secondary">
          Reference Voices
        </label>
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
              type="text"
              placeholder="Voice name (e.g. Hasu)"
              value={newVoiceName}
              onChange={(event) => setNewVoiceName(event.target.value)}
              className="w-full rounded-lg border border-glass-border bg-atlas-bg px-3 py-2 text-sm text-atlas-text placeholder-atlas-text-secondary focus:border-atlas-teal focus:outline-none"
            />
            <input
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
        <label className="text-xs uppercase tracking-wide text-atlas-text-secondary">
          Your Saved Blends
        </label>
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
                key={blend.name}
                className="flex items-center justify-between rounded-2xl border border-glass-border border-l-2 border-l-atlas-teal bg-atlas-surface p-4"
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
                <GradientButton variant="outline-teal">Use</GradientButton>
              </div>
            ))
          )}
        </div>
        <p
          className="mt-3 cursor-pointer text-sm text-atlas-teal hover:underline"
          onClick={() => setShowNewBlend(true)}
        >
          + New blend
        </p>
        {showNewBlend ? (
          <div className="mt-3 space-y-3 rounded-xl border border-glass-border bg-atlas-surface p-4">
            <input
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

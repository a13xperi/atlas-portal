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

      <h1 className="font-heading text-2xl text-atlas-text">
        Your Voice Profiles
      </h1>

      <div className="mt-6 rounded-2xl border border-glass-border bg-atlas-surface p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="font-heading text-lg text-atlas-text">
              Your Voice — Detailed Breakdown
            </h3>
            <p className="mt-2 text-sm italic text-atlas-text-muted">
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
        <p className="mt-3 cursor-pointer text-sm text-atlas-teal hover:underline">
          + Add your own
        </p>
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
        <p className="mt-3 cursor-pointer text-sm text-atlas-teal hover:underline">
          + New blend
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-glass-border bg-atlas-surface p-8">
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

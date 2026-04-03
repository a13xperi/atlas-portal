"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import { Skeleton } from "@/components/ui/Skeleton";
import DimensionBar from "@/components/ui/DimensionBar";
import GradientButton from "@/components/ui/GradientButton";
import { Check, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api, VoiceProfile, ReferenceVoice, SavedBlend } from "@/lib/api";

export default function VoiceProfilesPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<VoiceProfile | null>(null);
  const [references, setReferences] = useState<ReferenceVoice[]>([]);
  const [blends, setBlends] = useState<SavedBlend[]>([]);
  const [selectedVoices, setSelectedVoices] = useState<Set<string>>(new Set());
  const [blendValues, setBlendValues] = useState([40, 30, 20, 10]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.voice.getProfile().then((r) => setProfile(r.profile)),
      api.voice.getReferences().then((r) => setReferences(r.voices)),
      api.voice.getBlends().then((r) => setBlends(r.blends)),
    ])
      .catch((err: Error) => setError(err.message || "Failed to load voice profiles"))
      .finally(() => setLoading(false));
  }, []);

  const updateDimension = async (field: string, value: number) => {
    if (!user || !profile) return;
    try {
      const updated = await api.voice.updateProfile({ [field]: value });
      setProfile(updated.profile);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update dimension");
    }
  };

  const toggleVoice = (id: string) => {
    setSelectedVoices((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const updateBlend = (index: number, value: number) => {
    const newValues = [...blendValues];
    newValues[index] = value;
    setBlendValues(newValues);
  };

  const displayVoices = references;

  const displayBlends = blends.length > 0
    ? blends.map((b) => ({
        name: b.name,
        mix: b.voices.map((v) => `${v.percentage}% ${v.label}`).join(" + "),
        isTemplate: (b as SavedBlend & { isTemplate?: boolean }).isTemplate === true,
      }))
    : [];

  return (
    <AppShell>
      {error && (
        <div role="alert" className="mb-6 px-4 py-3 bg-atlas-error/10 border border-atlas-error/30 rounded-xl text-atlas-error text-sm">
          {error}
        </div>
      )}

      <h1 className="font-heading text-2xl text-atlas-text">
        Your Voice Profiles
      </h1>

      {/* Detailed Voice Card */}
      <div className="mt-6 bg-atlas-surface border border-glass-border rounded-2xl p-8">
        <h3 className="font-heading text-lg text-atlas-text mb-4">
          Your Voice — Detailed Breakdown
        </h3>
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 flex-1 rounded-full" />
              </div>
            ))
          ) : (
            <>
              <DimensionBar label="Humor" percentage={profile?.humor ?? 50} interactive onChange={(v) => updateDimension("humor", v)} />
              <DimensionBar label="Formality" percentage={profile?.formality ?? 50} interactive onChange={(v) => updateDimension("formality", v)} />
              <DimensionBar label="Brevity" percentage={profile?.brevity ?? 50} interactive onChange={(v) => updateDimension("brevity", v)} />
              <DimensionBar label="Contrarian tone" percentage={profile?.contrarianTone ?? 50} interactive onChange={(v) => updateDimension("contrarianTone", v)} />
            </>
          )}
        </div>
        <div className="mt-4 flex gap-4 text-sm text-atlas-text-secondary">
          <span>Maturity: {profile?.maturity ?? "Beginner"}</span>
          <span>Based on {profile?.tweetsAnalyzed ?? 0} tweets analyzed.</span>
        </div>
        <p className="text-atlas-text-muted text-sm italic mt-2">
          Tap any dimension to see the tweets that shaped it.
        </p>
      </div>

      {/* Reference Voices */}
      <div className="mt-8">
        <label className="text-xs text-atlas-text-secondary uppercase tracking-wide">
          Reference Voices
        </label>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {displayVoices.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-sm text-atlas-text-muted">No reference voices yet. Add Twitter handles to start building your unique style.</p>
            </div>
          ) : displayVoices.map((voice) => {
            const isSelected = selectedVoices.has(voice.id);
            return (
              <button
                key={voice.id}
                type="button"
                onClick={() => toggleVoice(voice.id)}
                className={`flex items-center gap-3 bg-atlas-surface rounded-2xl p-3 transition-all ${
                  isSelected ? "border border-atlas-teal" : "border border-glass-border"
                }`}
              >
                <div className="relative w-10 h-10 rounded-full bg-atlas-nav flex items-center justify-center text-atlas-text-secondary text-sm shrink-0">
                  {voice.name[0]}
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-atlas-teal flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-atlas-bg" />
                    </div>
                  )}
                </div>
                <span className="text-sm text-atlas-text-secondary">{voice.name}</span>
              </button>
            );
          })}
        </div>
        <p className="text-atlas-teal text-sm mt-3 cursor-pointer hover:underline">
          + Add your own
        </p>
      </div>

      {/* Saved Blends */}
      <div className="mt-8">
        <label className="text-xs text-atlas-text-secondary uppercase tracking-wide">
          Your Saved Blends
        </label>
        <div className="mt-3 space-y-3">
          {displayBlends.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-sm text-atlas-text-muted">No saved blends yet. Create your first blend using the sliders above.</p>
            </div>
          ) : displayBlends.map((blend) => (
            <div
              key={blend.name}
              className="bg-atlas-surface border border-glass-border border-l-2 border-l-atlas-teal rounded-2xl p-4 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-atlas-text font-medium">{blend.name}</p>
                  {blend.isTemplate && (
                    <span className="text-[10px] text-atlas-text-secondary bg-atlas-text-secondary/10 px-1.5 py-0.5 rounded">
                      Template
                    </span>
                  )}
                </div>
                <p className="text-xs text-atlas-text-secondary mt-1">{blend.mix}</p>
              </div>
              <GradientButton variant="outline-teal">Use</GradientButton>
            </div>
          ))}
        </div>
        <p className="text-atlas-teal text-sm mt-3 cursor-pointer hover:underline">
          + New blend
        </p>
      </div>

      {/* Blend Creator */}
      <div className="mt-8 bg-atlas-surface border border-glass-border rounded-2xl p-8">
        <h3 className="font-heading text-lg text-atlas-text mb-4">
          Create or Edit a Blend
        </h3>
        <div className="space-y-4">
          {[
            "My voice",
            ...(references.length > 0
              ? references.slice(0, 3).map((r) => r.name)
              : ["Reference A", "Reference B", "Reference C"]),
          ].map((label, i) => (
            <div key={label} className="flex items-center gap-4">
              <span className="text-sm text-atlas-text-secondary w-28 shrink-0 truncate">{label}</span>
              <input
                type="range"
                min={0}
                max={100}
                value={blendValues[i]}
                onChange={(e) => updateBlend(i, Number(e.target.value))}
                className="flex-1 accent-atlas-teal"
              />
              <span className="text-sm text-atlas-text w-10 text-right">{blendValues[i]}%</span>
            </div>
          ))}
        </div>
        <div className="mt-4 bg-atlas-nav rounded-2xl p-4">
          <p className="text-sm text-atlas-text-secondary italic">
            Preview will generate once you save a blend and craft your first draft with it.
          </p>
        </div>
        <p className="text-atlas-text-muted text-xs mt-2">
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

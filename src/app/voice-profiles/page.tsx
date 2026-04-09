"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Sparkles, Wand2 } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import ReferenceVoicesSection from "@/components/voice-profiles/ReferenceVoicesSection";
import VoiceDimensionSections from "@/components/voice-profiles/VoiceDimensionSections";
import VoiceCard from "@/components/voice-profiles/VoiceCard";
import VoiceEditorModal from "@/components/voice-profiles/VoiceEditorModal";
import {
  api,
  BlendVoiceInput,
  ReferenceVoice,
  SavedBlend,
  VoiceProfile,
} from "@/lib/api";
import {
  pickVoiceDimensions,
  VoiceDimensions,
} from "@/lib/voice-profile-dimensions";

const PERSONAL_VOICE_ID = "__personal__";

type EditorMode = "create" | "edit-personal" | "edit-blend" | null;

function formatMaturityLabel(maturity?: VoiceProfile["maturity"]) {
  if (!maturity) return "Beginner";
  return `${maturity.charAt(0)}${maturity.slice(1).toLowerCase()}`;
}

export default function VoiceProfilesPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<VoiceProfile | null>(null);
  const [references, setReferences] = useState<ReferenceVoice[]>([]);
  const [blends, setBlends] = useState<SavedBlend[]>([]);
  const [activeVoiceId, setActiveVoiceId] = useState<string>(PERSONAL_VOICE_ID);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(PERSONAL_VOICE_ID);
  const [editorMode, setEditorMode] = useState<EditorMode>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calibrateHandle, setCalibrateHandle] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("atlas_active_blend");
    if (saved) {
      setActiveVoiceId(saved);
      setSelectedVoiceId(saved);
    }
  }, []);

  useEffect(() => {
    if (activeVoiceId === PERSONAL_VOICE_ID) {
      localStorage.removeItem("atlas_active_blend");
    } else {
      localStorage.setItem("atlas_active_blend", activeVoiceId);
    }
  }, [activeVoiceId]);

  const loadData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.voice.getProfile().then((r) => setProfile(r.profile)),
      api.voice.getReferences().then((r) => setReferences(r.voices)),
      api.voice.getBlends().then((r) => setBlends(r.blends)),
    ])
      .catch((e: Error) => setError(e.message || "Failed to load voice data"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedVoiceId !== PERSONAL_VOICE_ID && !blends.some((b) => b.id === selectedVoiceId)) {
      setSelectedVoiceId(PERSONAL_VOICE_ID);
    }
  }, [blends, selectedVoiceId]);

  const personalDimensions = pickVoiceDimensions(profile);
  const selectedIsPersonal = selectedVoiceId === PERSONAL_VOICE_ID;
  const selectedBlend = blends.find((b) => b.id === selectedVoiceId);

  const handleUseVoice = (id: string) => {
    setActiveVoiceId(id);
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
    const handle = calibrateHandle.trim().replace("@", "");
    if (!handle) return;
    try {
      const response = await api.voice.calibrate(handle);
      setProfile(response.profile);
      setCalibrateHandle("");
    } catch {
      setError("Calibration failed. Check the handle and try again.");
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-4xl animate-pulse space-y-6 px-4 py-8">
          <div className="h-4 w-24 rounded bg-atlas-surface" />
          <div className="h-8 w-48 rounded bg-atlas-surface" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 rounded-2xl bg-atlas-surface" />
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {error && (
          <div role="alert" className="mb-6 rounded-xl border border-atlas-error/30 bg-atlas-error/10 px-4 py-3 text-sm text-atlas-error">
            {error}
            <button type="button" onClick={loadData} className="ml-2 underline font-semibold hover:text-atlas-text">
              Try again
            </button>
          </div>
        )}

        <p className="text-sm font-medium uppercase tracking-[0.2em] text-atlas-teal">Voice Studio</p>
        <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-atlas-text">Your Voices</h1>
        <p className="mt-1 text-sm text-atlas-text-secondary">
          Pick a voice and start crafting. Each voice shapes how Atlas writes for you.
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
              <Sparkles className="mx-auto h-5 w-5 text-atlas-teal" />
              <p className="mt-2 text-sm font-semibold text-atlas-text-secondary">No blends yet</p>
              <p className="mt-1 text-[11px] text-atlas-text-muted">Combine reference voices to create your own style</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setEditorMode("create")}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-glass-border p-5 text-atlas-text-muted transition-colors hover:border-atlas-teal/40 hover:text-atlas-teal"
          >
            <Plus className="h-6 w-6" />
            <span className="text-xs font-semibold">New Voice</span>
            {blends.length === 0 && (
              <span className="text-[10px] text-atlas-text-muted">Blend references into custom voices</span>
            )}
          </button>
        </div>

        {/* Detail Panel */}
        <div className="mt-6 rounded-2xl border border-glass-border bg-atlas-surface p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg font-semibold text-atlas-text">
                {selectedIsPersonal ? "Personal Voice" : selectedBlend?.name ?? "Voice"} — Detail
              </h2>
              {selectedIsPersonal && (
                <p className="mt-1 text-xs text-atlas-text-muted">
                  {formatMaturityLabel(profile?.maturity)} &middot; {profile?.tweetsAnalyzed ?? 0} tweets analyzed
                </p>
              )}
              {!selectedIsPersonal && selectedBlend && (
                <p className="mt-1 text-xs text-atlas-text-secondary">
                  {selectedBlend.voices.map((v) => `${v.percentage}% ${v.label}`).join(" + ")}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {selectedIsPersonal && profile?.tweetsAnalyzed === 0 && (
                <div className="flex items-center gap-2">
                  <input type="text" placeholder="@handle" value={calibrateHandle} onChange={(e) => setCalibrateHandle(e.target.value)}
                    className="w-32 rounded-lg border border-glass-border bg-atlas-bg px-2 py-1.5 text-xs text-atlas-text placeholder-atlas-text-muted focus:border-atlas-teal focus:outline-none" />
                  <button type="button" onClick={() => void handleCalibrate()} disabled={!calibrateHandle.trim()}
                    className="flex items-center gap-1 rounded-lg border border-atlas-teal/40 bg-atlas-teal/10 px-3 py-1.5 text-xs font-semibold text-atlas-teal transition-colors hover:border-atlas-teal disabled:opacity-50">
                    <Wand2 className="h-3 w-3" />
                    Calibrate
                  </button>
                </div>
              )}
              <button type="button" onClick={() => setEditorMode(selectedIsPersonal ? "edit-personal" : "edit-blend")}
                className="rounded-lg border border-glass-border px-4 py-1.5 text-xs font-semibold text-atlas-text-secondary transition-colors hover:border-atlas-teal hover:text-atlas-teal">
                Edit
              </button>
            </div>
          </div>

          {selectedIsPersonal && (
            <div className="mt-6" data-tour="dimension-sliders">
              <VoiceDimensionSections values={personalDimensions} interactive={false} />
            </div>
          )}

          {!selectedIsPersonal && selectedBlend && (
            <div className="mt-6">
              <p className="text-xs text-atlas-text-muted">
                This voice blends {selectedBlend.voices.length} source{selectedBlend.voices.length !== 1 ? "s" : ""}. The AI mixes them when generating drafts.
              </p>
              <div className="mt-4 space-y-2">
                {selectedBlend.voices.map((voice) => (
                  <div key={voice.label} className="flex items-center justify-between rounded-xl bg-atlas-bg/40 px-4 py-3">
                    <span className="text-sm text-atlas-text">{voice.label}</span>
                    <span className="font-mono text-sm text-atlas-teal">{voice.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reference Voices */}
        <div className="mt-8" data-tour="reference-voices">
          <ReferenceVoicesSection references={references} onReferencesChange={setReferences} />
        </div>

        <VoiceEditorModal
          isOpen={editorMode !== null}
          mode={editorMode ?? "create"}
          initialName={editorMode === "edit-blend" ? selectedBlend?.name : ""}
          initialDimensions={editorMode === "edit-personal" ? personalDimensions : undefined}
          onSave={handleSaveVoice}
          onClose={() => setEditorMode(null)}
        />
      </div>
    </AppShell>
  );
}

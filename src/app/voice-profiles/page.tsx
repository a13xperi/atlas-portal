"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import TweetTinderSection from "./tweet-tinder-section";
import { useTour } from "@/components/tour/TourProvider";
import FeatureGate from "@/components/ui/FeatureGate";
import TweetTinderSection from "./tweet-tinder-section";
import ReferenceVoicesSection from "@/components/voice-profiles/ReferenceVoicesSection";
import VoiceLabInspirationPicker from "@/components/voice-profiles/VoiceLabInspirationPicker";
import VoiceCard from "@/components/voice-profiles/VoiceCard";
import {
  api,
  ReferenceVoice,
  SavedBlend,
  VoiceProfile,
} from "@/lib/api";

const PERSONAL_VOICE_ID = "__personal__";

function formatMaturityLabel(maturity?: VoiceProfile["maturity"]) {
  if (!maturity) return "Beginner";
  return `${maturity.charAt(0)}${maturity.slice(1).toLowerCase()}`;
}

function VoiceProfilesPage() {
  useTour("voice-profiles");


  const router = useRouter();
  const [profile, setProfile] = useState<VoiceProfile | null>(null);
  const [references, setReferences] = useState<ReferenceVoice[]>([]);
  const [blends, setBlends] = useState<SavedBlend[]>([]);
  const [activeVoiceId, setActiveVoiceId] = useState<string>(PERSONAL_VOICE_ID);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(PERSONAL_VOICE_ID);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const selectedIsPersonal = selectedVoiceId === PERSONAL_VOICE_ID;
  const selectedBlend = blends.find((b) => b.id === selectedVoiceId);

  const handleUseVoice = (id: string) => {
    setActiveVoiceId(id);
    router.push("/crafting");
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
        <div
          className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
          data-tour="voice-library"
        >
          <VoiceCard
            name="Personal Voice"
            isActive={activeVoiceId === PERSONAL_VOICE_ID}
            isPersonal
            isSelected={selectedVoiceId === PERSONAL_VOICE_ID}
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
          </div>

          <div className="mt-6">
            <VoiceLabInspirationPicker onProfileRefresh={setProfile} />
          </div>
        </div>

        {/* Tweet Tinder — voice calibration via liked tweets */}
        <div className="mt-8" data-tour="tweet-tinder">
          <TweetTinderSection />
        </div>

        {/* Tweet Tinder — voice calibration via liked tweets */}
        <div className="mt-8">
          <TweetTinderSection />
        </div>

        {/* Reference Voices */}
        <div className="mt-8" data-tour="reference-voices">
          <ReferenceVoicesSection references={references} onReferencesChange={setReferences} />
        </div>
      </div>
    </AppShell>
  );
}

export default function VoiceProfilesPageGated() {
  return (
    <FeatureGate flagKey="voice_lab">
      <VoiceProfilesPage />
    </FeatureGate>
  );
}

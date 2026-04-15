"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import FeatureGate from "@/components/ui/FeatureGate";
import ShadowGate from "@/components/ui/ShadowGate";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/auth";
import { api, TeamMember } from "@/lib/api";
import RecipeCard from "@/components/voice-profiles/RecipeCard";
import {
  pickVoiceDimensions,
  generateVoiceProfileName,
} from "@/lib/voice-profile-dimensions";
import { getNotableVoiceDimensions } from "@/lib/voice-recipes";
import { Sparkles } from "lucide-react";

function TeamLibraryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { team } = await api.users.team();
      setTeamMembers(team);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load team library");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const membersWithProfiles = useMemo(
    () => teamMembers.filter((m) => m.voiceProfile),
    [teamMembers]
  );

  const handleUse = (memberId: string) => {
    const member = teamMembers.find((m) => m.id === memberId);
    if (!member) return;
    const params = new URLSearchParams({ voice: member.handle });
    router.push(`/crafting?${params.toString()}`);
  };

  return (
    <AppShell>
      <ShadowGate sectionKey="voice-library-v2">
      {error && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-atlas-error/30 bg-atlas-error/10 px-4 py-3 text-sm text-atlas-error"
        >
          {error}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-atlas-text">
          Team Style Library
        </h1>
        <p className="mt-2 text-sm text-atlas-text-secondary">
          Browse and remix voice recipes from across the team.
        </p>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="break-inside-avoid rounded-2xl border border-glass-border bg-atlas-surface p-6 space-y-4"
            >
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <div className="pt-4 border-t border-glass-border space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && membersWithProfiles.length === 0 && (
        <div className="rounded-2xl border border-glass-border bg-atlas-surface p-12 text-center">
          <p className="text-sm text-atlas-text-secondary">
            No team voice recipes yet. Team members need to calibrate their voice profiles before they appear here.
          </p>
        </div>
      )}

      {/* Recipe cards grid */}
      {!loading && membersWithProfiles.length > 0 && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {membersWithProfiles.map((member) => {
            const dimensions = pickVoiceDimensions(member.voiceProfile);
            const notableDimensions = getNotableVoiceDimensions(dimensions);
            const blend = {
              id: member.id,
              name:
                generateVoiceProfileName(dimensions, [member.handle]) ||
                member.displayName ||
                member.handle,
              voices: [
                {
                  id: member.id,
                  label: member.displayName || member.handle,
                  percentage: 100,
                  referenceVoiceId: null,
                  referenceVoice: null,
                },
              ],
            };

            return (
              <RecipeCard
                key={member.id}
                blend={blend}
                dimensions={dimensions}
                fingerprintDescription={`${member.displayName || member.handle}'s calibrated voice profile.`}
                notableDimensions={notableDimensions}
                isActive={false}
                onUse={() => handleUse(member.id)}
                onPreviewSample={() => {}}
                user={{
                  handle: member.handle,
                  displayName: member.displayName || null,
                  avatarUrl: null,
                }}
              />
            );
          })}
        </div>
      )}
      </ShadowGate>
    </AppShell>
  );
}

export default function TeamLibraryPageGated() {
  return (
    <FeatureGate flagKey="library">
      <TeamLibraryPage />
    </FeatureGate>
  );
}

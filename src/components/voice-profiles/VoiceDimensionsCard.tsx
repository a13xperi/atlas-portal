"use client";

import DimensionBar from "@/components/ui/DimensionBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { VoiceProfile } from "@/lib/api";

type VoiceDimensionField = "humor" | "formality" | "brevity" | "contrarianTone";

interface VoiceDimensionsCardProps {
  loading: boolean;
  profile: VoiceProfile | null;
  onUpdateDimension: (field: VoiceDimensionField, value: number) => Promise<void> | void;
}

export default function VoiceDimensionsCard({
  loading,
  profile,
  onUpdateDimension,
}: VoiceDimensionsCardProps) {
  return (
    <div className="mt-6 bg-atlas-surface border border-glass-border rounded-2xl p-8">
      <h3 className="font-heading font-semibold text-lg text-atlas-text mb-4">
        Your Voice — Detailed Breakdown
      </h3>
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 flex-1 rounded-full" />
            </div>
          ))
        ) : (
          <>
            <DimensionBar
              label="Humor"
              percentage={profile?.humor ?? 50}
              interactive
              onChange={(value) => onUpdateDimension("humor", value)}
            />
            <DimensionBar
              label="Formality"
              percentage={profile?.formality ?? 50}
              interactive
              onChange={(value) => onUpdateDimension("formality", value)}
            />
            <DimensionBar
              label="Brevity"
              percentage={profile?.brevity ?? 50}
              interactive
              onChange={(value) => onUpdateDimension("brevity", value)}
            />
            <DimensionBar
              label="Contrarian tone"
              percentage={profile?.contrarianTone ?? 50}
              interactive
              onChange={(value) => onUpdateDimension("contrarianTone", value)}
            />
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
  );
}

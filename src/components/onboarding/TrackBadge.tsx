"use client";

import { Sparkles, Brush } from "lucide-react";
import type { TrackMeta } from "@/lib/oracle";

interface TrackBadgeProps {
  meta: TrackMeta | null;
}

/**
 * Visual track indicator shown in the onboarding header once the user has
 * picked a path. Human-first: labels describe what the track *does*
 * ("X-Powered", "Hand-Crafted") rather than exposing letter codes. The
 * full tagline is surfaced via the native tooltip on hover.
 */
export default function TrackBadge({ meta }: TrackBadgeProps) {
  if (!meta) return null;

  const Icon = meta.iconKey === "sparkles" ? Sparkles : Brush;

  return (
    <span
      data-testid="onboarding-track-badge"
      data-track={meta.id}
      className={`inline-flex items-center gap-1.5 rounded-full border bg-atlas-surface/60 px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm ${meta.accent}`}
      title={meta.tagline}
      aria-label={`Onboarding path: ${meta.label}. ${meta.tagline}`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      <span>{meta.label}</span>
    </span>
  );
}

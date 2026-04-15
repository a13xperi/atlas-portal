"use client";

import { getTwitterAvatarUrl } from "@/lib/public-urls";

export interface VoicePillBarVoice {
  handle: string;
  avatarUrl?: string;
  pct: number;
}

interface VoicePillBarProps {
  voices: VoicePillBarVoice[];
  className?: string;
}

const SEGMENT_STYLES = [
  {
    bar: "bg-atlas-teal",
    pill: "border-atlas-teal/30 bg-atlas-teal/10 text-atlas-teal",
  },
  {
    bar: "bg-delphi-blue-500",
    pill: "border-delphi-blue-500/30 bg-delphi-blue-500/10 text-delphi-blue-300",
  },
  {
    bar: "bg-delphi-blue-400",
    pill: "border-delphi-blue-400/30 bg-delphi-blue-400/10 text-delphi-blue-300",
  },
  {
    bar: "bg-atlas-success",
    pill: "border-atlas-success/30 bg-atlas-success/10 text-atlas-success",
  },
  {
    bar: "bg-atlas-warning",
    pill: "border-atlas-warning/30 bg-atlas-warning/10 text-atlas-warning",
  },
  {
    bar: "bg-atlas-error",
    pill: "border-atlas-error/30 bg-atlas-error/10 text-atlas-error",
  },
] as const;

function VoiceAvatar({
  url,
  handle,
  size = 20,
  className = "",
}: {
  url?: string;
  handle: string;
  size?: number;
  className?: string;
}) {
  const initials = handle.trim().charAt(0).toUpperCase() || "?";

  if (!url) {
    return (
      <span
        className={`flex shrink-0 items-center justify-center rounded-full border border-glass-border bg-atlas-surface text-[10px] font-bold text-atlas-text-muted ${className}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        {initials}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={handle}
      width={size}
      height={size}
      className={`shrink-0 rounded-full object-cover ${className}`}
      style={{ width: size, height: size }}
      onError={(event) => {
        event.currentTarget.style.display = "none";
      }}
    />
  );
}

export default function VoicePillBar({ voices, className = "" }: VoicePillBarProps) {
  if (!voices || voices.length === 0) return null;

  const totalWeight = voices.reduce((sum, voice) => sum + voice.pct, 0) || 1;

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-atlas-text-muted">
          Composition
        </p>
        <p className="text-xs text-atlas-text-secondary">
          {voices.map((voice) => `${Math.round((voice.pct / totalWeight) * 100)}% ${voice.handle}`).join(" + ")}
        </p>
      </div>
      <div className="mt-3 overflow-hidden rounded-full border border-glass-border bg-atlas-bg/70">
        <div className="flex h-4">
          {voices.map((voice, index) => (
            <div
              key={`${voice.handle}-${index}`}
              aria-hidden="true"
              className={SEGMENT_STYLES[index % SEGMENT_STYLES.length].bar}
              style={{ width: `${(voice.pct / totalWeight) * 100}%` }}
            />
          ))}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {voices.map((voice, index) => (
          <span
            key={`${voice.handle}-${index}-pill`}
            className={`inline-flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-3 text-xs font-medium ${SEGMENT_STYLES[index % SEGMENT_STYLES.length].pill}`}
          >
            <VoiceAvatar
              url={voice.avatarUrl || getTwitterAvatarUrl(voice.handle) || undefined}
              handle={voice.handle}
              size={20}
            />
            {Math.round((voice.pct / totalWeight) * 100)}% {voice.handle}
          </span>
        ))}
      </div>
    </div>
  );
}

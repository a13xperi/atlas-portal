"use client";

import { useState } from "react";
import { Eye, Sparkles, X } from "lucide-react";
import type { ReferenceVoice } from "@/lib/api";
import { colors } from "@/lib/tokens";

interface ReferenceVoiceCardProps {
  voice: ReferenceVoice;
  onBlend: () => void;
  onPreview: () => void;
  onRemove?: () => void;
}

const DIMENSION_CONFIG = [
  { key: "humor", label: "Humor", colorClass: "bg-amber-500", gradient: "from-amber-500/20 to-amber-500" },
  { key: "formality", label: "Formality", colorClass: "bg-indigo-500", gradient: "from-indigo-500/20 to-indigo-500" },
  { key: "brevity", label: "Brevity", colorClass: "bg-emerald-500", gradient: "from-emerald-500/20 to-emerald-500" },
  { key: "contrarianTone", label: "Contrarian", colorClass: "bg-red-500", gradient: "from-red-500/20 to-red-500" },
] as const;

function normalizeHandle(handle?: string) {
  if (!handle) return "";
  return handle.replace(/^@+/, "");
}

export default function ReferenceVoiceCard({
  voice,
  onBlend,
  onPreview,
  onRemove,
}: ReferenceVoiceCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const handle = normalizeHandle(voice.handle);
  const displayName = voice.name || handle || voice.id;
  const avatarUrl = voice.avatarUrl || (handle ? `https://unavatar.io/twitter/${handle}` : null);

  const dimensions = voice.voiceProfile
    ? {
        humor: voice.voiceProfile.humor ?? 0,
        formality: voice.voiceProfile.formality ?? 0,
        brevity: voice.voiceProfile.brevity ?? 0,
        contrarianTone: voice.voiceProfile.contrarianTone ?? 0,
      }
    : null;

  return (
    <div
      className="group relative flex flex-col rounded-2xl border border-glass-border bg-atlas-surface/70 p-4 transition-all hover:border-atlas-teal/40 hover:shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ willChange: "transform" }}
    >
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute right-2 top-2 rounded-md p-1 text-atlas-text-muted opacity-0 transition-opacity hover:bg-atlas-error/10 hover:text-atlas-error group-hover:opacity-100"
          aria-label={`Remove ${displayName}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Identity */}
      <div className="flex items-center gap-3">
        {avatarUrl && !avatarError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={`${displayName} avatar`}
            className="h-12 w-12 rounded-full border-2 border-glass-border object-cover"
            onError={() => setAvatarError(true)}
          />
        ) : (
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-atlas-teal/30 text-sm font-semibold uppercase"
            style={{ backgroundColor: `${colors.atlasTeal}1A`, color: colors.atlasTeal }}
          >
            {displayName.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-atlas-text">{displayName}</p>
          {handle ? (
            <p className="truncate text-xs text-atlas-text-secondary">@{handle}</p>
          ) : (
            <p className="truncate text-xs text-atlas-text-secondary">Reference voice</p>
          )}
        </div>
      </div>

      {/* Dimension Bars */}
      <div className="mt-4 space-y-2">
        {DIMENSION_CONFIG.map(({ key, label, gradient }) => {
          const value = dimensions?.[key as keyof typeof dimensions] ?? 0;
          const barHeight = isHovered ? "h-2" : "h-1.5";
          return (
            <div key={key} className="group/bar">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] text-atlas-text-muted">{label}</span>
                <span className="text-[10px] text-atlas-text-secondary">{value}%</span>
              </div>
              <div className={`w-full overflow-hidden rounded-full bg-slate-700 ${barHeight} transition-all`}>
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-500`}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onBlend();
          }}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-500 ${isHovered ? "animate-pulse" : ""}`}
        >
          <Sparkles className="h-3 w-3" />
          Blend
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-600"
        >
          <Eye className="h-3 w-3" />
          Preview
        </button>
      </div>
    </div>
  );
}

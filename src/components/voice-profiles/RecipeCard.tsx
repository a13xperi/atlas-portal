"use client";

import { AnimatePresence, motion, useCycle } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  PencilLine,
  Sparkles,
} from "lucide-react";
import DimensionBar from "@/components/ui/DimensionBar";
import type { BlendVoice, SavedBlend } from "@/lib/api";
import type { VoiceDimensionSnapshot } from "@/lib/voice-recipes";
import {
  formatVoiceDimensionValue,
  type VoiceDimensions,
  VOICE_DIMENSION_SECTIONS,
} from "@/lib/voice-profile-dimensions";

interface RecipeCardProps {
  blend: SavedBlend;
  dimensions: VoiceDimensions;
  fingerprintDescription: string;
  notableDimensions: VoiceDimensionSnapshot[];
  isActive: boolean;
  onEdit?: () => void;
  onPreviewSample: () => void;
  onUse: () => void;
  previewError?: string | null;
  previewLoading?: boolean;
  previewText?: string;
  userHandle?: string;
}

function getVoiceAvatarUrl(voice: BlendVoice, userHandle?: string): string {
  if (voice.referenceVoice?.avatarUrl) return voice.referenceVoice.avatarUrl;
  if (voice.referenceVoice?.handle) {
    return `https://unavatar.io/twitter/${voice.referenceVoice.handle.replace("@", "")}`;
  }
  // User's own voice (no referenceVoice attached)
  if (userHandle) return `https://unavatar.io/twitter/${userHandle.replace("@", "")}`;
  return "";
}

function VoiceAvatar({
  voice,
  userHandle,
  size = 24,
  className = "",
}: {
  voice: BlendVoice;
  userHandle?: string;
  size?: number;
  className?: string;
}) {
  const url = getVoiceAvatarUrl(voice, userHandle);
  const initials = voice.label.charAt(0).toUpperCase();

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
      alt={voice.label}
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

const ALL_DIMENSIONS = VOICE_DIMENSION_SECTIONS.flatMap((section) =>
  section.dimensions.map((dimension) => ({
    field: dimension.field,
    label: dimension.label,
  }))
);

export default function RecipeCard({
  blend,
  dimensions,
  fingerprintDescription,
  notableDimensions,
  isActive,
  onEdit,
  onPreviewSample,
  onUse,
  previewError,
  previewLoading = false,
  previewText,
  userHandle,
}: RecipeCardProps) {
  const [isExpanded, toggleExpanded] = useCycle(false, true);

  return (
    <article
      className={`rounded-2xl border bg-glass p-6 font-body backdrop-blur-xl transition-all duration-200 ${
        isActive
          ? "border-atlas-teal/50 shadow-[0_0_0_1px_rgba(78,205,196,0.12)]"
          : "border-glass-border hover:border-atlas-teal/40"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-glass-border bg-atlas-surface/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-atlas-text-secondary">
              Voice recipe
            </span>
            {isActive && (
              <span className="rounded-full border border-atlas-teal/30 bg-atlas-teal/10 px-3 py-1 text-[11px] font-semibold text-atlas-teal">
                Active
              </span>
            )}
          </div>
          <h3 className="mt-4 font-heading text-2xl font-semibold tracking-tight text-atlas-text">
            {blend.name}
          </h3>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex flex-row-reverse items-center">
              {[...blend.voices].reverse().map((voice, reverseIndex) => (
                <VoiceAvatar
                  key={`${blend.id}-${voice.id ?? voice.label}-cluster`}
                  voice={voice}
                  userHandle={userHandle}
                  size={28}
                  className={`border-2 border-atlas-bg ring-0 ${
                    reverseIndex === blend.voices.length - 1 ? "" : "-ml-2"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-atlas-text-secondary">
              {blend.voices.length} ingredient{blend.voices.length === 1 ? "" : "s"} mixed into one writing recipe.
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-glass-border bg-atlas-surface/60 px-3 py-2 text-right">
          <p className="text-[11px] uppercase tracking-[0.18em] text-atlas-text-muted">
            Blend
          </p>
          <p className="mt-1 text-lg font-semibold text-atlas-text">
            {blend.voices.reduce((sum, voice) => sum + voice.percentage, 0)}%
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-atlas-text-muted">
            Composition
          </p>
          <p className="text-xs text-atlas-text-secondary">
            {blend.voices.map((voice) => `${voice.percentage}% ${voice.label}`).join(" + ")}
          </p>
        </div>
        <div className="mt-3 overflow-hidden rounded-full border border-glass-border bg-atlas-bg/70">
          <div className="flex h-4">
            {blend.voices.map((voice, index) => (
              <div
                key={`${blend.id}-${voice.label}`}
                aria-hidden="true"
                className={SEGMENT_STYLES[index % SEGMENT_STYLES.length].bar}
                style={{ width: `${voice.percentage}%` }}
              />
            ))}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {blend.voices.map((voice, index) => (
            <span
              key={`${blend.id}-${voice.label}-pill`}
              className={`inline-flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-3 text-xs font-medium ${SEGMENT_STYLES[index % SEGMENT_STYLES.length].pill}`}
            >
              <VoiceAvatar voice={voice} userHandle={userHandle} size={20} />
              {voice.percentage}% {voice.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-glass-border bg-atlas-surface/40 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-atlas-text-muted">
              Dimension fingerprint
            </p>
            <p className="mt-1 text-sm text-atlas-text-secondary">
              {fingerprintDescription}
            </p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {notableDimensions.map((dimension) => (
            <DimensionBar
              key={`${blend.id}-${dimension.field}`}
              label={dimension.label}
              percentage={dimensions[dimension.field]}
              valueLabel={formatVoiceDimensionValue(dimensions[dimension.field])}
            />
          ))}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="expanded-preview"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mt-6 border-t border-glass-border pt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-atlas-text-muted">
                Full recipe preview
              </p>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {ALL_DIMENSIONS.map((dimension) => (
                  <DimensionBar
                    key={`${blend.id}-full-${dimension.field}`}
                    label={dimension.label}
                    percentage={dimensions[dimension.field]}
                    valueLabel={formatVoiceDimensionValue(dimensions[dimension.field])}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => toggleExpanded()}
          aria-expanded={isExpanded}
          className="inline-flex items-center gap-2 rounded-xl border border-glass-border bg-atlas-surface/50 px-4 py-2 text-sm font-semibold text-atlas-text-secondary transition-colors hover:border-atlas-teal/40 hover:text-atlas-text"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          {isExpanded ? "Hide fingerprint" : "Show fingerprint"}
        </button>
        <button
          type="button"
          onClick={onPreviewSample}
          disabled={previewLoading}
          className="inline-flex items-center gap-2 rounded-xl border border-atlas-teal/30 bg-atlas-teal/10 px-4 py-2 text-sm font-semibold text-atlas-teal transition-colors hover:border-atlas-teal hover:bg-atlas-teal/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {previewLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating sample...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {previewText ? "Regenerate sample" : "Preview in this voice"}
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onUse}
          disabled={isActive}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-opacity ${
            isActive
              ? "cursor-default border border-atlas-teal/30 bg-atlas-teal/20 text-atlas-teal"
              : "bg-gradient-to-r from-delphi-teal to-delphi-teal/60 text-atlas-bg hover:opacity-90"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          {isActive ? "Active in Crafting" : "Use in Crafting"}
        </button>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-2 rounded-xl border border-glass-border bg-transparent px-4 py-2 text-sm font-semibold text-atlas-text-secondary transition-colors hover:border-atlas-teal/40 hover:text-atlas-text"
          >
            <PencilLine className="h-4 w-4" />
            Edit
          </button>
        )}
      </div>

      {previewText || previewError ? (
        <div className="mt-4 rounded-2xl border border-glass-border bg-atlas-surface/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-atlas-text-muted">
            Sample tweet
          </p>
          {previewError ? (
            <p role="alert" className="mt-2 text-sm text-atlas-error">
              {previewError}
            </p>
          ) : (
            <p
              aria-live="polite"
              className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-atlas-text"
            >
              {previewText}
            </p>
          )}
        </div>
      ) : null}
    </article>
  );
}

"use client";

import { AnimatePresence, motion, useCycle } from "framer-motion";
import { ChevronDown, ChevronUp, PencilLine, Sparkles } from "lucide-react";
import DimensionBar from "@/components/ui/DimensionBar";
import type { SavedBlend } from "@/lib/api";
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
  onEdit: () => void;
  onUse: () => void;
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
  onUse,
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
          <p className="mt-2 text-sm text-atlas-text-secondary">
            {blend.voices.length} ingredient{blend.voices.length === 1 ? "" : "s"} mixed into one writing recipe.
          </p>
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
              className={`rounded-full border px-3 py-1 text-xs font-medium ${SEGMENT_STYLES[index % SEGMENT_STYLES.length].pill}`}
            >
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
          {isExpanded ? "Hide Preview" : "Preview"}
        </button>
        <button
          type="button"
          onClick={onUse}
          disabled={isActive}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-opacity ${
            isActive
              ? "cursor-default border border-atlas-teal/30 bg-atlas-teal/20 text-atlas-teal"
              : "bg-gradient-to-r from-delphi-teal to-delphi-teal/60 text-white hover:opacity-90"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          {isActive ? "Active in Crafting" : "Use in Crafting"}
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-2 rounded-xl border border-glass-border bg-transparent px-4 py-2 text-sm font-semibold text-atlas-text-secondary transition-colors hover:border-atlas-teal/40 hover:text-atlas-text"
        >
          <PencilLine className="h-4 w-4" />
          Edit
        </button>
      </div>
    </article>
  );
}

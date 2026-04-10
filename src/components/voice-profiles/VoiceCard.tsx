"use client";

import { useCallback, useMemo, useState } from "react";
import { GitMerge, Loader2, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import {
  getNotableVoiceDimensions,
  type VoiceDimensionSnapshot,
} from "@/lib/voice-recipes";
import type { VoiceDimensions } from "@/lib/voice-profile-dimensions";

interface VoiceCardProps {
  name: string;
  isActive: boolean;
  isPersonal: boolean;
  isSelected: boolean;
  notableDimensions?: VoiceDimensionSnapshot[];
  /** @deprecated Prefer notableDimensions. Kept for backwards compat. */
  dimensions?: VoiceDimensions;
  userHandle?: string;
  onSelect: () => void;
  onUse: () => void;
  onBlend?: () => void;
  blendTargetMode?: boolean;
}

type Qualifier = "High" | "Med" | "Low";

interface RecipePill {
  key: string;
  label: string;
  qualifier: Qualifier;
  pillClass: string;
}

function qualifierFor(value: number): Qualifier {
  if (value >= 65) return "High";
  if (value <= 35) return "Low";
  return "Med";
}

function pillClassFor(qualifier: Qualifier): string {
  if (qualifier === "High") return "border-atlas-teal/30 bg-atlas-teal/10 text-atlas-teal";
  if (qualifier === "Low") return "border-glass-border bg-glass/60 text-atlas-text-muted";
  return "border-glass-border bg-glass/60 text-atlas-text-secondary";
}

function toRecipePills(snapshots: VoiceDimensionSnapshot[] | undefined): RecipePill[] {
  if (!snapshots || snapshots.length === 0) return [];
  return snapshots.slice(0, 3).map((s) => {
    const qualifier = qualifierFor(s.value);
    return { key: s.field, label: s.label, qualifier, pillClass: pillClassFor(qualifier) };
  });
}

export default function VoiceCard({
  name,
  isActive,
  isPersonal,
  isSelected,
  notableDimensions,
  dimensions,
  userHandle: _userHandle,
  onSelect,
  onUse,
  onBlend,
  blendTargetMode = false,
}: VoiceCardProps) {
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const recipePills = useMemo<RecipePill[]>(() => {
    if (notableDimensions && notableDimensions.length > 0) return toRecipePills(notableDimensions);
    if (dimensions) return toRecipePills(getNotableVoiceDimensions(dimensions, 3));
    return [];
  }, [notableDimensions, dimensions]);

  const loadPreview = useCallback(async () => {
    if (previewLoading) return;
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const res = await api.oracle.chat({
        page: "voice-preview",
        messages: [
          {
            role: "user",
            content: `Write a 2-sentence sample tweet in this voice style: ${name}. Be concise and demonstrate the voice clearly.`,
          },
        ],
      });
      setPreviewText(res.text?.trim() ?? "");
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : "Preview failed. Try again.");
    } finally {
      setPreviewLoading(false);
    }
  }, [name, previewLoading]);

  const containerClass = [
    "relative flex flex-col rounded-2xl border p-5 text-left transition-all cursor-pointer",
    blendTargetMode
      ? "border-atlas-teal/50 bg-atlas-surface ring-2 ring-atlas-teal/40 ring-offset-1 ring-offset-atlas-bg"
      : isSelected
        ? "border-atlas-teal ring-1 ring-atlas-teal bg-atlas-surface"
        : "border-glass-border bg-glass/50 backdrop-blur-xl hover:border-atlas-teal/40",
  ].join(" ");

  return (
    <div className={containerClass}>
      {/* Invisible overlay button for card selection — avoids nested-interactive a11y violation */}
      <button
        type="button"
        aria-pressed={isSelected}
        aria-label={`Select ${name} voice`}
        onClick={onSelect}
        className="absolute inset-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-atlas-teal focus:ring-inset"
      />

      <div className="relative z-10 flex items-start justify-between gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
            isPersonal ? "bg-atlas-teal/15 text-atlas-teal" : "bg-glass text-atlas-text-muted"
          }`}
        >
          {isPersonal ? "Personal" : "Voice"}
        </span>

        {onBlend && !blendTargetMode && (
          <button
            type="button"
            aria-label={`Blend with ${name}`}
            onClick={onBlend}
            className="rounded-lg border border-glass-border p-1.5 text-atlas-text-muted transition-colors hover:border-atlas-teal/40 hover:text-atlas-teal"
          >
            <GitMerge className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <p className="relative z-10 mt-2 truncate font-heading text-sm font-semibold text-atlas-text">{name}</p>

      <div className="relative z-10 mt-3">
        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          className="text-[10px] text-atlas-text-muted hover:text-atlas-text-secondary transition-colors"
        >
          {showDetails ? "Hide details ▴" : "Show details ▾"}
        </button>
        {showDetails && (
          <div className="mt-2 min-h-[1.75rem]">
            {recipePills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {recipePills.map((pill) => (
                  <span
                    key={pill.key}
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${pill.pillClass}`}
                  >
                    <span className="text-atlas-text-secondary">{pill.label}:</span>
                    <span className="ml-1">{pill.qualifier}</span>
                  </span>
                ))}
              </div>
            ) : (
              <span className="inline-flex rounded-full border border-dashed border-glass-border px-2 py-0.5 text-[10px] text-atlas-text-muted">
                No profile yet
              </span>
            )}
          </div>
        )}
      </div>

      <div className="relative z-10 mt-3">
        <button
          type="button"
          onClick={() => void loadPreview()}
          disabled={previewLoading}
          className="inline-flex items-center gap-1 rounded-lg border border-glass-border px-2 py-1 text-[11px] font-medium text-atlas-text-secondary transition-colors hover:border-atlas-teal/40 hover:text-atlas-teal disabled:cursor-not-allowed disabled:opacity-60"
        >
          {previewLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          <span>{previewLoading ? "Previewing…" : "Preview"}</span>
        </button>

        {previewError && (
          <p className="mt-2 rounded-lg border border-atlas-error/30 bg-atlas-error/10 px-2 py-1.5 text-[11px] text-atlas-error">
            {previewError}
          </p>
        )}

        {previewText && !previewError && (
          <p className="mt-2 rounded-lg border border-glass-border bg-atlas-bg/40 px-2 py-1.5 text-[11px] italic text-atlas-text-secondary">
            {previewText}
          </p>
        )}
      </div>

      <div className="relative z-10 mt-auto pt-4">
        {blendTargetMode ? (
          <button
            type="button"
            onClick={onUse}
            className="w-full rounded-lg bg-gradient-to-r from-atlas-teal to-atlas-teal/60 px-3 py-2 text-xs font-semibold text-atlas-bg transition-opacity hover:opacity-90"
          >
            Mix with this
          </button>
        ) : (
          <button
            type="button"
            onClick={onUse}
            disabled={isActive}
            className={`w-full rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
              isActive
                ? "cursor-default border border-atlas-teal/30 bg-atlas-teal/15 text-atlas-teal"
                : "border border-glass-border text-atlas-text-secondary hover:border-atlas-teal hover:text-atlas-teal"
            }`}
          >
            {isActive ? "Active" : "Craft with this voice"}
          </button>
        )}
      </div>
    </div>
  );
}

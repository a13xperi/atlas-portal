"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, X } from "lucide-react";
import type { ReferenceVoice, SavedBlend } from "@/lib/api";
import { api } from "@/lib/api";
import { colors } from "@/lib/tokens";
import type { VoiceDimensions } from "@/lib/voice-profile-dimensions";

interface BlendVoiceWeight {
  voice: ReferenceVoice;
  weight: number;
}

interface BlendPanelProps {
  isOpen: boolean;
  onClose: () => void;
  references: ReferenceVoice[];
  initialVoiceIds?: string[];
  personalDimensions: VoiceDimensions;
  userHandle?: string;
  onSaveBlend: (blend: SavedBlend) => void;
}

function normalizeHandle(handle?: string) {
  if (!handle) return "";
  return handle.replace(/^@+/, "");
}

function buildBlendPreviewPrompt(blendName: string, weights: BlendVoiceWeight[], personalDimensions: VoiceDimensions) {
  const composition = weights.map((w) => `${w.weight}% ${w.voice.name || normalizeHandle(w.voice.handle) || w.voice.id}`).join(", ");
  return [
    "Write one original sample tweet for a crypto analyst.",
    `Match this Atlas voice recipe: ${blendName}.`,
    `Blend composition: ${composition}.`,
    "Keep it under 260 characters.",
    "No hashtags, no thread marker, and no surrounding quotation marks.",
    "Make it feel publishable right now, with a specific point of view.",
  ].join(" ");
}

function sanitizePreview(text: string) {
  return text.trim().replace(/^"+|"+$/g, "");
}

export default function BlendPanel({
  isOpen,
  onClose,
  references,
  initialVoiceIds = [],
  personalDimensions,
  userHandle,
  onSaveBlend,
}: BlendPanelProps) {
  const [weights, setWeights] = useState<BlendVoiceWeight[]>([]);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [blendName, setBlendName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [regenCount, setRegenCount] = useState(0);

  // Initialize weights when panel opens
  useEffect(() => {
    if (!isOpen) return;

    const initialVoices = references.filter((r) => initialVoiceIds.includes(r.id));
    if (initialVoices.length === 0 && references.length > 0) {
      // Default to first reference if no initial selection
      initialVoices.push(references[0]);
    }

    const equalWeight = initialVoices.length > 0 ? Math.floor(100 / initialVoices.length) : 0;
    const leftover = initialVoices.length > 0 ? 100 - equalWeight * initialVoices.length : 0;

    setWeights(
      initialVoices.map((voice, idx) => ({
        voice,
        weight: equalWeight + (idx === 0 ? leftover : 0),
      }))
    );
    setBlendName(initialVoices.length === 1 ? `${initialVoices[0].name || normalizeHandle(initialVoices[0].handle)} Blend` : "Custom Blend");
    setPreviewText(null);
    setPreviewError(null);
    setSaveError(null);
    setRegenCount(0);
  }, [isOpen, initialVoiceIds, references]);

  const totalWeight = useMemo(() => weights.reduce((sum, w) => sum + w.weight, 0), [weights]);
  const isTotalValid = totalWeight === 100;

  const availableToAdd = useMemo(
    () => references.filter((r) => !weights.some((w) => w.voice.id === r.id)),
    [references, weights]
  );

  const handleWeightChange = (voiceId: string, newWeight: number) => {
    const clamped = Math.max(0, Math.min(100, newWeight));
    setWeights((current) =>
      current.map((w) => (w.voice.id === voiceId ? { ...w, weight: clamped } : w))
    );
  };

  const handleRemoveVoice = (voiceId: string) => {
    setWeights((current) => current.filter((w) => w.voice.id !== voiceId));
  };

  const handleAddVoice = (voice: ReferenceVoice) => {
    setWeights((current) => [...current, { voice, weight: 0 }]);
  };

  const generatePreview = async (force = false) => {
    if (!isTotalValid || weights.length === 0) return;
    if (isGenerating) return;
    if (!force && previewText && regenCount >= 5) return;

    setIsGenerating(true);
    setPreviewError(null);

    try {
      const response = await api.oracle.chat({
        page: "voice-blend-preview",
        messages: [
          {
            role: "user",
            content: buildBlendPreviewPrompt(blendName || "Custom Blend", weights, personalDimensions),
          },
        ],
      });
      const text = sanitizePreview(response.text || "");
      if (!text) throw new Error("Atlas returned an empty preview.");
      setPreviewText(text);
      setRegenCount((c) => c + 1);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : "Failed to generate preview.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate preview when total reaches 100%
  useEffect(() => {
    if (isTotalValid && weights.length > 0 && !previewText && !isGenerating && !previewError) {
      void generatePreview();
    }
  }, [isTotalValid, weights.length]);

  const handleSave = async () => {
    if (!isTotalValid || weights.length === 0 || isSaving) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const name = blendName.trim() || "Custom Blend";
      const blendVoices = weights.map((w) => ({
        label: w.voice.name || normalizeHandle(w.voice.handle) || w.voice.id,
        percentage: w.weight,
        referenceVoiceId: w.voice.id,
      }));

      const result = await api.voice.createBlend(name, blendVoices);
      onSaveBlend(result.blend);
      onClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save blend.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-glass-border bg-atlas-nav shadow-2xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-glass-border px-5 py-4">
            <h2 className="text-base font-semibold text-atlas-text">Create Blend</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-atlas-text-muted transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close blend panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* Selected Voices */}
            <div className="space-y-4">
              {weights.length === 0 ? (
                <div className="rounded-xl border border-dashed border-glass-border bg-atlas-surface/40 p-6 text-center">
                  <p className="text-sm text-atlas-text-secondary">Add voices to create a blend</p>
                </div>
              ) : (
                weights.map(({ voice, weight }) => {
                  const handle = normalizeHandle(voice.handle);
                  const name = voice.name || handle || voice.id;
                  const avatarUrl = voice.avatarUrl || (handle ? `https://unavatar.io/twitter/${handle}` : null);

                  return (
                    <div key={voice.id} className="rounded-xl border border-glass-border bg-atlas-surface/50 p-3">
                      <div className="flex items-center gap-3">
                        {avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={avatarUrl} alt="" className="h-8 w-8 rounded-full border border-glass-border object-cover" />
                        ) : (
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-atlas-teal/30 text-[10px] font-semibold uppercase"
                            style={{ backgroundColor: `${colors.atlasTeal}1A`, color: colors.atlasTeal }}
                          >
                            {name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-atlas-text">{name}</p>
                          {handle && <p className="truncate text-[10px] text-atlas-text-muted">@{handle}</p>}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveVoice(voice.id)}
                          className="rounded-md p-1 text-atlas-text-muted hover:bg-atlas-error/10 hover:text-atlas-error"
                          aria-label={`Remove ${name}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center gap-3">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={weight}
                          onChange={(e) => handleWeightChange(voice.id, parseInt(e.target.value, 10))}
                          className="flex-1 accent-atlas-teal"
                          disabled={isSaving}
                        />
                        <span className="w-10 text-right text-xs font-medium text-atlas-text">{weight}%</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add Voice */}
            {availableToAdd.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-atlas-text-secondary">Add voice</p>
                <div className="flex flex-wrap gap-2">
                  {availableToAdd.map((voice) => {
                    const name = voice.name || normalizeHandle(voice.handle) || voice.id;
                    return (
                      <button
                        key={voice.id}
                        type="button"
                        onClick={() => handleAddVoice(voice)}
                        disabled={isSaving}
                        className="rounded-full border border-atlas-teal/30 bg-atlas-teal/10 px-2.5 py-1 text-[11px] font-medium text-atlas-teal transition-colors hover:bg-atlas-teal/20 disabled:opacity-50"
                      >
                        + {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Total */}
            <div
              className={`mt-5 rounded-lg border px-3 py-2 ${
                isTotalValid
                  ? "border-atlas-success/30 bg-atlas-success/10"
                  : "border-atlas-warning/30 bg-atlas-warning/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-atlas-text-secondary">Total blend</span>
                <span
                  className={`text-sm font-semibold ${
                    isTotalValid ? "text-atlas-success" : "text-atlas-warning"
                  }`}
                >
                  {totalWeight}%
                </span>
              </div>
              {!isTotalValid && (
                <p className="mt-1 text-[11px] text-atlas-warning">
                  Blend must equal exactly 100% to preview and save.
                </p>
              )}
            </div>

            {/* Blend Name */}
            <div className="mt-5">
              <label htmlFor="blend-name" className="mb-1 block text-xs font-medium text-atlas-text-secondary">
                Blend name
              </label>
              <input
                id="blend-name"
                type="text"
                value={blendName}
                onChange={(e) => setBlendName(e.target.value)}
                disabled={isSaving}
                placeholder="My custom blend"
                className="w-full rounded-lg border border-glass-border bg-atlas-surface px-3 py-2 text-sm text-atlas-text placeholder-atlas-text-muted focus:border-atlas-teal/50 focus:outline-none disabled:opacity-50"
              />
            </div>

            {/* Preview */}
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-atlas-text-secondary">Blend preview</span>
                {isTotalValid && previewText && (
                  <button
                    type="button"
                    onClick={() => void generatePreview(true)}
                    disabled={isGenerating || regenCount >= 5}
                    className="flex items-center gap-1 text-[11px] font-medium text-atlas-teal transition-colors hover:text-atlas-teal/80 disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                    Regenerate
                  </button>
                )}
              </div>

              <div className="rounded-xl border border-glass-border bg-atlas-surface/40 p-4">
                {!isTotalValid ? (
                  <p className="text-center text-xs text-atlas-text-muted">
                    Adjust sliders to 100% to generate a preview.
                  </p>
                ) : isGenerating ? (
                  <div className="space-y-2">
                    <div className="h-3 w-full animate-pulse rounded bg-atlas-surface" />
                    <div className="h-3 w-4/5 animate-pulse rounded bg-atlas-surface" />
                    <div className="h-3 w-3/5 animate-pulse rounded bg-atlas-surface" />
                  </div>
                ) : previewError ? (
                  <p className="text-xs text-atlas-error">{previewError}</p>
                ) : previewText ? (
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      {userHandle ? (
                        <>
                          <div
                            className="flex h-6 w-6 items-center justify-center rounded-full border border-atlas-teal/30 text-[10px] font-semibold uppercase"
                            style={{ backgroundColor: `${colors.atlasTeal}1A`, color: colors.atlasTeal }}
                          >
                            {userHandle.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-atlas-text">Your voice</p>
                            <p className="text-[10px] text-atlas-text-muted">@{userHandle}</p>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs font-medium text-atlas-text">Your voice</p>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-atlas-text-secondary">{previewText}</p>
                  </div>
                ) : (
                  <p className="text-center text-xs text-atlas-text-muted">
                    Preview will appear once blend equals 100%.
                  </p>
                )}
              </div>
            </div>

            {saveError && (
              <p className="mt-4 rounded-lg border border-atlas-error/30 bg-atlas-error/10 px-3 py-2 text-xs text-atlas-error">
                {saveError}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-glass-border px-5 py-4">
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="rounded-lg border border-glass-border px-4 py-2 text-sm font-medium text-atlas-text-secondary transition-colors hover:border-atlas-teal/40 hover:text-atlas-text"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={!isTotalValid || weights.length === 0 || isSaving}
                className="flex items-center gap-2 rounded-lg bg-atlas-teal px-4 py-2 text-sm font-semibold text-atlas-bg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save Blend
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

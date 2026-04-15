"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw, X } from "lucide-react";
import type { ReferenceVoice } from "@/lib/api";
import { api } from "@/lib/api";
import { colors } from "@/lib/tokens";
import type { VoiceDimensions } from "@/lib/voice-profile-dimensions";

interface VoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  voice: ReferenceVoice | null;
  personalDimensions: VoiceDimensions;
  userHandle?: string;
  onBlend: () => void;
}

const DIMENSIONS = [
  { key: "humor", label: "Humor" },
  { key: "formality", label: "Form" },
  { key: "brevity", label: "Brev" },
  { key: "contrarianTone", label: "Cont" },
] as const;

function normalizeHandle(handle?: string) {
  if (!handle) return "";
  return handle.replace(/^@+/, "");
}

function buildPreviewPrompt(voiceName: string, voiceDimensions: VoiceDimensions, personalDimensions: VoiceDimensions, ratio: number) {
  const userRatio = Math.round(ratio * 100);
  const refRatio = 100 - userRatio;
  const dims = DIMENSIONS.map(({ key, label }) => {
    const vd = voiceDimensions[key as keyof VoiceDimensions] ?? 0;
    const pd = personalDimensions[key as keyof VoiceDimensions] ?? 0;
    const blended = Math.round((pd * ratio) + (vd * (1 - ratio)));
    return `${label}: ${blended}`;
  }).join(", ");

  return [
    "Write one original sample tweet for a crypto analyst.",
    `Blend the voice style of ${voiceName} (${refRatio}%) with the user's personal voice (${userRatio}%).`,
    `Blended dimensions: ${dims}.`,
    "Keep it under 260 characters.",
    "No hashtags, no thread marker, and no surrounding quotation marks.",
    "Make it feel publishable right now, with a specific point of view.",
  ].join(" ");
}

function sanitizePreview(text: string) {
  return text.trim().replace(/^"+|"+$/g, "");
}

export default function VoicePreviewModal({
  isOpen,
  onClose,
  voice,
  personalDimensions,
  userHandle,
  onBlend,
}: VoicePreviewModalProps) {
  const [ratio, setRatio] = useState(0.5);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [regenCount, setRegenCount] = useState(0);

  useEffect(() => {
    if (isOpen && voice) {
      setRatio(0.5);
      setPreviewText(null);
      setPreviewError(null);
      setRegenCount(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, voice?.id]);

  // Auto-generate on open
  useEffect(() => {
    if (isOpen && voice && !previewText && !isGenerating && !previewError) {
      void generatePreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, voice?.id, ratio]);

  const generatePreview = async () => {
    if (!voice || isGenerating) return;

    setIsGenerating(true);
    setPreviewError(null);

    try {
      const voiceDims = voice.voiceProfile
        ? {
            humor: voice.voiceProfile.humor ?? 0,
            formality: voice.voiceProfile.formality ?? 0,
            brevity: voice.voiceProfile.brevity ?? 0,
            contrarianTone: voice.voiceProfile.contrarianTone ?? 0,
            directness: voice.voiceProfile.directness ?? 0,
            warmth: voice.voiceProfile.warmth ?? 0,
            technicalDepth: voice.voiceProfile.technicalDepth ?? 0,
            confidence: voice.voiceProfile.confidence ?? 0,
            evidenceOrientation: voice.voiceProfile.evidenceOrientation ?? 0,
            solutionOrientation: voice.voiceProfile.solutionOrientation ?? 0,
            socialPosture: voice.voiceProfile.socialPosture ?? 0,
            selfPromotionalIntensity: voice.voiceProfile.selfPromotionalIntensity ?? 0,
          }
        : personalDimensions;

      const response = await api.oracle.chat({
        page: "voice-preview-blend",
        messages: [
          {
            role: "user",
            content: buildPreviewPrompt(
              voice.name || normalizeHandle(voice.handle) || voice.id,
              voiceDims,
              personalDimensions,
              ratio
            ),
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

  if (!isOpen || !voice) return null;

  const handle = normalizeHandle(voice.handle);
  const displayName = voice.name || handle || voice.id;
  const voiceDims = voice.voiceProfile
    ? {
        humor: voice.voiceProfile.humor ?? 0,
        formality: voice.voiceProfile.formality ?? 0,
        brevity: voice.voiceProfile.brevity ?? 0,
        contrarianTone: voice.voiceProfile.contrarianTone ?? 0,
      }
    : null;

  const blendedDims = DIMENSIONS.map(({ key }) => {
    const vd = voiceDims?.[key as keyof typeof voiceDims] ?? 0;
    const pd = personalDimensions[key as keyof VoiceDimensions] ?? 0;
    return Math.round(pd * ratio + vd * (1 - ratio));
  });

  return (
    <dialog open className="fixed inset-0 z-50 m-auto flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0A1225] p-0 shadow-2xl">
      {/* Backdrop handled separately */}
      <div
        className="fixed inset-0 -z-10 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Header */}
      <div className="flex items-start justify-between border-b border-white/10 p-6">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Preview: {displayName} in your voice
          </h2>
          <p className="mt-1 text-sm text-[#a0aec0]">
            See how this reference voice blends with your personal style.
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="ml-4 flex-shrink-0 rounded-lg p-1.5 text-[#718096] transition-colors hover:bg-white/10 hover:text-white"
        >
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Tweet preview */}
        <div className="rounded-xl border border-glass-border bg-atlas-surface/40 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full border border-atlas-teal/30 text-xs font-semibold uppercase"
              style={{ backgroundColor: `${colors.atlasTeal}1A`, color: colors.atlasTeal }}
            >
              {userHandle ? userHandle.charAt(0) : "Y"}
            </div>
            <div>
              <p className="text-sm font-medium text-atlas-text">Your voice</p>
              {userHandle && <p className="text-[11px] text-atlas-text-muted">@{userHandle}</p>}
            </div>
          </div>

          {isGenerating ? (
            <div className="space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-atlas-surface" />
              <div className="h-3 w-4/5 animate-pulse rounded bg-atlas-surface" />
              <div className="h-3 w-3/5 animate-pulse rounded bg-atlas-surface" />
            </div>
          ) : previewError ? (
            <div className="space-y-3">
              <p className="text-sm text-atlas-error">{previewError}</p>
              <button
                type="button"
                onClick={() => void generatePreview()}
                className="text-xs font-medium text-atlas-teal hover:underline"
              >
                Try again
              </button>
            </div>
          ) : previewText ? (
            <p className="text-sm leading-relaxed text-atlas-text-secondary">{previewText}</p>
          ) : (
            <p className="text-sm text-atlas-text-muted">Preview will appear shortly.</p>
          )}

          {previewText && !isGenerating && (
            <div className="mt-4 flex items-center justify-between border-t border-glass-border pt-3">
              <div className="flex items-center gap-4 text-[11px] text-atlas-text-muted">
                <span>💬 0</span>
                <span>🔁 0</span>
                <span>❤️ 0</span>
              </div>
              <button
                type="button"
                onClick={() => void generatePreview()}
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
            </div>
          )}
        </div>

        {/* Blend ratio slider */}
        <div className="mt-5 rounded-xl border border-glass-border bg-atlas-surface/30 p-4">
          <label htmlFor="blend-ratio" className="mb-2 block text-xs font-medium text-atlas-text-secondary">
            Your influence: {Math.round(ratio * 100)}%
          </label>
          <input
            id="blend-ratio"
            type="range"
            min={0}
            max={100}
            step={5}
            value={Math.round(ratio * 100)}
            onChange={(e) => {
              setRatio(parseInt(e.target.value, 10) / 100);
              setPreviewText(null);
            }}
            className="w-full accent-atlas-teal"
          />
          <div className="mt-1 flex justify-between text-[10px] text-atlas-text-muted">
            <span>All {displayName}</span>
            <span>Balanced</span>
            <span>All you</span>
          </div>
        </div>

        {/* Dimension comparison */}
        <div className="mt-5 grid grid-cols-2 gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold text-atlas-text-secondary">Your voice</p>
            <div className="space-y-2">
              {DIMENSIONS.map(({ key, label }) => {
                const value = personalDimensions[key as keyof VoiceDimensions] ?? 0;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="w-8 text-[10px] text-atlas-text-muted">{label}</span>
                    <div className="flex-1 overflow-hidden rounded-full bg-slate-700">
                      <div
                        className="h-1.5 rounded-full bg-atlas-teal"
                        style={{ width: `${value}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-[10px] text-atlas-text-secondary">{value}%</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-atlas-text-secondary">{displayName}</p>
            <div className="space-y-2">
              {DIMENSIONS.map(({ key, label }) => {
                const value = voiceDims?.[key as keyof typeof voiceDims] ?? 0;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="w-8 text-[10px] text-atlas-text-muted">{label}</span>
                    <div className="flex-1 overflow-hidden rounded-full bg-slate-700">
                      <div
                        className="h-1.5 rounded-full bg-indigo-500"
                        style={{ width: `${value}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-[10px] text-atlas-text-secondary">{value}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Blended result */}
        <div className="mt-5 rounded-xl border border-glass-border bg-atlas-surface/20 p-4">
          <p className="mb-2 text-xs font-semibold text-atlas-text-secondary">Blended result</p>
          <div className="space-y-2">
            {DIMENSIONS.map(({ key, label }, idx) => {
              const value = blendedDims[idx];
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="w-8 text-[10px] text-atlas-text-muted">{label}</span>
                  <div className="flex-1 overflow-hidden rounded-full bg-slate-700">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-atlas-teal to-indigo-500"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-[10px] text-atlas-text-secondary">{value}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              onBlend();
            }}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
          >
            Blend This Voice
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-glass-border px-4 py-2 text-sm font-medium text-atlas-text-secondary transition-colors hover:border-atlas-teal/40 hover:text-atlas-text"
          >
            Close
          </button>
        </div>
      </div>
    </dialog>
  );
}

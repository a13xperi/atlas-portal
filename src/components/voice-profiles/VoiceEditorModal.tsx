"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Loader2, Search } from "lucide-react";
import Modal from "@/components/ui/Modal";
import BlendPreviewPanel from "@/components/voice-profiles/BlendPreviewPanel";
import VoiceDimensionSections from "@/components/voice-profiles/VoiceDimensionSections";
import { api, type TwitterFollow } from "@/lib/api";
import {
  DEFAULT_VOICE_DIMENSIONS,
  VoiceDimensionField,
  VoiceDimensions,
} from "@/lib/voice-profile-dimensions";
import type { BlendPreviewRequest } from "@/types/voice-profile-preview";

const VOICE_PRESETS: Array<{ label: string; values: VoiceDimensions }> = [
  {
    label: "CT Degen",
    values: { ...DEFAULT_VOICE_DIMENSIONS, humor: 80, formality: 20, brevity: 90, contrarianTone: 70 },
  },
  {
    label: "Research Analyst",
    values: { ...DEFAULT_VOICE_DIMENSIONS, humor: 20, formality: 80, brevity: 30, contrarianTone: 30 },
  },
  {
    label: "Balanced",
    values: { ...DEFAULT_VOICE_DIMENSIONS },
  },
];

type EditorMode = "create" | "edit-personal" | "edit-blend";
type CreateStep = "pick" | "tune";

interface VoiceEditorModalProps {
  isOpen: boolean;
  mode: EditorMode;
  initialName?: string;
  initialDimensions?: VoiceDimensions;
  previewContext?: {
    blendVoices?: BlendPreviewRequest["blend"]["voices"];
    personalHandle?: string | null;
  };
  saveDisabled?: boolean;
  saveNotice?: string;
  onSave: (name: string, dimensions: VoiceDimensions, selectedFollow: TwitterFollow | null) => Promise<void>;
  onClose: () => void;
}

function formatFollowerCount(count: number) {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }

  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }

  return `${count} followers`;
}

export default function VoiceEditorModal({
  isOpen,
  mode,
  initialName = "",
  initialDimensions,
  previewContext,
  saveDisabled = false,
  saveNotice,
  onSave,
  onClose,
}: VoiceEditorModalProps) {
  const [name, setName] = useState(initialName);
  const [dimensions, setDimensions] = useState<VoiceDimensions>(
    initialDimensions ?? DEFAULT_VOICE_DIMENSIONS
  );
  const [saving, setSaving] = useState(false);

  // Create-mode two-step state
  const [step, setStep] = useState<CreateStep>(
    mode === "create" ? "pick" : "tune"
  );
  const [follows, setFollows] = useState<TwitterFollow[]>([]);
  const [followsLoading, setFollowsLoading] = useState(false);
  const [followSearch, setFollowSearch] = useState("");
  const [selectedFollow, setSelectedFollow] = useState<TwitterFollow | null>(
    null
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setName(initialName);
    setDimensions(initialDimensions ?? DEFAULT_VOICE_DIMENSIONS);
  }, [initialDimensions, initialName, isOpen]);

  // Load follows when opening in create mode
  useEffect(() => {
    if (!isOpen || mode !== "create") {
      return;
    }

    setStep("pick");
    setSelectedFollow(null);
    setFollowSearch("");
    setFollowsLoading(true);

    api.twitter
      .follows()
      .then(({ follows: raw }) => {
        const sorted = [...raw].sort(
          (a, b) => b.followerCount - a.followerCount
        );
        setFollows(sorted);
      })
      .catch(() => {
        // Swallow: empty list will show empty state
      })
      .finally(() => setFollowsLoading(false));
  }, [isOpen, mode]);

  // Reset create-mode state on close
  useEffect(() => {
    if (!isOpen) {
      setStep(mode === "create" ? "pick" : "tune");
      setSelectedFollow(null);
      setFollowSearch("");
    }
  }, [isOpen, mode]);

  const filteredFollows = useMemo(() => {
    const query = followSearch.trim().toLowerCase();
    if (!query) {
      return follows;
    }
    return follows.filter((follow) => {
      const displayName = (follow.displayName ?? "").toLowerCase();
      const handle = (follow.handle ?? "").toLowerCase();
      return displayName.includes(query) || handle.includes(query);
    });
  }, [follows, followSearch]);

  const handleDimensionChange = (field: VoiceDimensionField, value: number) => {
    setDimensions((prev) => ({ ...prev, [field]: value }));
  };

  const handlePreset = (preset: VoiceDimensions) => {
    setDimensions(preset);
  };

  const handleSave = async () => {
    const voiceName =
      mode === "edit-personal"
        ? "Personal Voice"
        : name.trim() || "Untitled Voice";

    setSaving(true);
    try {
      await onSave(voiceName, dimensions, mode === "create" ? selectedFollow : null);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleSelectFollow = (follow: TwitterFollow) => {
    setSelectedFollow(follow);
    setName(follow.displayName || follow.handle || "Untitled Voice");
  };

  const title =
    mode === "create"
      ? "Create New Voice"
      : mode === "edit-personal"
        ? "Edit Personal Voice"
        : `Edit ${initialName || "Voice"}`;

  const description =
    mode === "create" && step === "pick"
      ? "Pick a creator from your follows to base this voice on."
      : "Configure your voice dimensions";

  const showPickStep = mode === "create" && step === "pick";
  const previewBlend = useMemo<BlendPreviewRequest["blend"] | null>(() => {
    if (showPickStep) return null;

    const personalHandle =
      previewContext?.personalHandle?.replace(/^@/, "") || "myvoice";

    if (mode === "create") {
      if (!selectedFollow?.handle) return null;
      return {
        voices: [
          { handle: personalHandle, percentage: 50 },
          { handle: selectedFollow.handle, percentage: 50 },
        ],
        dimensions,
      };
    }

    if (mode === "edit-personal") {
      return {
        voices: [{ handle: personalHandle, percentage: 100 }],
        dimensions,
      };
    }

    if (!previewContext?.blendVoices?.length) return null;
    return { voices: previewContext.blendVoices, dimensions };
  }, [dimensions, mode, previewContext, selectedFollow, showPickStep]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
    >
      {showPickStep ? (
        <div className="space-y-5">
          <div>
            <label
              htmlFor="voice-follow-search"
              className="text-[10px] font-semibold uppercase tracking-wide text-atlas-text-muted"
            >
              Search your follows
            </label>
            <div className="relative mt-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-atlas-text-muted" aria-hidden="true" />
              <input
                id="voice-follow-search"
                type="text"
                value={followSearch}
                onChange={(event) => setFollowSearch(event.target.value)}
                placeholder="Search by name or @handle"
                className="w-full rounded-lg border border-glass-border bg-atlas-bg/60 py-2 pl-9 pr-3 text-sm text-atlas-text placeholder:text-atlas-text-muted focus:border-atlas-teal focus:outline-none"
              />
            </div>
          </div>

          {followsLoading ? (
            <div className="flex items-center gap-3 py-8">
              <Loader2 className="h-5 w-5 animate-spin text-atlas-teal" />
              <p className="text-sm text-atlas-text-secondary">
                Loading your follows...
              </p>
            </div>
          ) : filteredFollows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-glass-border bg-atlas-surface/40 px-6 py-10 text-center">
              <p className="text-sm text-atlas-text-secondary">
                {followSearch.trim()
                  ? "No follows found matching your search"
                  : "No follows available yet. Connect X to load your follows."}
              </p>
            </div>
          ) : (
            <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {filteredFollows.map((follow) => {
                const isSelected = selectedFollow?.id === follow.id;
                return (
                  <li key={follow.id}>
                    <button
                      type="button"
                      aria-selected={isSelected}
                      onClick={() => handleSelectFollow(follow)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                        isSelected
                          ? "border-atlas-teal/50 bg-atlas-teal/10 ring-2 ring-atlas-teal"
                          : "border-glass-border bg-atlas-surface/40 hover:border-atlas-teal/40 hover:bg-atlas-surface/60"
                      }`}
                    >
                      {follow.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={follow.avatarUrl}
                          alt={`${follow.displayName} avatar`}
                          width={32}
                          height={32}
                          className="h-8 w-8 flex-shrink-0 rounded-full border border-glass-border object-cover"
                        />
                      ) : (
                        <div
                          aria-hidden="true"
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-atlas-teal/30 bg-atlas-teal/10 text-xs font-semibold uppercase text-atlas-teal"
                        >
                          {(follow.displayName || follow.handle || "?").charAt(
                            0
                          )}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-atlas-text">
                          {follow.displayName || follow.handle || "Unknown"}
                        </p>
                        <p className="truncate text-xs text-atlas-text-muted">
                          @{follow.handle || "unknown"} ·{" "}
                          {formatFollowerCount(follow.followerCount)}
                        </p>
                      </div>

                      {isSelected && (
                        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-atlas-teal text-atlas-bg">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-glass-border/50 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-glass-border px-4 py-2 text-sm text-atlas-text-secondary hover:text-atlas-text"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setStep("tune")}
              disabled={!selectedFollow}
              className="rounded-lg bg-gradient-to-r from-delphi-teal to-delphi-teal/60 px-6 py-2 text-sm font-semibold text-atlas-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {mode === "create" && selectedFollow && (
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-atlas-teal/30 bg-atlas-teal/10 px-3 py-1 text-xs font-semibold text-atlas-teal">
                Based on: @{selectedFollow.handle ?? ""}
              </span>
              <button
                type="button"
                onClick={() => setStep("pick")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-glass-border px-3 py-1.5 text-xs text-atlas-text-secondary transition-colors hover:border-atlas-teal/40 hover:text-atlas-text"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
            </div>
          )}

          {/* Name input (not for personal voice) */}
          {mode !== "edit-personal" && (
            <div>
              <label
                htmlFor="voice-name"
                className="text-[10px] font-semibold uppercase tracking-wide text-atlas-text-muted"
              >
                Voice Name
              </label>
              <input
                id="voice-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Shitpost Mode, Research Deep Dive"
                className="mt-1 w-full rounded-lg border border-glass-border bg-atlas-bg/60 px-3 py-2 text-sm text-atlas-text placeholder:text-atlas-text-muted focus:border-atlas-teal focus:outline-none"
              />
            </div>
          )}

          {/* Presets */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-atlas-text-muted">
              Start from a preset
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {VOICE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handlePreset(preset.values)}
                  className="rounded-full border border-glass-border px-3 py-1.5 text-xs text-atlas-text-secondary transition-colors hover:border-atlas-teal/50 hover:text-atlas-text"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dimension sliders */}
          <VoiceDimensionSections
            values={dimensions}
            interactive
            onChange={handleDimensionChange}
          />

          {previewBlend && <BlendPreviewPanel blend={previewBlend} />}

          {saveNotice && (
            <p className="rounded-2xl border border-glass-border/70 bg-atlas-surface/50 px-4 py-3 text-sm text-atlas-text-secondary">
              {saveNotice}
            </p>
          )}

          {/* Save */}
          <div className="flex items-center justify-end gap-3 border-t border-glass-border/50 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-glass-border px-4 py-2 text-sm text-atlas-text-secondary hover:text-atlas-text"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={
                saveDisabled || saving || (mode !== "edit-personal" && !name.trim())
              }
              className="rounded-lg bg-gradient-to-r from-delphi-teal to-delphi-teal/60 px-6 py-2 text-sm font-semibold text-atlas-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : mode === "create" ? "Create Voice" : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

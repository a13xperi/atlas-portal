"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import VoiceDimensionSections from "@/components/voice-profiles/VoiceDimensionSections";
import {
  DEFAULT_VOICE_DIMENSIONS,
  VoiceDimensionField,
  VoiceDimensions,
} from "@/lib/voice-profile-dimensions";

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

interface VoiceEditorModalProps {
  isOpen: boolean;
  mode: EditorMode;
  initialName?: string;
  initialDimensions?: VoiceDimensions;
  saveDisabled?: boolean;
  saveNotice?: string;
  onSave: (name: string, dimensions: VoiceDimensions) => Promise<void>;
  onClose: () => void;
}

export default function VoiceEditorModal({
  isOpen,
  mode,
  initialName = "",
  initialDimensions,
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

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setName(initialName);
    setDimensions(initialDimensions ?? DEFAULT_VOICE_DIMENSIONS);
  }, [initialDimensions, initialName, isOpen]);

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
      await onSave(voiceName, dimensions);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const title =
    mode === "create"
      ? "Create New Voice"
      : mode === "edit-personal"
        ? "Edit Personal Voice"
        : `Edit ${initialName || "Voice"}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} description="Configure your voice dimensions">
      <div className="space-y-6">
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
            className="rounded-lg bg-gradient-to-r from-delphi-teal to-delphi-teal/60 px-6 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : mode === "create" ? "Create Voice" : "Save Changes"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

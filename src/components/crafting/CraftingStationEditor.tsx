"use client";

import ContentInput from "@/components/ui/ContentInput";
import ReplyAngleSelector, {
  ReplyAngle,
} from "@/components/ui/ReplyAngleSelector";
import { Loader2 } from "lucide-react";

interface CraftingStationEditorProps {
  creating: boolean;
  contentError: string;
  error: string | null;
  onDismissError: () => void;
  onDrop: (files: FileList) => Promise<void> | void;
  onReplyAngleChange: (angle: ReplyAngle) => void;
  onTextChange: (text: string) => void;
  onTextSubmit: (text: string) => Promise<boolean | void> | boolean | void;
  onTrendingClick: () => void;
  selectedReplyAngle: ReplyAngle;
  sourceError: string;
}

export default function CraftingStationEditor({
  creating,
  contentError,
  error,
  onDismissError,
  onDrop,
  onReplyAngleChange,
  onTextChange,
  onTextSubmit,
  onTrendingClick,
  selectedReplyAngle,
  sourceError,
}: CraftingStationEditorProps) {
  return (
    <div className="mt-6">
      <label className="text-xs text-atlas-text-secondary uppercase tracking-wide">
        Feed Atlas content — it crafts the tweet in your voice.
      </label>
      <div className="mt-3 space-y-3">
        <ReplyAngleSelector
          selectedAngle={selectedReplyAngle}
          onAngleChange={onReplyAngleChange}
        />
        <ContentInput
          contentError={contentError}
          onDrop={onDrop}
          onTextChange={onTextChange}
          onTextSubmit={onTextSubmit}
          onTrendingClick={onTrendingClick}
          sourceError={sourceError}
        />
        {creating && (
          <div className="flex items-center gap-2 mt-2 text-atlas-teal text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Crafting your tweet…
          </div>
        )}
        {error && (
          <div className="flex items-center justify-between mt-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            <span>{error}</span>
            <button
              type="button"
              onClick={onDismissError}
              className="ml-2 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

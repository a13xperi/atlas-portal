"use client";

import { useEffect } from "react";
import { X, Heart } from "lucide-react";

interface SwipeActionsProps {
  onSkip: () => void;
  onLike: () => void;
  disabled: boolean;
}

export default function SwipeActions({ onSkip, onLike, disabled }: SwipeActionsProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (disabled) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onSkip();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onLike();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [disabled, onSkip, onLike]);

  return (
    <div className="flex items-center justify-center gap-6">
      <button
        type="button"
        onClick={onSkip}
        disabled={disabled}
        aria-label="Skip tweet"
        className="flex h-14 w-14 items-center justify-center rounded-full border border-glass-border bg-atlas-surface text-red-400 transition-all hover:border-red-400/50 hover:bg-red-400/10 hover:scale-110 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
      >
        <X className="h-6 w-6" />
      </button>

      <button
        type="button"
        onClick={onLike}
        disabled={disabled}
        aria-label="Like tweet"
        className="flex h-14 w-14 items-center justify-center rounded-full border border-glass-border bg-atlas-surface text-green-400 transition-all hover:border-green-400/50 hover:bg-green-400/10 hover:scale-110 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
      >
        <Heart className="h-6 w-6" />
      </button>
    </div>
  );
}

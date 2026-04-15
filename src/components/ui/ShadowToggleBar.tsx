"use client";

import { useShadowMode, SHADOW_SECTIONS, type ShadowSectionKey } from "@/lib/shadow-mode";
import { Eye, EyeOff } from "lucide-react";

const LABELS: Record<ShadowSectionKey, string> = {
  "voice-tinder": "Voice Tinder",
  "voice-library-v2": "Voice Library V2",
  "crafting-selector": "Crafting Selector",
};

export default function ShadowToggleBar() {
  const { isAdmin, allSections, toggleSection } = useShadowMode();

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-56 rounded-xl border border-glass-border bg-atlas-nav/95 p-3 shadow-lg backdrop-blur-xl">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-atlas-text-secondary">
          Shadow Mode
        </span>
        <span className="rounded-full bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
          ADMIN
        </span>
      </div>
      <div className="space-y-2">
        {(Object.keys(SHADOW_SECTIONS) as ShadowSectionKey[]).map((key) => {
          const shadowed = allSections[key] ?? false;
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleSection(key)}
              className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left transition hover:bg-atlas-surface/60"
              aria-pressed={shadowed}
            >
              <span className="text-xs text-atlas-text">{LABELS[key]}</span>
              <span className="flex items-center gap-1.5">
                {shadowed ? (
                  <>
                    <EyeOff className="h-3 w-3 text-amber-300" aria-hidden="true" />
                    <span className="text-[10px] font-medium text-amber-300">Hidden</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3 text-atlas-teal" aria-hidden="true" />
                    <span className="text-[10px] font-medium text-atlas-teal">Live</span>
                  </>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

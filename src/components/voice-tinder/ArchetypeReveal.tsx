"use client";

import { Sparkles, ArrowRight } from "lucide-react";
import { type VoiceArchetype } from "@/lib/api";

interface ArchetypeRevealProps {
  archetype: VoiceArchetype;
  onContinue: () => void;
}

export default function ArchetypeReveal({ archetype, onContinue }: ArchetypeRevealProps) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-glass-border bg-atlas-surface p-8 shadow-xl">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-atlas-teal/15">
          <Sparkles className="h-8 w-8 text-atlas-teal" />
        </div>
        <h2 className="mt-6 font-heading text-2xl font-semibold text-atlas-text">
          {archetype.label}
        </h2>
        <p className="mt-2 text-atlas-teal">{archetype.oneLiner}</p>
      </div>

      <p className="mt-6 text-center text-sm leading-relaxed text-atlas-text-secondary">
        {archetype.description}
      </p>

      {archetype.themes.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-atlas-text-muted">
            Key Traits
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {archetype.themes.map((theme) => (
              <span
                key={theme}
                className="rounded-full bg-atlas-nav px-3 py-1 text-xs text-atlas-text"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>
      )}

      {archetype.signatures.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-atlas-text-muted">
            Example Voices
          </h3>
          <ul className="mt-3 space-y-2">
            {archetype.signatures.map((sig) => (
              <li
                key={sig}
                className="flex items-start gap-3 rounded-lg bg-atlas-nav/50 px-3 py-2 text-sm text-atlas-text-secondary"
              >
                <span className="mt-1 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-atlas-teal" />
                <span>{sig}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 text-center">
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex items-center gap-2 rounded-lg bg-atlas-teal px-6 py-3 text-sm font-semibold text-atlas-nav transition hover:bg-atlas-teal/90"
        >
          Continue to Crafting
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

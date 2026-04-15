"use client";

import { motion } from "framer-motion";
import { Sparkles, CheckCircle2, XCircle, Lightbulb } from "lucide-react";
import type { VoiceArchetype } from "@/lib/api";

interface ArchetypeRevealProps {
  archetype: VoiceArchetype;
  onContinue?: () => void;
}

export default function ArchetypeReveal({
  archetype,
  onContinue,
}: ArchetypeRevealProps) {
  return (
    <div className="space-y-5">
      {/* Header card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-atlas-teal/30 bg-atlas-teal/10 p-6 text-center"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-atlas-teal/20">
          <Sparkles className="h-6 w-6 text-atlas-teal" />
        </div>
        <h2 className="mt-4 font-heading text-2xl font-bold text-atlas-text">
          {archetype.label}
        </h2>
        <p className="mt-1 text-sm text-atlas-teal font-medium">
          {archetype.oneLiner}
        </p>
        <p className="mt-3 text-sm text-atlas-text-secondary">
          {archetype.description}
        </p>
        <p className="mt-2 text-xs text-atlas-text-muted">
          Derived from {archetype.derivedFrom} swipes
        </p>
      </motion.div>

      {/* Themes */}
      {archetype.themes.length > 0 && (
        <div className="rounded-2xl border border-glass-border bg-atlas-surface p-5">
          <div className="flex items-center gap-2 text-atlas-text">
            <Lightbulb className="h-4 w-4 text-atlas-teal" />
            <span className="text-sm font-semibold">Themes</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {archetype.themes.map((theme) => (
              <span
                key={theme}
                className="rounded-full border border-glass-border bg-atlas-bg px-3 py-1 text-xs text-atlas-text-secondary"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Signatures & Avoids */}
      <div className="grid gap-4 sm:grid-cols-2">
        {archetype.signatures.length > 0 && (
          <div className="rounded-2xl border border-glass-border bg-atlas-surface p-5">
            <div className="flex items-center gap-2 text-atlas-text">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <span className="text-sm font-semibold">Your signatures</span>
            </div>
            <ul className="mt-3 space-y-2">
              {archetype.signatures.map((s) => (
                <li key={s} className="text-xs text-atlas-text-secondary">
                  • {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {archetype.avoids.length > 0 && (
          <div className="rounded-2xl border border-glass-border bg-atlas-surface p-5">
            <div className="flex items-center gap-2 text-atlas-text">
              <XCircle className="h-4 w-4 text-atlas-error" />
              <span className="text-sm font-semibold">What you avoid</span>
            </div>
            <ul className="mt-3 space-y-2">
              {archetype.avoids.map((a) => (
                <li key={a} className="text-xs text-atlas-text-secondary">
                  • {a}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {onContinue && (
        <button
          type="button"
          onClick={onContinue}
          className="w-full rounded-xl bg-gradient-to-r from-delphi-teal to-delphi-teal/60 px-6 py-3 text-sm font-semibold text-atlas-bg transition-opacity hover:opacity-90"
        >
          Continue
        </button>
      )}
    </div>
  );
}

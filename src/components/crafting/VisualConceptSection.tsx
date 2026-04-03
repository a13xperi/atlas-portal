"use client";

import { Image as ImageIcon, Loader2, Palette } from "lucide-react";
import { GeneratedImage } from "@/lib/api";

interface VisualConceptSectionProps {
  generatingImage: boolean;
  onGenerateVisual: (style?: string) => Promise<void> | void;
  visualConcept: GeneratedImage | null;
}

export default function VisualConceptSection({
  generatingImage,
  onGenerateVisual,
  visualConcept,
}: VisualConceptSectionProps) {
  return (
    <div className="mt-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => void onGenerateVisual("quote_card")}
          disabled={generatingImage}
          className="flex items-center justify-center gap-2 rounded-lg border border-glass-border bg-atlas-surface px-4 py-2 text-sm text-atlas-text-secondary transition-colors hover:border-atlas-teal hover:text-atlas-teal disabled:opacity-50"
        >
          {generatingImage ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Palette className="h-4 w-4" />
          )}
          {generatingImage ? "Generating…" : "Generate visual"}
        </button>
        <select
          aria-label="Visual style"
          onChange={(event) => void onGenerateVisual(event.target.value)}
          disabled={generatingImage}
          className="w-full rounded-lg border border-glass-border bg-atlas-surface px-2 py-2 text-xs text-atlas-text-secondary focus:border-atlas-teal focus:outline-none sm:w-auto"
        >
          <option value="">Style…</option>
          <option value="infographic">Infographic</option>
          <option value="quote_card">Quote Card</option>
          <option value="thumbnail">Thumbnail</option>
        </select>
      </div>

      {visualConcept?.concept ? (
        <div className="mt-3 rounded-2xl border border-glass-border bg-atlas-nav p-4">
          <div className="mb-2 flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-atlas-teal" />
            <span className="text-xs uppercase tracking-wide text-atlas-teal">
              Visual Concept
            </span>
          </div>
          <p className="text-sm text-atlas-text">{visualConcept.concept.concept}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-atlas-text-secondary">Colors:</span>
            {visualConcept.concept.colorScheme?.map((color, index) => (
              <div
                key={index}
                className="h-5 w-5 rounded-full border border-glass-border"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          <p className="mt-1 text-xs text-atlas-text-secondary">
            Layout: {visualConcept.concept.layout}
          </p>
        </div>
      ) : null}
    </div>
  );
}

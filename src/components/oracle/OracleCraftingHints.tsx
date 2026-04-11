"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { api } from "@/lib/api";

interface OracleCraftingHintsProps {
  draftContent: string;
}

type Hint = { id: string; text: string };

export default function OracleCraftingHints({ draftContent }: OracleCraftingHintsProps) {
  const [hints, setHints] = useState<Hint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastContentRef = useRef("");

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const trimmed = draftContent.trim();
    if (trimmed.length < 50 || trimmed === lastContentRef.current) return;

    timerRef.current = setTimeout(async () => {
      lastContentRef.current = trimmed;
      setLoading(true);
      setError(null);
      try {
        const response = await api.oracle.chat({
          page: "crafting",
          messages: [
            {
              role: "user",
              content: `Review this tweet draft and give exactly 2 short, specific improvement suggestions. Each suggestion should be one sentence. Format: numbered list. Draft: "${trimmed}"`,
            },
          ],
        });
        // Parse numbered list into hint items
        const lines = response.text
          .split(/\n/)
          .map((l) => l.replace(/^\d+[.)]\s*/, "").trim())
          .filter((l) => l.length > 10);
        setHints(lines.slice(0, 2).map((text, i) => ({ id: String(i), text })));
      } catch {
        setError("Couldn't generate suggestions right now.");
      } finally {
        setLoading(false);
      }
    }, 5000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [draftContent]);

  if (!draftContent.trim() || draftContent.trim().length < 50) return null;

  return (
    <div className="mt-4 rounded-xl border border-atlas-teal/20 bg-atlas-teal/5 p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-atlas-teal" aria-hidden="true" />
        <span className="text-xs font-semibold uppercase tracking-wider text-atlas-teal">
          Oracle Suggestions
        </span>
        {loading && (
          <span
            className="ml-1 inline-block h-3 w-3 animate-spin rounded-full border-2 border-atlas-teal border-t-transparent"
            aria-hidden="true"
          />
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs text-atlas-text-muted">{error}</p>
      )}

      {!loading && hints.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {hints.map((hint, idx) => (
            <li key={hint.id} className="flex gap-2 text-xs text-atlas-text-secondary">
              <span className="mt-0.5 flex-shrink-0 font-mono text-atlas-teal">{idx + 1}.</span>
              <span>{hint.text}</span>
            </li>
          ))}
        </ul>
      )}

      {!loading && hints.length === 0 && !error && (
        <p className="mt-2 text-xs text-atlas-text-muted">
          Analyzing your draft…
        </p>
      )}
    </div>
  );
}

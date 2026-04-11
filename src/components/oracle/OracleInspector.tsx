"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { useOracleAgent } from "@/lib/oracle-agent";
import type { InspectableEntity } from "@/lib/oracle-agent-types";

interface OracleInspectorProps {
  /**
   * The entity Oracle should narrate. When the entity id changes the
   * Inspector re-narrates; otherwise it sits quiet. Pass `null` to hide
   * the Inspector (e.g. when nothing is selected).
   */
  entity: InspectableEntity | null;
  /**
   * Optional extra class names applied to the outer container so the
   * parent page can position the line flush with the surrounding card.
   */
  className?: string;
}

/**
 * OracleInspector — inline ambient narration about the selected entity.
 *
 * Shows a single "thinking" line from Oracle the moment the user touches
 * something (clicks a draft, hovers a queue row). The narration is
 * generated locally via `oracle-agent.narrate()` so it stays fast and
 * demo-safe even when the backend agent endpoint is cold. The same call
 * also writes an ambient entry to the shared Oracle transcript so
 * FloatingOracle stays in sync.
 *
 * Human-first framing: the line speaks in concrete outcomes, uses real
 * names over handles, and never leaks raw scores or status enums.
 */
export default function OracleInspector({
  entity,
  className = "",
}: OracleInspectorProps) {
  const { narrate } = useOracleAgent();
  const [line, setLine] = useState<string | null>(null);
  const lastNarratedRef = useRef<string | null>(null);

  // A stable fingerprint of the entity so we only re-narrate on real
  // transitions (draft id flip, status change, score change) — not on
  // every parent render.
  const fingerprint = useMemo(() => {
    if (!entity) return null;
    const meta = entity.meta ?? {};
    const keys = [
      entity.type,
      entity.id,
      meta.status ?? "",
      meta.score ?? "",
      meta.wordCount ?? "",
    ];
    return keys.join("|");
  }, [entity]);

  useEffect(() => {
    if (!entity || !fingerprint) {
      setLine(null);
      lastNarratedRef.current = null;
      return;
    }

    // Skip duplicate narrations for the same fingerprint so the line
    // doesn't flicker when the parent re-renders with identical data.
    if (lastNarratedRef.current === fingerprint) return;
    lastNarratedRef.current = fingerprint;

    // Fire-and-forget. narrate() resolves with the synthesized text so
    // we can render it inline without waiting on the backend.
    try {
      const text = narrate("inspect", entity);
      setLine(text);
    } catch {
      // If the context isn't mounted (tests, storybook) fall back to a
      // friendly placeholder so the Inspector never blows up the page.
      setLine("Looking at this one…");
    }
  }, [entity, fingerprint, narrate]);

  if (!entity || !line) return null;

  return (
    <div
      data-testid="oracle-inspector"
      data-entity-type={entity.type}
      data-entity-id={entity.id}
      className={`flex items-start gap-2 rounded-xl border border-atlas-teal/20 bg-atlas-teal/5 px-3 py-2 ${className}`}
      aria-live="polite"
    >
      <Sparkles
        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-atlas-teal"
        aria-hidden="true"
      />
      <p className="text-xs italic leading-snug text-atlas-text-secondary">
        <span className="font-medium text-atlas-teal not-italic">Oracle:</span>{" "}
        {line}
      </p>
    </div>
  );
}

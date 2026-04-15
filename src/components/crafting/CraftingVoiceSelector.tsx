"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface CraftingVoiceSelectorProps {
  onSelect: (referenceId: string | null) => void;
  selectedId: string | null;
}

export default function CraftingVoiceSelector({
  onSelect,
  selectedId,
}: CraftingVoiceSelectorProps) {
  const [references, setReferences] = useState<
    Array<{ handle: string; status: "ACTIVE" | "PENDING" }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const session = await api.voiceTinder.getSession();
        if (!mounted) return;
        setReferences(session.references ?? []);
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-wrap gap-2">
        <div className="h-8 w-24 animate-pulse rounded-full bg-atlas-surface" />
        <div className="h-8 w-24 animate-pulse rounded-full bg-atlas-surface" />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
          selectedId === null
            ? "border-atlas-teal bg-atlas-teal/10 text-atlas-teal"
            : "border-glass-border text-atlas-text-muted hover:border-atlas-text-muted"
        }`}
      >
        My Voice
      </button>
      {references.map((ref) => (
        <button
          key={ref.handle}
          type="button"
          onClick={() => onSelect(ref.handle)}
          disabled={ref.status !== "ACTIVE"}
          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
            selectedId === ref.handle
              ? "border-atlas-teal bg-atlas-teal/10 text-atlas-teal"
              : ref.status === "ACTIVE"
                ? "border-glass-border text-atlas-text-muted hover:border-atlas-text-muted"
                : "border-glass-border/50 text-atlas-text-muted/50 cursor-not-allowed"
          }`}
        >
          @{ref.handle}
          {ref.status !== "ACTIVE" && (
            <span className="text-[10px] uppercase">Pending</span>
          )}
        </button>
      ))}
    </div>
  );
}

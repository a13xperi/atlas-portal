"use client";

import { useShadowMode, type ShadowSectionKey } from "@/lib/shadow-mode";

interface ShadowGateProps {
  sectionKey: ShadowSectionKey;
  children: React.ReactNode;
}

export default function ShadowGate({ sectionKey, children }: ShadowGateProps) {
  const { isAdmin, isShadowed, toggleSection } = useShadowMode();
  const shadowed = isShadowed(sectionKey);

  if (shadowed && !isAdmin) {
    return null;
  }

  if (shadowed && isAdmin) {
    return (
      <div className="relative rounded-2xl border-2 border-dashed border-amber-400/40">
        <div className="absolute inset-0 rounded-2xl bg-amber-400/5 pointer-events-none" />
        <button
          type="button"
          onClick={() => toggleSection(sectionKey)}
          className="absolute top-2 right-2 z-10 inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300 backdrop-blur-sm transition hover:bg-amber-400/30"
          aria-label={`Toggle shadow mode for ${sectionKey}`}
          title="Click to make this section live for all users"
        >
          Shadow
        </button>
        <div className="relative">{children}</div>
      </div>
    );
  }

  return <>{children}</>;
}

"use client";

import { FlaskConical } from "lucide-react";
import { useDemoMode } from "@/lib/demo-mode";

export default function DemoModeToggle() {
  const { isDemoMode, toggleDemoMode } = useDemoMode();

  return (
    <button
      type="button"
      onClick={toggleDemoMode}
      aria-label={isDemoMode ? "Switch to live data" : "Switch to demo data"}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition-all duration-200 ${
        isDemoMode
          ? "bg-atlas-teal/15 text-atlas-teal border border-atlas-teal/30 hover:bg-atlas-teal/25"
          : "bg-atlas-surface/60 text-atlas-text-muted border border-glass-border hover:text-atlas-text-secondary hover:border-atlas-text-muted/30"
      }`}
    >
      <FlaskConical
        className={`h-3 w-3 transition-transform duration-200 ${isDemoMode ? "scale-110" : "scale-100"}`}
        aria-hidden="true"
      />
      {isDemoMode ? "DEMO" : "LIVE"}
    </button>
  );
}

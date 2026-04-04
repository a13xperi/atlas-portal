"use client";

import { GraduationCap } from "lucide-react";
import { useTour } from "./TourProvider";

export default function TourToggle() {
  const { active, startTour } = useTour();

  return (
    <button
      type="button"
      onClick={startTour}
      aria-label={active ? "Tour in progress" : "Start guided tour"}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition-all duration-200 ${
        active
          ? "bg-atlas-warning/15 text-atlas-warning border border-atlas-warning/30 hover:bg-atlas-warning/25"
          : "bg-atlas-surface/60 text-atlas-text-muted border border-glass-border hover:text-atlas-text-secondary hover:border-atlas-text-muted/30"
      }`}
    >
      <GraduationCap
        className={`h-3 w-3 transition-transform duration-200 ${active ? "scale-110" : "scale-100"}`}
        aria-hidden="true"
      />
      {active ? "TOURING" : "TOUR"}
    </button>
  );
}

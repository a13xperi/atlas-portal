"use client";

import FeatureGate from "@/components/ui/FeatureGate";

export default function StyleTilePage() {
  return (
    <FeatureGate flagKey="super_admin">
      <iframe
        src="/style-tile.html"
        className="fixed inset-0 w-full h-full border-0"
        title="Delphi Digital + Atlas — Unified Design System"
      />
    </FeatureGate>
  );
}

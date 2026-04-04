"use client";

import { useEffect, useState } from "react";

type HintStyle = "pulse" | "glow" | "bounce";

interface DiscoveryHintProps {
  /** localStorage key — hint disappears once this key is set */
  discoveryKey: string;
  /** Visual style of the hint */
  style?: HintStyle;
  children: React.ReactNode;
}

/**
 * Wraps a UI element with a subtle discovery indicator (pulsing border,
 * glow, or bounce) until the user interacts with it. Interaction is
 * detected via click — sets a localStorage flag and the hint disappears.
 */
export default function DiscoveryHint({
  discoveryKey,
  style = "pulse",
  children,
}: DiscoveryHintProps) {
  const [discovered, setDiscovered] = useState(true); // default true to avoid flash

  useEffect(() => {
    const val = localStorage.getItem(`atlas_discovered_${discoveryKey}`);
    if (!val) setDiscovered(false);
  }, [discoveryKey]);

  const markDiscovered = () => {
    localStorage.setItem(`atlas_discovered_${discoveryKey}`, "1");
    setDiscovered(true);
  };

  if (discovered) return <>{children}</>;

  const hintClass =
    style === "pulse"
      ? "ring-2 ring-atlas-teal/30 animate-[pulse-ring_2s_ease-in-out_infinite]"
      : style === "glow"
        ? "shadow-[0_0_12px_rgba(56,224,187,0.2)] animate-[glow_2s_ease-in-out_infinite]"
        : "animate-[subtle-bounce_3s_ease-in-out_infinite]";

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      className={`relative rounded-2xl transition-all ${hintClass}`}
      onClick={markDiscovered}
    >
      {children}
      <style jsx>{`
        @keyframes pulse-ring {
          0%, 100% { box-shadow: 0 0 0 0 rgba(56, 224, 187, 0.25); }
          50% { box-shadow: 0 0 0 6px rgba(56, 224, 187, 0); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 8px rgba(56, 224, 187, 0.15); }
          50% { box-shadow: 0 0 16px rgba(56, 224, 187, 0.3); }
        }
        @keyframes subtle-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
}

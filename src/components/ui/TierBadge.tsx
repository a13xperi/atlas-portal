"use client";

import type { TierConfig } from "@/lib/atlas-score";

interface TierBadgeProps {
  tier: TierConfig;
  children: React.ReactNode;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export default function TierBadge({
  tier,
  children,
  showLabel = false,
  size = "md",
}: TierBadgeProps) {
  const ringSize = size === "sm" ? "ring-1" : "ring-2";

  return (
    <div className="relative inline-flex flex-col items-center gap-1">
      <div className={`rounded-full ${ringSize} ${tier.borderColor}`}>
        {children}
      </div>
      {showLabel && (
        <span
          className={`text-[10px] font-semibold uppercase tracking-wider ${tier.color}`}
        >
          {tier.name}
        </span>
      )}
    </div>
  );
}

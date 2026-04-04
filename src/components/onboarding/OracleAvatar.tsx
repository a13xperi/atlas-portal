"use client";

import { Sparkles } from "lucide-react";

interface OracleAvatarProps {
  size?: number;
}

export default function OracleAvatar({ size = 48 }: OracleAvatarProps) {
  return (
    <div
      className="shrink-0 rounded-full bg-gradient-to-br from-atlas-teal/20 to-atlas-surface border border-atlas-teal/30 flex items-center justify-center shadow-[0_0_12px_rgba(78,205,196,0.15)]"
      style={{ width: size, height: size }}
    >
      <Sparkles className="text-atlas-teal" style={{ width: size * 0.45, height: size * 0.45 }} />
    </div>
  );
}

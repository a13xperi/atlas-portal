"use client";

import Image from "next/image";

interface OracleAvatarProps {
  size?: number;
}

export default function OracleAvatar({ size = 48 }: OracleAvatarProps) {
  return (
    <div
      className="shrink-0 rounded-full overflow-hidden border border-atlas-teal/30 shadow-[0_0_12px_rgba(78,205,196,0.15)]"
      style={{ width: size, height: size }}
    >
      <Image
        src="/images/oracle-avatar.jpg"
        alt="The Oracle"
        width={size}
        height={size}
        className="object-cover"
      />
    </div>
  );
}

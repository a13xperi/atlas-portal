"use client";

import Image from "next/image";
import { useState } from "react";

interface OracleAvatarProps {
  size?: "sm" | "md";
}

export default function OracleAvatar({ size = "md" }: OracleAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const px = size === "sm" ? 32 : 48;

  return (
    <div
      className="shrink-0 rounded-full overflow-hidden ring-2 ring-atlas-teal/40 shadow-[0_0_12px_rgba(78,205,196,0.3)]"
      style={{ width: px, height: px }}
    >
      {imgError ? (
        <div className="flex h-full w-full items-center justify-center bg-atlas-surface text-atlas-teal text-lg font-bold">
          O
        </div>
      ) : (
        <Image
          src="/images/oracle-avatar.png"
          alt="The Oracle"
          width={px}
          height={px}
          className="object-cover"
          onError={() => setImgError(true)}
        />
      )}
    </div>
  );
}

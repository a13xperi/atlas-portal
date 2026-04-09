"use client";

import { useFeatureFlags } from "@/lib/feature-flags";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface FeatureGateProps {
  flagKey: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function FeatureGate({ flagKey, children, fallback }: FeatureGateProps) {
  const { isEnabled, loading } = useFeatureFlags();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isEnabled(flagKey)) {
      router.replace("/dashboard");
    }
  }, [loading, isEnabled, flagKey, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-pulse text-sm text-atlas-text-secondary">Loading...</div>
      </div>
    );
  }

  if (!isEnabled(flagKey)) {
    return fallback ?? null;
  }

  return <>{children}</>;
}

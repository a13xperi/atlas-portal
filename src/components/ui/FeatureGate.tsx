"use client";

import { useFeatureFlags } from "@/lib/feature-flags";
import * as nav from "next/navigation";
import { useEffect } from "react";

interface FeatureGateProps {
  flagKey: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// Safe useRouter — returns null when no app router is mounted (e.g. unit tests).
function useSafeRouter() {
  try {
    return nav.useRouter();
  } catch {
    return null;
  }
}

export default function FeatureGate({ flagKey, children, fallback }: FeatureGateProps) {
  const { isEnabled, loading } = useFeatureFlags();
  const router = useSafeRouter();

  useEffect(() => {
    if (!loading && !isEnabled(flagKey) && router) {
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

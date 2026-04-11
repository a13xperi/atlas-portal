"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Deep-link entry point for the Hand-Crafted onboarding path. Stores the
 * pre-selected track in sessionStorage so OracleChat can skip the X-first
 * prompt and go straight to manual style selection, then redirects to
 * /onboarding where the chat UI lives.
 */
export default function TrackBStarter() {
  const router = useRouter();

  useEffect(() => {
    try {
      sessionStorage.setItem("atlas_preselected_track", "b");
    } catch {
      /* storage unavailable — OracleChat handles the fallback path */
    }
    router.replace("/onboarding");
  }, [router]);

  return null;
}

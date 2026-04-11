"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Deep-link entry point for the X-Powered onboarding path. Stores the
 * pre-selected track in sessionStorage so OracleChat can auto-advance
 * past the welcome/skip prompt, then redirects to /onboarding where
 * the chat UI lives.
 */
export default function TrackAStarter() {
  const router = useRouter();

  useEffect(() => {
    try {
      sessionStorage.setItem("atlas_preselected_track", "a");
    } catch {
      /* storage unavailable — OracleChat handles the fallback path */
    }
    router.replace("/onboarding");
  }, [router]);

  return null;
}

"use client";

import { useEffect, useRef } from "react";
import { usePostHog } from "@posthog/react";
import { useAuth } from "@/lib/auth";
import { posthogEnabled } from "@/lib/posthog";

export default function PostHogUserIdentifier() {
  const posthog = usePostHog();
  const { user, loading } = useAuth();
  const lastIdentifiedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!posthogEnabled || loading) {
      return;
    }

    if (!user) {
      if (lastIdentifiedUserId.current !== null) {
        posthog.reset();
        lastIdentifiedUserId.current = null;
      }
      return;
    }

    if (lastIdentifiedUserId.current && lastIdentifiedUserId.current !== user.id) {
      posthog.reset();
    }

    posthog.identify(user.id, {
      handle: user.handle,
      role: user.role,
      ...(user.email ? { email: user.email } : {}),
      ...(user.displayName ? { display_name: user.displayName } : {}),
      ...(user.onboardingTrack ? { onboarding_track: user.onboardingTrack } : {}),
    });

    lastIdentifiedUserId.current = user.id;
  }, [loading, posthog, user]);

  return null;
}

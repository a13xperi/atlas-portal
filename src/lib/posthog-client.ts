"use client";

import posthog from "posthog-js";
import { env } from "@/lib/env";
import { posthogEnabled, posthogOptions } from "@/lib/posthog";

if (typeof window !== "undefined" && posthogEnabled && env.posthogKey && !posthog.__loaded) {
  posthog.init(env.posthogKey, posthogOptions);
}

export function getPostHogClient() {
  return posthogEnabled && posthog.__loaded ? posthog : null;
}

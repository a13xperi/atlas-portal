import type { PostHogConfig } from "posthog-js";
import { env } from "@/lib/env";

export const posthogEnabled = Boolean(env.posthogKey);

export const posthogOptions: Partial<PostHogConfig> = {
  ...(env.posthogHost ? { api_host: env.posthogHost } : {}),
  defaults: "2026-01-30",
  capture_pageview: "history_change",
  capture_pageleave: "if_capture_pageview",
  person_profiles: "identified_only",
  loaded: (client) => {
    if (process.env.NODE_ENV === "development") {
      client.debug();
    }
  },
};

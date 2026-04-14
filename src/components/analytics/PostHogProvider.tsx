"use client";

import { PostHogProvider as PostHogReactProvider } from "@posthog/react";
import { getPostHogClient } from "@/lib/posthog-client";

export default function PostHogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const client = getPostHogClient();

  if (!client) {
    return <>{children}</>;
  }

  return <PostHogReactProvider client={client}>{children}</PostHogReactProvider>;
}

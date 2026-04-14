import * as Sentry from "@sentry/nextjs";
import { getClientSentryConfig } from "./src/lib/sentry";

Sentry.init(getClientSentryConfig());

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

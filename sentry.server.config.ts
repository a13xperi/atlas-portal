import * as Sentry from "@sentry/nextjs";
import { getServerSentryConfig } from "./src/lib/sentry";

Sentry.init(getServerSentryConfig());

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://f04e2c13f5b132f738c1c0dd51d55a4d@o4511146712825856.ingest.us.sentry.io/4511146729275392",
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});

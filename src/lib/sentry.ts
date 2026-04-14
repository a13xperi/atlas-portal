import * as Sentry from "@sentry/nextjs";
import type { User } from "./api";

const DEFAULT_PRODUCTION_TRACE_RATE = 0.2;
const DEFAULT_DEVELOPMENT_TRACE_RATE = 1.0;
const DEFAULT_PRODUCTION_REPLAY_RATE = 0.05;
const DEFAULT_DEVELOPMENT_REPLAY_RATE = 0;
const DEFAULT_REPLAY_ON_ERROR_RATE = 1.0;

function getEnvironment() {
  return (
    process.env.NEXT_PUBLIC_VERCEL_ENV ??
    process.env.VERCEL_ENV ??
    process.env.NODE_ENV ??
    "development"
  );
}

function parseSampleRate(
  key: string,
  fallback: number,
) {
  const raw = process.env[key];

  if (!raw || raw.trim() === "") {
    return fallback;
  }

  const parsed = Number(raw);
  if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 1) {
    return parsed;
  }

  console.warn(
    `[Atlas] Ignoring invalid ${key} value "${raw}". Expected a number between 0 and 1.`,
  );
  return fallback;
}

function isDevelopment() {
  return process.env.NODE_ENV === "development";
}

function getCommonConfig() {
  return {
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
    environment: getEnvironment(),
    sendDefaultPii: true,
    tracesSampleRate: parseSampleRate(
      "NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE",
      isDevelopment() ? DEFAULT_DEVELOPMENT_TRACE_RATE : DEFAULT_PRODUCTION_TRACE_RATE,
    ),
  };
}

export function getClientSentryConfig() {
  return {
    ...getCommonConfig(),
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        maskAllInputs: true,
        blockAllMedia: true,
      }),
    ],
    replaysSessionSampleRate: parseSampleRate(
      "NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE",
      isDevelopment() ? DEFAULT_DEVELOPMENT_REPLAY_RATE : DEFAULT_PRODUCTION_REPLAY_RATE,
    ),
    replaysOnErrorSampleRate: parseSampleRate(
      "NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE",
      DEFAULT_REPLAY_ON_ERROR_RATE,
    ),
  };
}

export function getServerSentryConfig() {
  return getCommonConfig();
}

type SentryUser = Pick<User, "email" | "handle" | "id" | "onboardingTrack" | "role">;

export function syncSentryUser(user: SentryUser | null | undefined) {
  if (!user) {
    Sentry.setUser(null);
    Sentry.setTag("user_role", "anonymous");
    Sentry.setTag("onboarding_track", "none");
    return;
  }

  Sentry.setUser({
    id: user.id,
    username: user.handle,
    email: user.email,
  });
  Sentry.setTag("user_role", user.role.toLowerCase());
  Sentry.setTag("onboarding_track", user.onboardingTrack ?? "none");
}

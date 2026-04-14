import { registerOTel } from "@vercel/otel";

const DEFAULT_OTEL_SERVICE_NAME = "atlas-portal-frontend";

function getPropagationTargets() {
  return [process.env.NEXT_PUBLIC_API_URL].flatMap((value) => {
    const normalized = value?.trim();
    return normalized ? [normalized] : [];
  });
}

export async function register() {
  const propagationTargets = getPropagationTargets();

  registerOTel({
    serviceName: process.env.OTEL_SERVICE_NAME?.trim() || DEFAULT_OTEL_SERVICE_NAME,
    instrumentationConfig:
      propagationTargets.length > 0
        ? {
            fetch: {
              propagateContextUrls: propagationTargets,
            },
          }
        : undefined,
  });

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = async (
  ...args: Parameters<NonNullable<typeof import("@sentry/nextjs").captureRequestError>>
) => {
  const { captureRequestError } = await import("@sentry/nextjs");
  captureRequestError(...args);
};

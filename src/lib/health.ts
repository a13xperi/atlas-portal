const SERVICE_NAME = "atlas-portal";
const READY_TIMEOUT_MS = 5000;

type HealthState = "ok" | "error";

type BackendHealthPayload = Record<string, unknown> & {
  status?: string;
};

export type HealthResponsePayload = {
  service: string;
  status: HealthState;
  timestamp: string;
  environment: string;
  version: string | null;
  uptimeSeconds: number;
};

export type ReadinessResponsePayload = HealthResponsePayload & {
  checks: {
    app: {
      status: "ok";
    };
    backend: {
      status: HealthState;
      url: string | null;
      responseTimeMs?: number;
      httpStatus?: number;
      details?: BackendHealthPayload;
      error?: string;
    };
  };
};

function getBasePayload(now = new Date()): HealthResponsePayload {
  return {
    service: SERVICE_NAME,
    status: "ok",
    timestamp: now.toISOString(),
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    version: process.env.npm_package_version ?? null,
    uptimeSeconds: Math.round(process.uptime()),
  };
}

function getResponseHeaders(): HeadersInit {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  };
}

export function createJsonResponse(payload: HealthResponsePayload | ReadinessResponsePayload, status = 200) {
  return Response.json(payload, {
    status,
    headers: getResponseHeaders(),
  });
}

export function createHeadResponse(status = 200) {
  return new Response(null, {
    status,
    headers: getResponseHeaders(),
  });
}

export function getLivenessPayload(): HealthResponsePayload {
  return getBasePayload();
}

function createBackendErrorPayload(
  base: HealthResponsePayload,
  url: string | null,
  error: string,
  responseTimeMs?: number,
  httpStatus?: number,
): ReadinessResponsePayload {
  return {
    ...base,
    status: "error",
    checks: {
      app: { status: "ok" },
      backend: {
        status: "error",
        url,
        responseTimeMs,
        httpStatus,
        error,
      },
    },
  };
}

function getBackendHealthUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (!apiUrl) {
    return null;
  }

  const backendUrl = new URL("/health", apiUrl);
  return backendUrl.toString();
}

export async function getReadinessPayload(
  fetchImpl: typeof fetch = fetch,
): Promise<{ payload: ReadinessResponsePayload; httpStatus: number }> {
  const base = getBasePayload();
  const backendHealthUrl = getBackendHealthUrl();

  if (!backendHealthUrl) {
    return {
      payload: createBackendErrorPayload(
        base,
        null,
        "NEXT_PUBLIC_API_URL is not configured",
      ),
      httpStatus: 503,
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), READY_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const response = await fetchImpl(backendHealthUrl, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    const responseTimeMs = Date.now() - startedAt;
    let details: BackendHealthPayload | undefined;

    try {
      details = (await response.json()) as BackendHealthPayload;
    } catch {
      details = undefined;
    }

    if (!response.ok) {
      return {
        payload: createBackendErrorPayload(
          base,
          backendHealthUrl,
          `Backend health check returned HTTP ${response.status}`,
          responseTimeMs,
          response.status,
        ),
        httpStatus: 503,
      };
    }

    if (details?.status !== "ok") {
      return {
        payload: createBackendErrorPayload(
          base,
          backendHealthUrl,
          "Backend health payload did not report status ok",
          responseTimeMs,
          response.status,
        ),
        httpStatus: 503,
      };
    }

    return {
      payload: {
        ...base,
        status: "ok",
        checks: {
          app: { status: "ok" },
          backend: {
            status: "ok",
            url: backendHealthUrl,
            responseTimeMs,
            httpStatus: response.status,
            details,
          },
        },
      },
      httpStatus: 200,
    };
  } catch (error) {
    const responseTimeMs = Date.now() - startedAt;
    const message =
      error instanceof Error
        ? error.name === "AbortError"
          ? `Backend health check timed out after ${READY_TIMEOUT_MS}ms`
          : error.message
        : "Unknown backend health error";

    return {
      payload: createBackendErrorPayload(
        base,
        backendHealthUrl,
        message,
        responseTimeMs,
      ),
      httpStatus: 503,
    };
  } finally {
    clearTimeout(timeout);
  }
}

/** @jest-environment node */

describe("/api/health", () => {
  function loadHealthRoute() {
    let routeModule: typeof import("@/app/api/health/route") | undefined;

    jest.isolateModules(() => {
      routeModule = require("@/app/api/health/route") as typeof import("@/app/api/health/route");
    });

    return routeModule!;
  }

  afterEach(() => {
    jest.resetModules();
  });

  it("returns a non-cached liveness payload on GET", async () => {
    const { GET } = loadHealthRoute();

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(body).toEqual(
      expect.objectContaining({
        service: "atlas-portal",
        status: "ok",
      }),
    );
    expect(typeof body.timestamp).toBe("string");
    expect(typeof body.uptimeSeconds).toBe("number");
  });

  it("returns HEAD with the same healthy status and no body", async () => {
    const { HEAD } = loadHealthRoute();

    const response = await HEAD();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    await expect(response.text()).resolves.toBe("");
  });
});

describe("/api/ready", () => {
  const envRef = process.env as Record<string, string | undefined>;
  const originalApiUrl = envRef.NEXT_PUBLIC_API_URL;

  function loadReadyRoute() {
    let routeModule: typeof import("@/app/api/ready/route") | undefined;

    jest.isolateModules(() => {
      routeModule = require("@/app/api/ready/route") as typeof import("@/app/api/ready/route");
    });

    return routeModule!;
  }

  afterEach(() => {
    if (originalApiUrl === undefined) {
      delete envRef.NEXT_PUBLIC_API_URL;
    } else {
      envRef.NEXT_PUBLIC_API_URL = originalApiUrl;
    }

    jest.resetModules();
    jest.resetAllMocks();
  });

  it("returns 200 when the backend health check succeeds", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        status: "ok",
        database: "ok",
      }),
    }) as jest.Mock;

    const { GET } = loadReadyRoute();

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3001/health",
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
      }),
    );
    expect(body).toEqual(
      expect.objectContaining({
        service: "atlas-portal",
        status: "ok",
        checks: expect.objectContaining({
          app: { status: "ok" },
          backend: expect.objectContaining({
            status: "ok",
            httpStatus: 200,
            details: expect.objectContaining({
              status: "ok",
              database: "ok",
            }),
          }),
        }),
      }),
    );
  });

  it("returns 503 when NEXT_PUBLIC_API_URL is missing", async () => {
    delete envRef.NEXT_PUBLIC_API_URL;
    global.fetch = jest.fn() as jest.Mock;

    const { GET } = loadReadyRoute();

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(body).toEqual(
      expect.objectContaining({
        status: "error",
        checks: expect.objectContaining({
          backend: expect.objectContaining({
            status: "error",
            error: "NEXT_PUBLIC_API_URL is not configured",
          }),
        }),
      }),
    );
  });

  it("returns 503 when the backend health check fails", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("connect ECONNREFUSED")) as jest.Mock;

    const { GET } = loadReadyRoute();

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual(
      expect.objectContaining({
        status: "error",
        checks: expect.objectContaining({
          backend: expect.objectContaining({
            status: "error",
            error: "connect ECONNREFUSED",
          }),
        }),
      }),
    );
  });

  it("returns HEAD with the readiness status code and no body", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: jest.fn().mockResolvedValue({
        status: "error",
      }),
    }) as jest.Mock;

    const { HEAD } = loadReadyRoute();

    const response = await HEAD();

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toContain("no-store");
    await expect(response.text()).resolves.toBe("");
  });
});

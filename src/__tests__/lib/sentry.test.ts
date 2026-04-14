describe("sentry helpers", () => {
  const envRef = process.env as Record<string, string | undefined>;
  const originalNodeEnv = envRef.NODE_ENV;
  const originalDsn = envRef.NEXT_PUBLIC_SENTRY_DSN;
  const originalVercelEnv = envRef.NEXT_PUBLIC_VERCEL_ENV;
  const originalTraceRate = envRef.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE;
  const originalReplaySessionRate = envRef.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE;
  const originalReplayOnErrorRate = envRef.NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE;

  function loadSentryModule() {
    let sentryModule: typeof import("@/lib/sentry") | undefined;
    let sentrySdk: typeof import("@sentry/nextjs") | undefined;

    jest.isolateModules(() => {
      sentryModule = require("@/lib/sentry") as typeof import("@/lib/sentry");
      sentrySdk = require("@sentry/nextjs") as typeof import("@sentry/nextjs");
    });

    return {
      sentryModule: sentryModule!,
      sentrySdk: sentrySdk!,
    };
  }

  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    if (originalNodeEnv === undefined) {
      delete envRef.NODE_ENV;
    } else {
      envRef.NODE_ENV = originalNodeEnv;
    }

    if (originalDsn === undefined) {
      delete envRef.NEXT_PUBLIC_SENTRY_DSN;
    } else {
      envRef.NEXT_PUBLIC_SENTRY_DSN = originalDsn;
    }

    if (originalVercelEnv === undefined) {
      delete envRef.NEXT_PUBLIC_VERCEL_ENV;
    } else {
      envRef.NEXT_PUBLIC_VERCEL_ENV = originalVercelEnv;
    }

    if (originalTraceRate === undefined) {
      delete envRef.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE;
    } else {
      envRef.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE = originalTraceRate;
    }

    if (originalReplaySessionRate === undefined) {
      delete envRef.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE;
    } else {
      envRef.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE = originalReplaySessionRate;
    }

    if (originalReplayOnErrorRate === undefined) {
      delete envRef.NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE;
    } else {
      envRef.NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE = originalReplayOnErrorRate;
    }

    jest.resetModules();
  });

  it("builds client config with replay enabled and deployment environment", () => {
    envRef.NODE_ENV = "production";
    envRef.NEXT_PUBLIC_VERCEL_ENV = "preview";
    envRef.NEXT_PUBLIC_SENTRY_DSN = "https://public@example.ingest.sentry.io/1";

    const { sentryModule, sentrySdk } = loadSentryModule();
    const { getClientSentryConfig } = sentryModule;
    const config = getClientSentryConfig();

    expect(config.enabled).toBe(true);
    expect(config.environment).toBe("preview");
    expect(config.tracesSampleRate).toBe(0.2);
    expect(config.replaysSessionSampleRate).toBe(0.05);
    expect(config.replaysOnErrorSampleRate).toBe(1);
    expect(sentrySdk.replayIntegration).toHaveBeenCalledWith({
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
    });
  });

  it("falls back to safe defaults when sample-rate overrides are invalid", () => {
    envRef.NODE_ENV = "production";
    envRef.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE = "2";
    envRef.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE = "-1";
    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    const { sentryModule } = loadSentryModule();
    const { getClientSentryConfig } = sentryModule;
    const config = getClientSentryConfig();

    expect(config.tracesSampleRate).toBe(0.2);
    expect(config.replaysSessionSampleRate).toBe(0.05);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE"),
    );
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE"),
    );

    consoleWarnSpy.mockRestore();
  });

  it("syncs authenticated user details onto the Sentry scope", () => {
    const { sentryModule, sentrySdk } = loadSentryModule();
    const { syncSentryUser } = sentryModule;

    syncSentryUser({
      id: "user_1",
      handle: "atlas-alpha",
      email: "atlas@example.com",
      role: "ANALYST",
      onboardingTrack: "TRACK_A",
    });

    expect(sentrySdk.setUser).toHaveBeenCalledWith({
      id: "user_1",
      username: "atlas-alpha",
      email: "atlas@example.com",
    });
    expect(sentrySdk.setTag).toHaveBeenCalledWith("user_role", "analyst");
    expect(sentrySdk.setTag).toHaveBeenCalledWith("onboarding_track", "TRACK_A");
  });

  it("clears user details when no authenticated user is available", () => {
    const { sentryModule, sentrySdk } = loadSentryModule();
    const { syncSentryUser } = sentryModule;

    syncSentryUser(null);

    expect(sentrySdk.setUser).toHaveBeenCalledWith(null);
    expect(sentrySdk.setTag).toHaveBeenCalledWith("user_role", "anonymous");
    expect(sentrySdk.setTag).toHaveBeenCalledWith("onboarding_track", "none");
  });
});

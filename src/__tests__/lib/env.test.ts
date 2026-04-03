describe("env", () => {
  const envRef = process.env as Record<string, string | undefined>;
  const originalApiUrl = envRef.NEXT_PUBLIC_API_URL;
  const originalNodeEnv = envRef.NODE_ENV;

  function loadEnvModule() {
    let envModule: typeof import("@/lib/env") | undefined;

    jest.isolateModules(() => {
      envModule = require("@/lib/env") as typeof import("@/lib/env");
    });

    return envModule!;
  }

  afterEach(() => {
    if (originalApiUrl === undefined) {
      delete envRef.NEXT_PUBLIC_API_URL;
    } else {
      envRef.NEXT_PUBLIC_API_URL = originalApiUrl;
    }

    if (originalNodeEnv === undefined) {
      delete envRef.NODE_ENV;
    } else {
      envRef.NODE_ENV = originalNodeEnv;
    }

    jest.resetModules();
  });

  it("loads the default test API URL from setup", () => {
    const { env } = loadEnvModule();

    expect(env.apiUrl).toBe("http://localhost:3001");
  });

  it("loads an overridden NEXT_PUBLIC_API_URL value", () => {
    envRef.NEXT_PUBLIC_API_URL = "https://atlas.example.com";

    const { env } = loadEnvModule();

    expect(env.apiUrl).toBe("https://atlas.example.com");
  });

  it("throws when NEXT_PUBLIC_API_URL is missing", () => {
    delete envRef.NEXT_PUBLIC_API_URL;

    expect(() => loadEnvModule()).toThrow("[Atlas] Missing required environment variables:");
    expect(() => loadEnvModule()).toThrow("NEXT_PUBLIC_API_URL");
  });

  it("throws when NEXT_PUBLIC_API_URL is not a valid URL", () => {
    envRef.NEXT_PUBLIC_API_URL = "atlas-not-a-url";

    expect(() => loadEnvModule()).toThrow('[Atlas] NEXT_PUBLIC_API_URL is not a valid URL: "atlas-not-a-url"');
  });
});

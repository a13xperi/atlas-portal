describe("env", () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const originalNodeEnv = process.env.NODE_ENV;

  function loadEnvModule() {
    let envModule: typeof import("@/lib/env") | undefined;

    jest.isolateModules(() => {
      envModule = require("@/lib/env") as typeof import("@/lib/env");
    });

    return envModule!;
  }

  afterEach(() => {
    if (originalApiUrl === undefined) {
      delete process.env.NEXT_PUBLIC_API_URL;
    } else {
      process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
    }

    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }

    jest.resetModules();
  });

  it("loads the default test API URL from setup", () => {
    const { env } = loadEnvModule();

    expect(env.apiUrl).toBe("http://localhost:3001");
  });

  it("loads an overridden NEXT_PUBLIC_API_URL value", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://atlas.example.com";

    const { env } = loadEnvModule();

    expect(env.apiUrl).toBe("https://atlas.example.com");
  });

  it("throws when NEXT_PUBLIC_API_URL is missing", () => {
    delete process.env.NEXT_PUBLIC_API_URL;

    expect(() => loadEnvModule()).toThrow("[Atlas] Missing required environment variables:");
    expect(() => loadEnvModule()).toThrow("NEXT_PUBLIC_API_URL");
  });

  it("throws when NEXT_PUBLIC_API_URL is not a valid URL", () => {
    process.env.NEXT_PUBLIC_API_URL = "atlas-not-a-url";

    expect(() => loadEnvModule()).toThrow('[Atlas] NEXT_PUBLIC_API_URL is not a valid URL: "atlas-not-a-url"');
  });
});

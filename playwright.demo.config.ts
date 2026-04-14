import { defineConfig, devices } from "@playwright/test";

const vercelBypass =
  process.env.VERCEL_AUTOMATION_BYPASS_SECRET ??
  process.env.VERCEL_PROTECTION_BYPASS;

export default defineConfig({
  testDir: "./e2e", testMatch: ["demo-mode.spec.ts"], fullyParallel: true, retries: 0, reporter: "list",
  timeout: 45_000, expect: { timeout: 10_000 },
  use: {
    baseURL: "http://localhost:3000",
    extraHTTPHeaders: vercelBypass
      ? {
          "x-vercel-protection-bypass": vercelBypass,
          "x-vercel-set-bypass-cookie": "true",
        }
      : {},
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: { command: "npm run dev", url: "http://localhost:3000", reuseExistingServer: true, timeout: 120_000,
    env: { ...process.env, NEXT_PUBLIC_API_URL: "https://api-production-9bef.up.railway.app" } },
});

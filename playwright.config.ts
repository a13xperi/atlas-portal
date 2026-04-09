import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;
const apiURL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://api-production-9bef.up.railway.app";

const vercelBypass =
  process.env.VERCEL_AUTOMATION_BYPASS_SECRET ??
  process.env.VERCEL_PROTECTION_BYPASS;

export default defineConfig({
  testDir: "./e2e",
  testMatch: ["smoke.spec.ts", "investor-walkthrough.spec.ts", "demo-mode.spec.ts", "demo-render.spec.ts", "tour.spec.ts", "dashboard.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : 3,
  reporter: process.env.CI ? "github" : "list",
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL,
    extraHTTPHeaders: vercelBypass
      ? {
          "x-vercel-protection-bypass": vercelBypass,
          "x-vercel-set-bypass-cookie": "true",
        }
      : {},
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      NEXT_PUBLIC_API_URL: apiURL,
    },
  },
});

import { defineConfig, devices } from "@playwright/test";

const vercelBypass =
  process.env.VERCEL_AUTOMATION_BYPASS_SECRET ??
  process.env.VERCEL_PROTECTION_BYPASS;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "https://delphi-atlas.vercel.app",
    extraHTTPHeaders: vercelBypass
      ? {
          "x-vercel-protection-bypass": vercelBypass,
          "x-vercel-set-bypass-cookie": "true",
        }
      : {},
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});

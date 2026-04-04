import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "https://delphi-atlas.vercel.app",
    extraHTTPHeaders: process.env.VERCEL_PROTECTION_BYPASS
      ? { "x-vercel-protection-bypass": process.env.VERCEL_PROTECTION_BYPASS }
      : {},
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});

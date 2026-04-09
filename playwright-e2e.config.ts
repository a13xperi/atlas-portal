import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "https://delphi-atlas.vercel.app";
const vercelBypass =
  process.env.VERCEL_AUTOMATION_BYPASS_SECRET ??
  process.env.VERCEL_PROTECTION_BYPASS;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  timeout: 60_000,
  expect: { timeout: 10_000 },
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
      name: "a11y",
      testDir: "./e2e/accessibility",
      testMatch: "**/*.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "visual",
      testDir: "./e2e/visual",
      testMatch: "**/*.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "responsive",
      testDir: "./e2e/responsive",
      testMatch: "**/*.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "errors",
      testDir: "./e2e/error-handling",
      testMatch: "**/*.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "performance",
      testDir: "./e2e/performance",
      testMatch: "**/*.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});

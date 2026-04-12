import { defineConfig, devices } from "@playwright/test";
import { resolvePlaywrightBaseURL, resolveVercelBypassHeaders } from "../playwright-env";

const baseURL = resolvePlaywrightBaseURL("https://delphi-atlas.vercel.app");

export default defineConfig({
  testDir: ".",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    extraHTTPHeaders: resolveVercelBypassHeaders() ?? {},
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "demo-mode-tier1",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});

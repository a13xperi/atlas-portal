import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 3,
  reporter: [
    ["json", { outputFile: "/tmp/atlas-e2e-results.json" }],
    ["list"],
  ],
  use: {
    baseURL:
      process.env.PLAYWRIGHT_BASE_URL ||
      "https://staging-delphi-atlas.vercel.app",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  timeout: 30000,
});

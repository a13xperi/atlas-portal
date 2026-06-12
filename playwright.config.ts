import { defineConfig, devices } from "@playwright/test";
import { resolveVercelBypassHeaders } from "./e2e/playwright-env";

export default defineConfig({
  testDir: "./e2e",
  // integration.spec is the REAL-credentials QA suite (its own header points
  // at playwright-qa.config.ts) — it logs in through the email/password UI,
  // which the X-OAuth-first login removed. It only ever passed here while
  // that UI existed; keep it scoped to the QA config it was written for.
  testIgnore: ["**/integration.spec.ts"],
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
    // Vercel deployment protection returns 401 without the bypass header;
    // playwright-e2e.config.ts has had this since protection was enabled,
    // this config never did (152/203 failures against any protected preview).
    extraHTTPHeaders: resolveVercelBypassHeaders(),
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

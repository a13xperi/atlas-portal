import { defineConfig, devices } from "@playwright/test";
import {
  isLocalBaseURL,
  resolvePlaywrightBaseURL,
  resolveVercelBypassHeaders,
} from "./e2e/playwright-env";

const PORT = 3000;
const localBaseURL = `http://localhost:${PORT}`;
const baseURL = resolvePlaywrightBaseURL(localBaseURL);
const apiURL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://api-production-9bef.up.railway.app";
const useLocalWebServer = isLocalBaseURL(baseURL);

export default defineConfig({
  testDir: "./e2e",
  testMatch: ["smoke.spec.ts", "investor-walkthrough.spec.ts", "demo-mode.spec.ts", "demo-render.spec.ts", "tour.spec.ts", "dashboard.spec.ts", "onboarding.spec.ts", "oracle.spec.ts", "voice-library.spec.ts", "track-b.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 3,
  reporter: process.env.CI ? "github" : "list",
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL,
    extraHTTPHeaders: resolveVercelBypassHeaders(),
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
  webServer: useLocalWebServer
    ? {
        command: "npm run dev",
        url: localBaseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          ...process.env,
          NEXT_PUBLIC_API_URL: apiURL,
        },
      }
    : undefined,
});

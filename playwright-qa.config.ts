import { defineConfig, devices } from "@playwright/test";
import {
  resolvePlaywrightBaseURL,
  resolveVercelBypassHeaders,
} from "./e2e/playwright-env";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: resolvePlaywrightBaseURL("https://delphi-atlas.vercel.app"),
    extraHTTPHeaders: resolveVercelBypassHeaders(),
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});

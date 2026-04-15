import { expect, test, type Route } from "@playwright/test";

const AUTH_COOKIES = (hostname: string) => [
  { name: "atlas_session", value: "1", domain: hostname, path: "/" },
  { name: "atlas_access_token", value: "1", domain: hostname, path: "/" },
];

const ALL_FLAGS_ENABLED: Record<string, boolean> = {
  crafting_station: true,
  voice_lab: true,
  arena: true,
  campaigns: true,
  queue: true,
  analytics_advanced: true,
  signals: true,
  telegram_bot: true,
  tweet_tinder: true,
  multi_model: true,
  super_admin: true,
  management: true,
  feed: true,
  briefing: true,
  library: true,
};

const mockUser = {
  id: "oracle-test-1",
  handle: "atlasanalyst",
  email: "atlas@example.com",
  role: "ADMIN" as const,
  displayName: "Atlas Analyst",
  voiceProfile: {
    id: "voice-1",
    userId: "oracle-test-1",
    humor: 58,
    formality: 46,
    brevity: 64,
    contrarianTone: 52,
    maturity: "INTERMEDIATE" as const,
    tweetsAnalyzed: 28,
  },
};

function json(route: Route, body: unknown) {
  return route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function stubDashboardApi(page: import("@playwright/test").Page) {
  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/api/auth/me")) return json(route, { user: mockUser });
    if (url.includes("/api/voice/profile"))
      return json(route, { profile: mockUser.voiceProfile });
    if (url.includes("/api/voice/references"))
      return json(route, { voices: [] });
    if (url.includes("/api/voice/blends")) return json(route, { blends: [] });
    if (url.includes("/api/analytics/summary"))
      return json(route, { summary: { draftsCreated: 0, draftsPosted: 0, feedbackGiven: 0, refinements: 0, reportsIngested: 0, period: "30d" } });
    if (url.includes("/api/analytics/learning-log"))
      return json(route, { entries: [] });
    if (url.includes("/api/analytics/engagement/daily"))
      return json(route, { days: [] });
    if (url.includes("/api/alerts/feed")) return json(route, { alerts: [] });
    if (url.includes("/api/oracle")) return json(route, { response: "Test oracle response" });
    return json(route, {});
  });
}

test.describe("Oracle widget + Cmd+K", () => {
  test.beforeEach(async ({ page, context, baseURL }) => {
    const url = new URL(baseURL ?? "http://localhost:3000");
    await context.addCookies(AUTH_COOKIES(url.hostname));

    const bypass =
      process.env.VERCEL_AUTOMATION_BYPASS_SECRET ??
      process.env.VERCEL_PROTECTION_BYPASS;
    if (bypass) {
      await context.addCookies([
        { name: "_vercel_password", value: bypass, domain: url.hostname, path: "/" },
      ]);
    }

    await context.addInitScript((flags) => {
      try {
        window.localStorage.setItem("atlas-feature-flags", JSON.stringify(flags));
      } catch {
        // ignore
      }
    }, ALL_FLAGS_ENABLED);

    await stubDashboardApi(page);
    await page.route("https://unavatar.io/**", (route) => route.abort());
    await page.route("https://pbs.twimg.com/**", (route) => route.abort());
  });

  test("Oracle widget is visible on /dashboard at bottom-right", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

    // The FloatingOracle renders a button at fixed bottom-right
    const oracleBtn = page.locator('[aria-label="Open Oracle assistant"]');
    await expect(oracleBtn).toBeVisible({ timeout: 8000 });
  });

  test("Cmd+K opens the command palette", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

    // Wait for page to settle
    await page.waitForTimeout(500);

    // ControlOrMeta maps to Cmd on macOS, Ctrl on Linux/Windows — works in CI.
    await page.keyboard.press("ControlOrMeta+k");

    // Command palette should be visible
    const palette = page.locator('[role="dialog"]').first();
    await expect(palette).toBeVisible({ timeout: 3000 });
  });

  test("typing oracle in command palette surfaces Open Oracle command", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    await page.keyboard.press("ControlOrMeta+k");

    // Type 'oracle' in the search field
    await page.keyboard.type("oracle");

    // 'Open Oracle' command should appear
    await expect(
      page.getByText("Open Oracle", { exact: false }),
    ).toBeVisible({ timeout: 3000 });
  });
});

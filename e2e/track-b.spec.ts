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
  management: true,
  feed: true,
  briefing: true,
  library: true,
};

const mockUser = {
  id: "track-b-user-1",
  handle: "atlasanalyst",
  email: "atlas@example.com",
  role: "ANALYST" as const,
  displayName: "Atlas Analyst",
  voiceProfile: {
    id: "voice-1",
    userId: "track-b-user-1",
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

async function stubApi(page: import("@playwright/test").Page) {
  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/api/auth/me")) return json(route, { user: mockUser });
    if (url.includes("/api/voice/profile"))
      return json(route, { profile: mockUser.voiceProfile });
    if (url.includes("/api/voice/references"))
      return json(route, { voices: [] });
    if (url.includes("/api/voice/blends")) return json(route, { blends: [] });
    if (url.includes("/api/voice/accounts"))
      return json(route, { accounts: [] });
    return json(route, {});
  });
}

test.describe("Track B — ?prompt=complete-voice-setup redirect", () => {
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

    await stubApi(page);
    await page.route("https://unavatar.io/**", (route) => route.abort());
  });

  test("?prompt=complete-voice-setup on /voice-profiles shows setup prompt", async ({
    page,
  }) => {
    await page.goto("/voice-profiles?prompt=complete-voice-setup", {
      waitUntil: "domcontentloaded",
    });

    // The setup prompt banner should appear
    await expect(
      page.getByText("Complete your voice setup"),
    ).toBeVisible({ timeout: 8000 });
  });

  test("setup prompt is not shown without the query param", async ({ page }) => {
    await page.goto("/voice-profiles", { waitUntil: "domcontentloaded" });

    await page.waitForTimeout(500);
    await expect(
      page.getByText("Complete your voice setup"),
    ).toHaveCount(0);
  });

  test("setup prompt can be dismissed", async ({ page }) => {
    await page.goto("/voice-profiles?prompt=complete-voice-setup", {
      waitUntil: "domcontentloaded",
    });

    await expect(
      page.getByText("Complete your voice setup"),
    ).toBeVisible({ timeout: 8000 });

    // Dismiss the prompt
    const dismissBtn = page.getByLabel("Dismiss voice setup prompt");
    await expect(dismissBtn).toBeVisible();
    await dismissBtn.click();

    await expect(
      page.getByText("Complete your voice setup"),
    ).toHaveCount(0, { timeout: 3000 });
  });
});

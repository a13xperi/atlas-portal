import { expect, test, type Route } from "@playwright/test";

// Auth cookies required to bypass middleware on protected routes.
const AUTH_COOKIES = (hostname: string) => [
  { name: "atlas_session", value: "1", domain: hostname, path: "/" },
  { name: "atlas_access_token", value: "1", domain: hostname, path: "/" },
];

const mockUser = {
  id: "onboarding-user-1",
  handle: "",
  email: "test@example.com",
  role: "ANALYST" as const,
  displayName: "Test User",
  voiceProfile: null,
};

function json(route: Route, body: unknown) {
  return route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function stubOnboardingApi(page: import("@playwright/test").Page) {
  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/api/auth/me")) return json(route, { user: mockUser });
    if (url.includes("/api/auth/x/authorize"))
      return json(route, { url: "https://x.com/oauth?mock=1" });
    if (url.includes("/api/voice/profile"))
      return json(route, { profile: null });
    if (url.includes("/api/voice/references"))
      return json(route, { voices: [] });
    if (url.includes("/api/voice/blends")) return json(route, { blends: [] });
    // Catch-all
    return json(route, {});
  });
}

test.describe("Onboarding — X-first flow", () => {
  test.beforeEach(async ({ page, context, baseURL }) => {
    const url = new URL(baseURL ?? "http://localhost:3000");
    await context.addCookies(AUTH_COOKIES(url.hostname));

    // Bypass Vercel deployment protection on preview URLs
    const bypass =
      process.env.VERCEL_AUTOMATION_BYPASS_SECRET ??
      process.env.VERCEL_PROTECTION_BYPASS;
    if (bypass) {
      await context.addCookies([
        { name: "_vercel_password", value: bypass, domain: url.hostname, path: "/" },
      ]);
    }

    await stubOnboardingApi(page);
  });

  test("renders /onboarding without crashing", async ({ page }) => {
    await page.goto("/onboarding", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText("Something went wrong", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Page not found", { exact: true })).toHaveCount(0);
  });

  test("X-connect step appears first — before voice calibration", async ({ page }) => {
    await page.goto("/onboarding", { waitUntil: "domcontentloaded" });

    // WELCOME step drains first — must click "Let's go" to advance to CONNECT_X.
    const letsGo = page.getByRole("button", { name: /Let's go/i });
    await expect(letsGo).toBeVisible({ timeout: 12000 });
    await letsGo.click();

    // "Connect your X account" button should appear at the CONNECT_X step.
    // This is sufficient to assert we're on the X-connect step, not yet calibrating.
    await expect(
      page.getByRole("button", { name: /Connect your X account/i }),
    ).toBeVisible({ timeout: 8000 });
  });

  test("skip path proceeds without X connection", async ({ page }) => {
    await page.goto("/onboarding", { waitUntil: "domcontentloaded" });

    // WELCOME step drains first — must click "Let's go" to advance to CONNECT_X.
    const letsGo = page.getByRole("button", { name: /Let's go/i });
    await expect(letsGo).toBeVisible({ timeout: 12000 });
    await letsGo.click();

    // Wait for the Skip for now button (skip-x action)
    const skipButton = page.getByRole("button", { name: /Skip for now/i });
    await expect(skipButton).toBeVisible({ timeout: 8000 });

    await skipButton.click();

    // After skipping X, should advance to Track B flow — X connect button gone.
    await expect(
      page.getByRole("button", { name: /Connect your X account/i }),
    ).toHaveCount(0, { timeout: 3000 });
  });

  test("returns from X OAuth with x_connected=true param and advances", async ({ page }) => {
    // Simulate returning from X OAuth callback
    await page.goto("/onboarding?x_connected=true&handle=atlasanalyst", {
      waitUntil: "domcontentloaded",
    });

    // The X connect button should not appear because xConnected is set to true.
    await page.waitForTimeout(500);
    await expect(
      page.getByRole("button", { name: /Connect your X account/i }),
    ).toHaveCount(0, { timeout: 3000 });
  });
});

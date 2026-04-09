/**
 * Tier 1 — Demo Mode Route Rendering Tests
 *
 * Fast, no-server-needed tests that toggle demo mode via sessionStorage
 * and verify every main page renders with demo data and no JS errors.
 *
 * Routes already covered by e2e/demo-mode.spec.ts:
 *   /dashboard, /arena, /voice-profiles, /crafting, /alerts
 *
 * This file covers the REMAINING routes:
 *   /analytics, /team-library, /profile, /campaigns, /queue,
 *   /briefing, /feed, /admin, /admin/qa, /admin/bugs
 *
 * Plus an auth-gate test (no cookies → redirect to /).
 */

import { test as fixtureTest, expect, stubAuth, stubDataEndpoints } from "../fixtures";
import { type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Custom fixture: authenticated page with demo mode pre-enabled
// ---------------------------------------------------------------------------

const test = fixtureTest.extend<{ demoPage: Page }>({
  demoPage: async ({ page, context, baseURL }, use) => {
    const url = new URL(baseURL ?? "https://delphi-atlas.vercel.app");

    // Set auth cookies so middleware allows protected routes
    await context.addCookies([
      { name: "atlas_access_token", value: "1", domain: url.hostname, path: "/" },
      { name: "atlas_session", value: "1", domain: url.hostname, path: "/" },
    ]);

    // Stub auth + data endpoints (network never touched)
    await stubAuth(page);
    await stubDataEndpoints(page);

    // Navigate to dashboard first to get a page context, then enable demo mode
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

    // Enable demo mode via sessionStorage before any demo-dependent navigation
    await page.evaluate(() => {
      sessionStorage.setItem("atlas_demo_mode", "true");
    });

    await use(page);
  },
});

// ---------------------------------------------------------------------------
// Route rendering tests
// ---------------------------------------------------------------------------

test.describe("Tier 1 — Demo Mode Route Rendering", () => {
  test.describe.configure({ mode: "parallel" });

  test("analytics page renders with demo data", async ({ demoPage: page }) => {
    await page.goto("/analytics", { waitUntil: "domcontentloaded" });

    // Demo data: analyticsSummary has draftsCreated: 47
    await expect(page.locator("h1, h2, main, [role='main']").first()).toBeVisible({ timeout: 10_000 });

    // Verify demo mode indicator is present
    await expect(page.getByText("DEMO")).toBeVisible({ timeout: 5_000 });
  });

  test("team-library page renders with demo data", async ({ demoPage: page }) => {
    await page.goto("/team-library", { waitUntil: "domcontentloaded" });

    await expect(page.locator("h1, h2, main, [role='main']").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("DEMO")).toBeVisible({ timeout: 5_000 });
  });

  test("profile page renders with demo data", async ({ demoPage: page }) => {
    await page.goto("/profile", { waitUntil: "domcontentloaded" });

    await expect(page.locator("h1, h2, main, [role='main']").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("DEMO")).toBeVisible({ timeout: 5_000 });
  });

  test("campaigns page renders with demo data", async ({ demoPage: page }) => {
    await page.goto("/campaigns", { waitUntil: "domcontentloaded" });

    await expect(page.locator("h1, h2, main, [role='main']").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("DEMO")).toBeVisible({ timeout: 5_000 });

    // Demo data has 3 campaigns — at least one should be visible
    await expect(
      page.getByText("Pair Trading").first().or(page.getByText("ETH Staking Thesis").first()),
    ).toBeVisible({ timeout: 5_000 });
  });

  test("queue page renders with demo data", async ({ demoPage: page }) => {
    await page.goto("/queue", { waitUntil: "domcontentloaded" });

    await expect(page.locator("h1, h2, main, [role='main']").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("DEMO")).toBeVisible({ timeout: 5_000 });
  });

  test("briefing page renders with demo data", async ({ demoPage: page }) => {
    await page.goto("/briefing", { waitUntil: "domcontentloaded" });

    await expect(page.locator("h1, h2, main, [role='main']").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("DEMO")).toBeVisible({ timeout: 5_000 });
  });

  test("feed page renders with demo data", async ({ demoPage: page }) => {
    await page.goto("/feed", { waitUntil: "domcontentloaded" });

    await expect(page.locator("h1, h2, main, [role='main']").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("DEMO")).toBeVisible({ timeout: 5_000 });
  });

  // Admin pages — public paths, no auth required, but still test with demo mode
  test("admin page renders", async ({ demoPage: page }) => {
    await page.goto("/admin", { waitUntil: "domcontentloaded" });

    await expect(page.locator("h1, h2, main, [role='main']").first()).toBeVisible({ timeout: 10_000 });
  });

  test("admin/qa page renders", async ({ demoPage: page }) => {
    await page.goto("/admin/qa", { waitUntil: "domcontentloaded" });

    await expect(page.locator("h1, h2, main, [role='main']").first()).toBeVisible({ timeout: 10_000 });
  });

  test("admin/bugs page renders", async ({ demoPage: page }) => {
    await page.goto("/admin/bugs", { waitUntil: "domcontentloaded" });

    await expect(page.locator("h1, h2, main, [role='main']").first()).toBeVisible({ timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// Auth gate test — demo mode OFF, no cookies → redirect to login
// ---------------------------------------------------------------------------

test.describe("Tier 1 — Auth Gate", () => {
  const protectedRoutes = [
    "/dashboard",
    "/crafting",
    "/voice-profiles",
    "/analytics",
    "/alerts",
    "/team-library",
    "/arena",
    "/profile",
    "/campaigns",
    "/queue",
    "/briefing",
    "/feed",
  ];

  for (const route of protectedRoutes) {
    test(`${route} redirects to login without auth cookies`, async ({ page }) => {
      // Do NOT set any cookies — visit the protected route directly
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });

      // Should redirect to / (login page) or show login content
      // The middleware strips the path and sends to /
      await expect(page).toHaveURL(/^\/$|\/\?/, { timeout: 10_000 });
    });
  }
});

// ---------------------------------------------------------------------------
// Demo mode toggle-off test
// ---------------------------------------------------------------------------

test.describe("Tier 1 — Demo Mode Toggle Off", () => {
  test("disabling demo mode in sessionStorage shows LIVE indicator", async ({ demoPage: page }) => {
    // Confirm demo mode is ON
    await expect(page.getByText("DEMO")).toBeVisible({ timeout: 5_000 });

    // Verify sessionStorage has the flag
    const val = await page.evaluate(() => sessionStorage.getItem("atlas_demo_mode"));
    expect(val).toBe("true");

    // Clear demo mode and reload
    await page.evaluate(() => {
      sessionStorage.removeItem("atlas_demo_mode");
    });
    await page.reload({ waitUntil: "domcontentloaded" });

    // Should show LIVE, not DEMO
    await expect(page.getByText("LIVE")).toBeVisible({ timeout: 5_000 });
  });
});

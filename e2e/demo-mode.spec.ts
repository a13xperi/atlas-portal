/**
 * Suite 2: Demo Mode Tests
 *
 * Tests the global DEMO/LIVE toggle and verifies demo data appears
 * correctly across all pages.
 */

import { test as fixtureTest, expect, stubAuth, stubDataEndpoints } from "./fixtures";
import { type Page } from "@playwright/test";

// Use origin-agnostic glob patterns so stubs work whether the browser hits the
// cross-origin Railway backend directly OR the Next.js rewrite proxy on localhost.

/**
 * Extended fixture: intercept ALL API calls (auth + data) with a single
 * handler, then navigate directly to /dashboard by setting the session cookie.
 */
const test = fixtureTest.extend<{ authedPage: Page }>({
  authedPage: async ({ page, context }, use) => {
    const mockUser = {
      id: "test-user-1",
      handle: "testanalyst",
      email: "test@atlas.dev",
      role: "MANAGER" as const,
      displayName: "Test User",
      voiceProfile: {
        id: "vp-1",
        userId: "test-user-1",
        humor: 50,
        formality: 60,
        brevity: 40,
        contrarianTone: 30,
        maturity: "INTERMEDIATE" as const,
        tweetsAnalyzed: 12,
      },
    };

    // Single catch-all: handle every API request ourselves.
    await page.route("**/api/**", (route) => {
      const url = route.request().url();
      const method = route.request().method();

      // Auth endpoints
      if (url.includes("/api/auth/me"))
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: mockUser }) });
      if (url.includes("/api/auth/login"))
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: mockUser, token: "fake-jwt", refresh_token: "fake-refresh" }) });
      if (url.includes("/api/auth/refresh"))
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ token: "fake-jwt", refresh_token: "fake-refresh" }) });
      if (url.includes("/api/auth/logout"))
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });

      // Data endpoints — return empty structures
      if (url.includes("/api/analytics/summary"))
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ summary: { draftsCreated: 8, draftsPosted: 3, feedbackGiven: 5, refinements: 2, reportsIngested: 4, period: "30d" } }) });
      if (url.includes("/api/drafts") && method === "GET")
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ drafts: [] }) });

      // Everything else: empty JSON
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({}),
      });
    });

    // Set session cookie so middleware allows /dashboard
    await context.addCookies([
      { name: "atlas_session", value: "1", domain: "localhost", path: "/" },
    ]);

    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await use(page);
  },
});

/** Toggle demo mode ON via the NavBar pill. */
async function enableDemo(page: Page) {
  const toggle = page.getByRole("button", { name: /switch to demo data/i });
  await toggle.click();
  await expect(page.getByText("DEMO")).toBeVisible();
}

/** Toggle demo mode OFF via the NavBar pill. */
async function disableDemo(page: Page) {
  const toggle = page.getByRole("button", { name: /switch to live data/i });
  await toggle.click();
  await expect(page.getByText("LIVE")).toBeVisible();
}

// ---------------------------------------------------------------------------
// Toggle behavior
// ---------------------------------------------------------------------------

test.describe("Demo Mode", () => {
  test.describe("Toggle behavior", () => {
    test("clicking LIVE pill switches to DEMO", async ({ authedPage: page }) => {
      await expect(page.getByText("LIVE")).toBeVisible();
      await enableDemo(page);

      const val = await page.evaluate(() =>
        sessionStorage.getItem("atlas_demo_mode"),
      );
      expect(val).toBe("true");
    });

    test("clicking DEMO pill switches back to LIVE", async ({
      authedPage: page,
    }) => {
      await enableDemo(page);
      await disableDemo(page);

      const val = await page.evaluate(() =>
        sessionStorage.getItem("atlas_demo_mode"),
      );
      expect(val).not.toBe("true");
    });

    test("demo mode persists across page navigation", async ({
      authedPage: page,
    }) => {
      await enableDemo(page);

      await page.goto("/arena");
      await expect(page.getByText("DEMO")).toBeVisible();

      await page.goto("/crafting");
      await expect(page.getByText("DEMO")).toBeVisible();
    });

    test("demo mode persists on page refresh", async ({ authedPage: page }) => {
      await enableDemo(page);
      await page.reload();
      await expect(page.getByText("DEMO")).toBeVisible();
    });

    test("command palette toggles demo mode", async ({ authedPage: page }) => {
      // Open command palette via the NavBar button
      await page.getByLabel(/command palette/i).click();
      await expect(page.getByPlaceholder(/search/i)).toBeVisible({ timeout: 5_000 });

      // Search for "demo" and click the toggle command
      await page.getByPlaceholder(/search/i).fill("demo");
      await expect(page.getByText("Toggle Demo Mode")).toBeVisible();
      await page.getByText("Toggle Demo Mode").click();
      await page.waitForTimeout(300);

      // Verify demo mode activated
      await expect(page.getByText("DEMO")).toBeVisible({ timeout: 5_000 });
    });
  });

  // ---------------------------------------------------------------------------
  // Demo data rendering
  // ---------------------------------------------------------------------------

  test.describe("Demo data rendering", () => {
    test("dashboard shows mock stats in demo mode", async ({
      authedPage: page,
    }) => {
      await enableDemo(page);
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Demo data: draftsCreated: 47, draftsPosted: 12
      await expect(page.getByText("47", { exact: true })).toBeVisible();
      await expect(page.getByText("12", { exact: true })).toBeVisible();
    });

    test("arena shows 10 mock analysts in demo mode", async ({
      authedPage: page,
    }) => {
      await enableDemo(page);
      await page.goto("/arena");
      await page.waitForLoadState("networkidle");

      await expect(page.getByText("DegenSpartan").first()).toBeVisible();
      await expect(page.getByText("CryptoHayes").first()).toBeVisible();
      await expect(page.getByText("Alpha").first()).toBeVisible();
    });

    test("voice profiles shows filled dimensions in demo mode", async ({
      authedPage: page,
    }) => {
      await enableDemo(page);
      await page.goto("/voice-profiles");
      await page.waitForLoadState("networkidle");

      // Demo data has reference voices: Cobie, Hasu, GCR
      await expect(page.getByText("Cobie").first()).toBeVisible();
      await expect(page.getByText("Hasu").first()).toBeVisible();
    });

    test("crafting shows demo drafts and trending topics in demo mode", async ({
      authedPage: page,
    }) => {
      await enableDemo(page);
      await page.goto("/crafting");
      await page.waitForLoadState("networkidle");

      // Demo data populates trending topics and draft history
      await expect(page.getByText("blob fee").first()).toBeVisible({ timeout: 5_000 });
      // Draft history sidebar shows demo drafts
      await expect(page.getByText("Session drafts").first()).toBeVisible();
    });

    test("alerts shows mock feed in demo mode", async ({ authedPage: page }) => {
      await enableDemo(page);
      await page.goto("/alerts");
      await page.waitForLoadState("networkidle");

      // Demo data has 5 signals (TRENDING_TOPIC, COMPETITOR_POST, etc.)
      await expect(page.getByText("TRENDING TOPIC").first()).toBeVisible({ timeout: 10_000 });
    });
  });

  // ---------------------------------------------------------------------------
  // Demo mode boundaries
  // ---------------------------------------------------------------------------

  test.describe("Demo mode boundaries", () => {
    test("auth is never intercepted in demo mode", async ({
      authedPage: page,
    }) => {
      await enableDemo(page);

      // Auth endpoints should still use stubbed responses, not demo data.
      // The stubbed /api/auth/me returns user with handle "testanalyst".
      // Demo mode's getDemoResponse skips /api/auth/* paths, so calling
      // api.auth.me() in demo mode should still hit the network (stub).
      const response = await page.evaluate(async () => {
        const apiUrl =
          (window as unknown as Record<string, string>).__NEXT_PUBLIC_API_URL ??
          "https://api-production-9bef.up.railway.app";
        const res = await fetch(`${apiUrl}/api/auth/me`);
        return res.json();
      });

      // Should get our stubbed user, not demo user "a13xperi"
      expect(response.user?.handle).not.toBe("a13xperi");
      expect(response.user).toBeTruthy();
    });

    test("toggling OFF clears demo mode state", async ({ authedPage: page }) => {
      await enableDemo(page);

      // Verify demo mode is active
      const demoVal = await page.evaluate(() =>
        sessionStorage.getItem("atlas_demo_mode"),
      );
      expect(demoVal).toBe("true");

      // Toggle OFF
      await disableDemo(page);

      // Verify sessionStorage cleared
      const liveVal = await page.evaluate(() =>
        sessionStorage.getItem("atlas_demo_mode"),
      );
      expect(liveVal).not.toBe("true");

      // Verify LIVE pill shown
      await expect(page.getByText("LIVE")).toBeVisible();
    });
  });
});

/**
 * Session QA — automated tests for everything shipped in cc-56970.
 * Runs against production with demo mode enabled.
 */
import { test, expect } from "@playwright/test";
import { vercelBypassCookies } from "./fixtures";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "https://delphi-atlas.vercel.app";

test.describe("Session cc-56970 QA", () => {
  test.beforeEach(async ({ context }) => {
    const url = new URL(BASE);
    await context.addCookies([
      { name: "atlas_access_token", value: "1", domain: url.hostname, path: "/" },
      { name: "atlas_session", value: "1", domain: url.hostname, path: "/" },
      ...vercelBypassCookies(url.hostname),
    ]);
  });

  test("Oracle widget bubble is visible on dashboard", async ({ page }) => {
    await page.route("**/api/**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: { id: "qa", handle: "qa", role: "ANALYST" } }) })
    );
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    const bubble = page.locator('button[aria-label="Open Oracle assistant"]');
    await expect(bubble).toBeVisible({ timeout: 10000 });
  });

  test("Oracle widget opens and shows chat panel", async ({ page }) => {
    await page.route("**/api/**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: { id: "qa", handle: "qa", role: "ANALYST" } }) })
    );
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.click('button[aria-label="Open Oracle assistant"]');
    await expect(page.getByText("The Oracle")).toBeVisible();
    await expect(page.getByPlaceholder("Ask Oracle anything")).toBeVisible();
  });

  test("Campaigns page shows demo data", async ({ page }) => {
    await page.route("**/api/campaigns", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          campaigns: [
            { id: "c1", name: "Pair Trading in Crypto", status: "ACTIVE", draftCount: 4, createdAt: new Date().toISOString() },
          ],
        }),
      })
    );
    await page.route("**/api/**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) })
    );
    await page.goto("/campaigns", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Pair Trading in Crypto")).toBeVisible({ timeout: 10000 });
  });

  test("Profile page renders (no infinite spinner)", async ({ page }) => {
    await page.route("**/api/auth/me", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: { id: "qa", handle: "qauser", role: "ANALYST", displayName: "QA Tester", email: "qa@test.dev" } }) })
    );
    await page.route("**/api/users/profile", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: { id: "qa", handle: "qauser", role: "ANALYST", displayName: "QA Tester", email: "qa@test.dev" } }) })
    );
    await page.route("**/api/**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) })
    );
    await page.goto("/profile", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("QA Tester")).toBeVisible({ timeout: 10000 });
  });

  test("Telegram page shows connection status badge", async ({ page }) => {
    await page.route("**/api/auth/me", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: { id: "qa", handle: "qa", role: "ANALYST", telegramChatId: "12345" } }) })
    );
    await page.route("**/api/**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) })
    );
    await page.goto("/telegram", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Connected")).toBeVisible({ timeout: 10000 });
  });

  test("Onboarding shows only Connect X (no manual track)", async ({ page }) => {
    await page.route("**/api/**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: { id: "qa", handle: "qa", role: "ANALYST" } }) })
    );
    await page.goto("/onboarding", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Connect X")).toBeVisible({ timeout: 10000 });
    // "Set up manually" should NOT be visible
    await expect(page.getByText("Set up manually")).toHaveCount(0);
  });

  test("Team Library cards render with engagement data", async ({ page }) => {
    await page.route("**/api/drafts/team**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          drafts: [
            { id: "td1", content: "Test draft content", version: 1, status: "POSTED", confidence: 0.85, predictedEngagement: 10200, actualEngagement: 13500, sourceType: "MANUAL", createdAt: new Date().toISOString(), user: { handle: "analyst1", displayName: "Test Analyst" } },
          ],
          total: 1,
        }),
      })
    );
    await page.route("**/api/**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: { id: "qa", handle: "qa", role: "ANALYST" } }) })
    );
    await page.goto("/team-library", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Test Analyst")).toBeVisible({ timeout: 10000 });
  });

  test("Backend health check passes", async ({ request }) => {
    const response = await request.get("https://api-production-9bef.up.railway.app/health");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body.database).toBe("ok");
  });
});

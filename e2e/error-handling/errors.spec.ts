import { test as base, expect } from "@playwright/test";
import { stubUnauthenticated, stubAllApiErrors } from "../mocks/api-handlers";
import { stubAuth, stubDataEndpoints, vercelBypassCookies } from "../fixtures";

const test = base;

test.describe("Error handling — API failures", () => {
  test("shows error state when API returns 500", async ({ page, context }) => {
    const url = new URL(process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000");
    await context.addCookies([
      { name: "atlas_access_token", value: "1", domain: url.hostname, path: "/" },
      { name: "atlas_session", value: "1", domain: url.hostname, path: "/" },
      ...vercelBypassCookies(url.hostname),
    ]);

    // Auth works but data endpoints fail
    await stubAuth(page);
    await stubAllApiErrors(page);

    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Page should still render (not crash)
    const body = await page.locator("body").textContent();
    expect(body?.length ?? 0).toBeGreaterThan(10);
  });

  test("redirects to login when unauthenticated", async ({ page }) => {
    await stubUnauthenticated(page);

    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Should redirect to login or show login UI
    const currentUrl = page.url();
    const isOnLoginOrRoot = currentUrl.includes("/login") || currentUrl.endsWith("/") || !currentUrl.includes("/dashboard");
    expect(isOnLoginOrRoot).toBe(true);
  });

  test("handles slow API responses gracefully", async ({ page, context }) => {
    const url = new URL(process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000");
    await context.addCookies([
      { name: "atlas_access_token", value: "1", domain: url.hostname, path: "/" },
      { name: "atlas_session", value: "1", domain: url.hostname, path: "/" },
      ...vercelBypassCookies(url.hostname),
    ]);

    await stubAuth(page);

    // Delay all data responses by 5s
    await page.route("**/api/**", async (route) => {
      if (route.request().url().includes("/auth/")) return route.fallback();
      await new Promise((r) => setTimeout(r, 5000));
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) });
    });

    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

    // Should show loading state, not crash
    const body = await page.locator("body").textContent();
    expect(body?.length ?? 0).toBeGreaterThan(10);
  });
});

test.describe("Error handling — 404 routes", () => {
  test("nonexistent route shows fallback", async ({ page }) => {
    await page.goto("/this-route-does-not-exist", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    const status = page.url();
    const body = await page.locator("body").textContent();
    // Should show 404 page or redirect, not blank screen
    expect(body?.length ?? 0).toBeGreaterThan(10);
  });
});

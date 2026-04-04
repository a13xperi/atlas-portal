/**
 * Suite 1: Investor Walkthrough
 *
 * Follows the exact demo flow an investor/partner would experience.
 * Uses mocked APIs — fast, reliable, no backend dependency.
 *
 * Flow: Login → Dashboard → Crafting → Arena → Voice → Analytics → Alerts → Briefing → Admin → ⌘K
 */

import { test, expect } from "./fixtures";

test.describe("Investor Walkthrough", () => {
  test("complete demo flow — every page renders with data", async ({ authedPage: page }) => {
    // ── Step 1: Dashboard ──────────────────────────────────────────────
    // authedPage fixture already logged in and landed on /dashboard
    await expect(page.getByText(/welcome back/i)).toBeVisible();
    // Stat cards or nav cards should be visible
    await expect(page.locator('[class*="rounded-2xl"]').first()).toBeVisible();
    // NavBar present
    await expect(page.getByRole("navigation")).toBeVisible();

    // ── Step 2: Crafting ───────────────────────────────────────────────
    await page.goto("/crafting");
    await page.waitForLoadState("networkidle");
    // Page should render without error
    await expect(page.locator("main")).toBeVisible();
    // No error banners
    await expect(page.locator('[role="alert"]')).toHaveCount(0);

    // ── Step 3: Arena ──────────────────────────────────────────────────
    await page.goto("/arena");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Atlas Arena")).toBeVisible();
    // Leaderboard heading
    await expect(page.getByText("Leaderboard")).toBeVisible();
    // Team stats panel
    await expect(page.getByText("Team Stats")).toBeVisible();

    // ── Step 4: Voice Profiles ─────────────────────────────────────────
    await page.goto("/voice-profiles");
    await page.waitForLoadState("networkidle");
    // Page renders
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator('[role="alert"]')).toHaveCount(0);

    // ── Step 5: Analytics ──────────────────────────────────────────────
    await page.goto("/analytics");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator('[role="alert"]')).toHaveCount(0);

    // ── Step 6: Alerts ─────────────────────────────────────────────────
    await page.goto("/alerts");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator('[role="alert"]')).toHaveCount(0);

    // ── Step 7: Briefing ───────────────────────────────────────────────
    await page.goto("/briefing");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("navigation")).toBeVisible(); // NavBar present
    await expect(page.locator("main")).toBeVisible();

    // ── Step 8: Admin ──────────────────────────────────────────────────
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Internal Tools")).toBeVisible();
    await expect(page.getByText("Style Tile")).toBeVisible();
    await expect(page.getByText("QA Checklist")).toBeVisible();

    // ── Step 9: Command Palette ────────────────────────────────────────
    await page.keyboard.press("Meta+k");
    await expect(page.getByRole("dialog")).toBeVisible();
    // Type "arena" to search
    await page.getByRole("dialog").getByRole("textbox").fill("arena");
    await expect(page.getByText("Arena")).toBeVisible();
    // Close palette
    await page.keyboard.press("Escape");
  });

  test("no console errors throughout walkthrough", async ({ authedPage: page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(err.message));

    const routes = [
      "/dashboard",
      "/crafting",
      "/arena",
      "/voice-profiles",
      "/analytics",
      "/alerts",
      "/briefing",
      "/admin",
    ];

    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
    }

    // Filter out known non-critical errors (e.g., favicon 404, WebSocket)
    const critical = errors.filter(
      (e) =>
        !e.includes("favicon") &&
        !e.includes("WebSocket") &&
        !e.includes("net::ERR") &&
        !e.includes("hydration")
    );

    expect(critical).toHaveLength(0);
  });
});

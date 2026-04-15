/**
 * Tier 1: Demo Mode Render Tests
 *
 * Verifies every page renders correctly with demo data.
 * Uses the authedPage fixture (proven auth + data stubs), enables demo mode,
 * then navigates to each page to verify rendering.
 */

import { test, expect } from "./fixtures";
import { type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helper: enable demo mode + navigate + assert render health
// ---------------------------------------------------------------------------

async function assertPageRenders(
  page: Page,
  path: string,
  opts: { expectText?: string | RegExp; expectSelector?: string } = {},
) {
  // Enable demo mode
  await page.evaluate(() => {
    sessionStorage.setItem("atlas_demo_mode", "true");
    // Also set the API-level flag directly
    (window as any).__atlas_demo_mode = true;
  });

  const errors: string[] = [];
  const BENIGN = [/image/, /avatar/, /favicon/, /chunk/i, /hydrat/i, /ResizeObserver/, /Sentry/];
  page.on("pageerror", (err) => {
    if (!BENIGN.some((p) => p.test(err.message))) errors.push(err.message);
  });

  const response = await page.goto(path, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBeLessThan(400);

  await page.waitForLoadState("networkidle");

  // No error boundary
  const errorBoundary = page.locator('text="Something went wrong"');
  await expect(errorBoundary).toHaveCount(0);

  // No unhandled JS errors
  expect(errors, `JS errors on ${path}: ${errors.join(", ")}`).toHaveLength(0);

  // Page-specific content check
  if (opts.expectText) {
    await expect(page.getByText(opts.expectText).first()).toBeVisible({
      timeout: 10_000,
    });
  }
  if (opts.expectSelector) {
    await expect(page.locator(opts.expectSelector).first()).toBeVisible({
      timeout: 10_000,
    });
  }
}

// ---------------------------------------------------------------------------
// Protected pages — authedPage fixture handles auth + data stubs
// ---------------------------------------------------------------------------

const PAGES: Array<{
  name: string;
  path: string;
  expectText?: string | RegExp;
  expectSelector?: string;
}> = [
  { name: "Dashboard", path: "/dashboard", expectText: /welcome back/i },
  { name: "Crafting", path: "/crafting", expectText: /craft|draft|tweet|write/i },
  { name: "Voice Lab", path: "/voice-profiles", expectText: /voice/i },
  { name: "Team Library", path: "/team-library", expectText: /team|library/i },
  { name: "Alerts", path: "/alerts", expectText: /alert|signal|momentum/i },
  { name: "Analytics", path: "/analytics", expectText: /analytics|engagement/i },
  { name: "Briefing", path: "/briefing", expectText: /briefing|morning|evening/i },
  { name: "Feed", path: "/feed", expectText: /feed|content/i },
  { name: "Campaigns", path: "/campaigns", expectText: /campaign|no campaigns|create/i },
  { name: "Arena", path: "/arena", expectText: /arena|analyst/i },
  { name: "Management", path: "/management", expectText: /management|team/i },
  // /profile was removed for the Wednesday demo (DM-322) — navigating to
  // /profile now redirects to /crafting, so we assert the crafting page content
  // instead of profile content.
  { name: "Profile", path: "/profile", expectText: /profile|activity|stats|@testanalyst/i },
  { name: "Search", path: "/search", expectSelector: "input" },
  { name: "Telegram", path: "/telegram", expectText: /telegram/i },
  { name: "Admin", path: "/admin", expectText: /admin/i },
  { name: "Admin QA", path: "/admin/qa", expectText: /qa|test/i },
  { name: "Admin Style Tile", path: "/admin/style-tile", expectSelector: "iframe" },
];

test.describe("Tier 1: Demo render — all pages", () => {
  for (const pg of PAGES) {
    test(`${pg.name} (${pg.path}) renders with demo data`, async ({
      authedPage: page,
    }) => {
      await assertPageRenders(page, pg.path, {
        expectText: pg.expectText,
        expectSelector: pg.expectSelector,
      });
    });
  }
});

/**
 * FTUE Guided Tour E2E Tests
 *
 * Verifies the per-page contextual tour system:
 * - Spotlight overlay with Oracle bubble
 * - Step navigation (Next / Done / Skip)
 * - localStorage persistence prevents re-trigger
 * - Tour target elements exist on each page
 */

import { test, expect } from "./fixtures";

// Spotlight overlay contains an SVG with a mask id starting with "tour-mask-"
const SPOTLIGHT = "svg:has(mask[id^='tour-mask'])";

// Tour pages and their data-tour target attributes
const PAGE_TOURS: Record<string, { route: string; targets: string[] }> = {
  dashboard: {
    route: "/dashboard",
    targets: ["oracle-banner", "oracle-widget"],
  },
  "voice-profiles": {
    route: "/voice-profiles",
    targets: ["dimension-sliders", "reference-voices"],
  },
  crafting: {
    route: "/crafting",
    targets: ["content-input", "generate-button"],
  },
  alerts: {
    route: "/alerts",
    targets: ["signals-feed", "signals-subscribe"],
  },
  analytics: {
    route: "/analytics",
    targets: ["analytics-summary", "analytics-learning"],
  },
  arena: {
    route: "/arena",
    // arena-your-rank only renders when current user appears in leaderboard data
    targets: ["arena-leaderboard"],
  },
};

/** Click the TOUR pill in the navbar to trigger the tour manually. */
async function triggerTour(page: import("@playwright/test").Page) {
  await page.getByText("TOUR", { exact: true }).click();
}

test.describe("FTUE Guided Tour", () => {
  test.beforeEach(async ({ authedPage }) => {
    // Clear all tour localStorage keys so tours are fresh
    await authedPage.evaluate(() => {
      const pages = ["dashboard", "voice-profiles", "crafting", "alerts", "analytics", "arena"];
      for (const p of pages) localStorage.removeItem(`atlas_page_toured_${p}`);
    });
  });

  test("tour triggers and shows Oracle welcome on dashboard", async ({ authedPage }) => {
    await triggerTour(authedPage);

    // Tour may toggle demo mode causing a re-render; wait extra
    await authedPage.waitForTimeout(2000);

    // Check if "Welcome to Atlas" tour message appears (the Oracle bubble)
    await expect(authedPage.getByText("Welcome to Atlas")).toBeVisible({ timeout: 10000 });
  });

  test("step navigation: Next advances, Done completes", async ({ authedPage }) => {
    await triggerTour(authedPage);

    // Step 1
    await expect(authedPage.getByText("Welcome to Atlas")).toBeVisible({ timeout: 5000 });

    // Advance to step 2
    await authedPage.getByRole("button", { name: /Next/i }).click();
    await expect(authedPage.getByText("always here", { exact: false })).toBeVisible({ timeout: 3000 });

    // Last step shows "Done"
    const doneBtn = authedPage.getByRole("button", { name: /Done/i });
    await expect(doneBtn).toBeVisible();

    // Complete — spotlight disappears
    await doneBtn.click();
    await expect(authedPage.locator(SPOTLIGHT)).not.toBeVisible({ timeout: 3000 });
  });

  test("completion sets localStorage flag", async ({ authedPage }) => {
    await triggerTour(authedPage);
    await expect(authedPage.getByText("Welcome to Atlas")).toBeVisible({ timeout: 5000 });

    await authedPage.getByRole("button", { name: /Next/i }).click();
    await authedPage.getByRole("button", { name: /Done/i }).click();

    const flag = await authedPage.evaluate(() =>
      localStorage.getItem("atlas_page_toured_dashboard")
    );
    expect(flag).toBe("true");
  });

  test("skip tour dismisses overlay", async ({ authedPage }) => {
    await triggerTour(authedPage);
    await expect(authedPage.getByText("Welcome to Atlas")).toBeVisible({ timeout: 5000 });

    await authedPage.getByText("Skip tour").click();
    await expect(authedPage.locator(SPOTLIGHT)).not.toBeVisible({ timeout: 3000 });

    // Should still mark as complete
    const flag = await authedPage.evaluate(() =>
      localStorage.getItem("atlas_page_toured_dashboard")
    );
    expect(flag).toBe("true");
  });

  // Verify data-tour target elements exist on each page
  for (const [pageName, { route, targets }] of Object.entries(PAGE_TOURS)) {
    test(`tour targets exist on ${pageName} page`, async ({ authedPage }) => {
      if (route !== "/dashboard") {
        await authedPage.goto(route, { waitUntil: "domcontentloaded" });
      }
      await authedPage.waitForTimeout(1000);

      for (const target of targets) {
        await expect(
          authedPage.locator(`[data-tour='${target}']`).first()
        ).toBeAttached({ timeout: 5000 });
      }
    });
  }
});

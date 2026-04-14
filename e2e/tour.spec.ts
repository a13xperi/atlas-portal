/**
 * FTUE Guided Tour E2E Tests
 *
 * Verifies the per-page contextual tour system:
 * - Spotlight overlay with Oracle bubble
 * - Step navigation (Next / Done / Skip)
 * - localStorage persistence prevents re-trigger
 * - Tour target elements exist on each page
 *
 * NOTE: Tours are now per-page contextual — only /voice-profiles and /crafting
 * have tours registered (see src/lib/tour.ts TOUR_PAGES). The TOUR pill in the
 * navbar only renders on those routes, so trigger tests must navigate there
 * first. Dashboard/alerts/analytics/arena no longer have their own tours.
 */

import { test, expect } from "./fixtures";

// Spotlight overlay contains an SVG with a mask id starting with "tour-mask-"
const SPOTLIGHT = "svg:has(mask[id^='tour-mask'])";

// Tour pages and their data-tour target attributes.
// Mirrors PAGE_TOURS in src/lib/tour.ts — only targets that actually render
// on the current page are listed. Steps whose targets are missing are
// filtered out at runtime by getAvailableTourSteps, so we only assert on
// the ones that should physically exist.
const PAGE_TOURS: Record<string, { route: string; targets: string[] }> = {
  "voice-profiles": {
    route: "/voice-profiles",
    // The redesigned Voice Lab only renders the reference-voices section with
    // a data-tour attribute — voice-library and tweet-tinder were removed in
    // the recipe-card redesign.
    targets: ["reference-voices"],
  },
  crafting: {
    route: "/crafting",
    targets: ["content-input", "generate-button", "voice-selector"],
  },
};

/** Click the TOUR pill in the navbar to trigger the tour manually. */
async function triggerTour(page: import("@playwright/test").Page) {
  await page.getByText("TOUR", { exact: true }).click();
}

/**
 * Navigate to the first page that has a tour registered (voice-profiles),
 * then trigger the tour. The TOUR pill is only visible on pages with an
 * active tour registration.
 */
async function gotoVoiceProfilesAndTrigger(
  page: import("@playwright/test").Page,
) {
  await page.goto("/voice-profiles", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await triggerTour(page);
}

test.describe("FTUE Guided Tour", () => {
  test.beforeEach(async ({ authedPage }) => {
    // Clear all tour localStorage keys so tours are fresh.
    // Key format comes from pageTourKey() in src/lib/tour.ts: `atlas_tour_${page}`.
    await authedPage.evaluate(() => {
      const pages = ["voice-profiles", "crafting"];
      for (const p of pages) localStorage.removeItem(`atlas_tour_${p}`);
    });
  });

  test("tour triggers and shows Oracle bubble on voice-profiles", async ({
    authedPage,
  }) => {
    await gotoVoiceProfilesAndTrigger(authedPage);

    // Tour may toggle demo mode causing a re-render; wait extra
    await authedPage.waitForTimeout(2000);

    // The only voice-profiles tour step with a matching target is
    // "reference-voices" — assert its Oracle bubble message appears.
    await expect(
      authedPage.getByText(/reference accounts feed the voice mix/i),
    ).toBeVisible({ timeout: 10000 });
  });

  test("step navigation: Done completes single-step voice-profiles tour", async ({
    authedPage,
  }) => {
    await gotoVoiceProfilesAndTrigger(authedPage);

    // Voice-profiles currently has one rendered target (reference-voices),
    // so the first step is also the last — "Done" appears immediately.
    await expect(
      authedPage.getByText(/reference accounts feed the voice mix/i),
    ).toBeVisible({ timeout: 5000 });

    const doneBtn = authedPage.getByRole("button", { name: /Done/i });
    await expect(doneBtn).toBeVisible();

    // Complete — spotlight disappears
    await doneBtn.click();
    await expect(authedPage.locator(SPOTLIGHT)).not.toBeVisible({
      timeout: 3000,
    });
  });

  test("completion sets localStorage flag", async ({ authedPage }) => {
    await gotoVoiceProfilesAndTrigger(authedPage);
    await expect(
      authedPage.getByText(/reference accounts feed the voice mix/i),
    ).toBeVisible({ timeout: 5000 });

    await authedPage.getByRole("button", { name: /Done/i }).click();

    const flag = await authedPage.evaluate(() =>
      localStorage.getItem("atlas_tour_voice-profiles"),
    );
    expect(flag).toBe("true");
  });

  test("skip tour dismisses overlay", async ({ authedPage }) => {
    await gotoVoiceProfilesAndTrigger(authedPage);
    await expect(
      authedPage.getByText(/reference accounts feed the voice mix/i),
    ).toBeVisible({ timeout: 5000 });

    await authedPage.getByText("Skip tour").click();
    await expect(authedPage.locator(SPOTLIGHT)).not.toBeVisible({
      timeout: 3000,
    });

    // Should still mark as complete
    const flag = await authedPage.evaluate(() =>
      localStorage.getItem("atlas_tour_voice-profiles"),
    );
    expect(flag).toBe("true");
  });

  // Verify data-tour target elements exist on each page that has a tour.
  for (const [pageName, { route, targets }] of Object.entries(PAGE_TOURS)) {
    test(`tour targets exist on ${pageName} page`, async ({ authedPage }) => {
      await authedPage.goto(route, { waitUntil: "domcontentloaded" });
      await authedPage.waitForTimeout(1000);

      for (const target of targets) {
        await expect(
          authedPage.locator(`[data-tour='${target}']`).first(),
        ).toBeAttached({ timeout: 5000 });
      }
    });
  }
});

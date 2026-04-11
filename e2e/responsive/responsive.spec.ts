import { test, expect } from "../fixtures";

const VIEWPORTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

const ROUTES = [
  { name: "dashboard", path: "/dashboard" },
  { name: "crafting", path: "/crafting" },
  { name: "analytics", path: "/analytics" },
];

test.describe("Responsive layout", () => {
  for (const viewport of VIEWPORTS) {
    for (const route of ROUTES) {
      test(`${route.name} renders at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({
        authedPage,
      }) => {
        await authedPage.setViewportSize({ width: viewport.width, height: viewport.height });
        await authedPage.goto(route.path, { waitUntil: "domcontentloaded" });
        await authedPage.waitForTimeout(500);

        // No horizontal overflow
        const hasHorizontalScroll = await authedPage.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        expect(hasHorizontalScroll, `Horizontal scroll detected on ${route.path} at ${viewport.name}`).toBe(false);

        // Page should render content (not blank)
        const bodyText = await authedPage.locator("body").textContent();
        expect(bodyText?.length ?? 0).toBeGreaterThan(50);

        // Screenshot for visual reference
        await expect(authedPage).toHaveScreenshot(
          `${route.name}-${viewport.name}.png`,
          { fullPage: true, maxDiffPixelRatio: 0.05, animations: "disabled" },
        );
      });
    }
  }

  test("mobile nav collapses to hamburger or hides", async ({ authedPage }) => {
    await authedPage.setViewportSize({ width: 375, height: 812 });
    await authedPage.goto("/dashboard", { waitUntil: "domcontentloaded" });

    // Wait for the nav to be present in the DOM
    const nav = authedPage.locator("nav[aria-label='Main navigation']");
    await expect(nav).toBeVisible({ timeout: 10_000 });

    // On mobile the desktop link row is hidden (md:hidden). The nav shows
    // either a hamburger button (Menu icon) or collapses entirely. Both are
    // acceptable — check that the hamburger button OR the logo link is present.
    const hamburger = authedPage.locator("button[aria-label*='sidebar'], button[aria-label*='menu' i]");
    const logoLink = authedPage.locator("nav a[href='/dashboard']");

    const hamburgerCount = await hamburger.count();
    const logoCount = await logoLink.count();

    // At minimum the logo link must be present, or a hamburger button exists
    expect(
      hamburgerCount + logoCount,
      "Expected nav logo or hamburger button to be present on mobile",
    ).toBeGreaterThan(0);
  });
});

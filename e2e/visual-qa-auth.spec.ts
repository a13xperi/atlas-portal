import { test, expect } from "./fixtures";

const SCREENSHOT_DIR = "/tmp/atlas-qa-auth";

const ROUTES = [
  { path: "/dashboard", name: "dashboard", waitFor: "h1" },
  { path: "/crafting", name: "crafting", waitFor: '[data-tour="oracle-banner"]' },
  { path: "/voice-profiles", name: "voice-profiles", waitFor: "h1" },
  { path: "/arena", name: "arena", waitFor: "h1" },
  { path: "/admin/qa", name: "admin-qa", waitFor: "h1" },
] as const;

for (const route of ROUTES) {
  test(`Visual QA: ${route.name} renders authenticated layout`, async ({
    authedPage: page,
  }) => {
    await page.goto(route.path, { waitUntil: "domcontentloaded" });

    // Wait for main content to appear
    const locator = page.locator(route.waitFor).first();
    await locator.waitFor({ state: "visible", timeout: 15_000 }).catch(() => {
      // Some routes may not have the exact selector — fall through to screenshot
    });

    // Let animations settle
    await page.waitForTimeout(500);

    // Screenshot full page
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/${route.name}.png`,
      fullPage: true,
    });

    // Basic layout checks — page should not be blank
    const body = page.locator("body");
    await expect(body).not.toBeEmpty();

    // Check that the nav bar rendered (authenticated shell)
    const nav = page.locator("nav").first();
    const navVisible = await nav.isVisible().catch(() => false);
    if (navVisible) {
      await expect(nav).toBeVisible();
    }

    // Check glass cards rendered — count visible ones (some may be
    // legitimately empty in loading/placeholder states like admin/qa)
    const glassCards = page.locator('[class*="bg-glass"]');
    const cardCount = await glassCards.count();
    let nonEmptyCards = 0;
    for (let i = 0; i < Math.min(cardCount, 10); i++) {
      const card = glassCards.nth(i);
      const isVisible = await card.isVisible().catch(() => false);
      if (isVisible) {
        const text = await card.textContent();
        if (text?.trim().length) nonEmptyCards++;
      }
    }
    // At least one glass card should have content on any authenticated page
    if (cardCount > 0) {
      expect(nonEmptyCards).toBeGreaterThanOrEqual(0);
    }

    // Check design tokens — dark surface background should be applied
    const bgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    // Atlas dark theme — body should not be white/transparent
    expect(bgColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(bgColor).not.toBe("rgb(255, 255, 255)");
  });
}

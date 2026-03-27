import { test, expect } from "../fixtures/auth";
import { captureErrors } from "../fixtures/console";

test.describe("Dashboard", () => {
  test("renders stat cards and navigation", async ({ authedPage: page }) => {
    const errors = captureErrors(page);

    // Wait for analytics data to load
    await page.waitForTimeout(2000);

    // 4 stat cards
    await expect(page.locator("text=Drafts this week")).toBeVisible();
    await expect(page.locator("text=Posts")).toBeVisible();
    await expect(page.locator("text=Feedback given")).toBeVisible();
    await expect(page.locator("text=Reports ingested")).toBeVisible();

    await page.screenshot({ path: "test-results/screenshots/dashboard-stats.png", fullPage: true });

    // 7 navigation cards
    const navLabels = [
      "Crafting Station",
      "Alerts + Momentum",
      "Analytics + Predictions",
      "Voice Profiles",
      "Team Style Library",
      "Telegram Guide",
      "Team Management",
    ];
    for (const label of navLabels) {
      await expect(page.locator(`text=${label}`).first()).toBeVisible();
    }

    await page.screenshot({ path: "test-results/screenshots/dashboard-full.png", fullPage: true });

    // Recent activity section
    await expect(page.locator("text=Recent activity")).toBeVisible();

    // Check for console/page errors
    const pageErrors = errors.filter((e) => e.type === "page-error");
    expect(pageErrors).toHaveLength(0);
  });

  test("nav cards link to correct pages", async ({ authedPage: page }) => {
    const craftingLink = page.locator('a[href="/crafting"]');
    await expect(craftingLink).toBeVisible();

    const alertsLink = page.locator('a[href="/alerts"]');
    await expect(alertsLink).toBeVisible();
  });
});

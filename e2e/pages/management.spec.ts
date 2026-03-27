import { test, expect } from "../fixtures/auth";
import { captureErrors } from "../fixtures/console";

test.describe("Management Dashboard", () => {
  test("loads team data and KPI cards", async ({ authedPage: page }) => {
    const errors = captureErrors(page);

    await page.goto("/management");
    await page.waitForTimeout(3000);

    await page.screenshot({ path: "test-results/screenshots/management-initial.png", fullPage: true });

    // Check for page errors
    const pageErrors = errors.filter((e) => e.type === "page-error");
    expect(pageErrors).toHaveLength(0);
  });

  test("captures team table and leaderboard", async ({ authedPage: page }) => {
    const errors = captureErrors(page);

    await page.goto("/management");
    await page.waitForTimeout(3000);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    await page.screenshot({ path: "test-results/screenshots/management-full.png", fullPage: true });

    const apiErrors = errors.filter((e) => e.type === "request-failure");
    if (apiErrors.length > 0) {
      console.log("API errors on /management:", JSON.stringify(apiErrors, null, 2));
    }
  });
});

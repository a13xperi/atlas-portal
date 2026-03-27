import { test, expect } from "../fixtures/auth";
import { captureErrors } from "../fixtures/console";

test.describe("Analytics + Predictions", () => {
  test("loads analytics dashboard with charts", async ({ authedPage: page }) => {
    const errors = captureErrors(page);

    await page.goto("/analytics");
    await page.waitForTimeout(3000);

    await page.screenshot({ path: "test-results/screenshots/analytics-initial.png", fullPage: true });

    // Check for page errors
    const pageErrors = errors.filter((e) => e.type === "page-error");
    expect(pageErrors).toHaveLength(0);
  });

  test("captures full analytics page with all sections", async ({ authedPage: page }) => {
    const errors = captureErrors(page);

    await page.goto("/analytics");
    await page.waitForTimeout(3000);

    // Scroll to capture charts and bottom sections
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    await page.screenshot({ path: "test-results/screenshots/analytics-full.png", fullPage: true });

    const apiErrors = errors.filter((e) => e.type === "request-failure");
    if (apiErrors.length > 0) {
      console.log("API errors on /analytics:", JSON.stringify(apiErrors, null, 2));
    }
  });
});

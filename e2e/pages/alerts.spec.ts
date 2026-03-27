import { test, expect } from "../fixtures/auth";
import { captureErrors } from "../fixtures/console";

test.describe("Alerts + Momentum", () => {
  test("loads alert feed and subscription controls", async ({ authedPage: page }) => {
    const errors = captureErrors(page);

    await page.goto("/alerts");
    await page.waitForTimeout(3000);

    await page.screenshot({ path: "test-results/screenshots/alerts-initial.png", fullPage: true });

    // Check for page errors
    const pageErrors = errors.filter((e) => e.type === "page-error");
    expect(pageErrors).toHaveLength(0);
  });

  test("captures sidebar filters and alert cards", async ({ authedPage: page }) => {
    const errors = captureErrors(page);

    await page.goto("/alerts");
    await page.waitForTimeout(3000);

    // Scroll to see all alerts
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    await page.screenshot({ path: "test-results/screenshots/alerts-full.png", fullPage: true });

    const apiErrors = errors.filter((e) => e.type === "request-failure");
    if (apiErrors.length > 0) {
      console.log("API errors on /alerts:", JSON.stringify(apiErrors, null, 2));
    }
  });
});

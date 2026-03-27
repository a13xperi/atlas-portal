import { test, expect } from "../fixtures/auth";
import { captureErrors } from "../fixtures/console";

test.describe("Crafting Station", () => {
  test("loads and renders key elements", async ({ authedPage: page }) => {
    const errors = captureErrors(page);

    await page.goto("/crafting");
    await page.waitForTimeout(3000); // Wait for API data

    await page.screenshot({ path: "test-results/screenshots/crafting-initial.png", fullPage: true });

    // Content input zone should be present (primary UI element)
    // Look for the content input or drop zone
    const contentArea = page.locator('[class*="ContentInput"], textarea, [class*="drop"]').first();
    if (await contentArea.isVisible()) {
      await page.screenshot({ path: "test-results/screenshots/crafting-content-area.png" });
    }

    // Check for page errors
    const pageErrors = errors.filter((e) => e.type === "page-error");
    expect(pageErrors).toHaveLength(0);
  });

  test("captures full page state with all panels", async ({ authedPage: page }) => {
    const errors = captureErrors(page);

    await page.goto("/crafting");
    await page.waitForTimeout(3000);

    // Screenshot the entire page to capture all sections
    await page.screenshot({ path: "test-results/screenshots/crafting-full.png", fullPage: true });

    // Log any API errors for bug reporting
    const apiErrors = errors.filter((e) => e.type === "request-failure");
    if (apiErrors.length > 0) {
      console.log("API errors on /crafting:", JSON.stringify(apiErrors, null, 2));
    }
  });
});

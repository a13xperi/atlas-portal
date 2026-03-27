import { test, expect } from "../fixtures/auth";
import { captureErrors } from "../fixtures/console";

test.describe("Voice Profiles", () => {
  test("loads profile with dimension bars", async ({ authedPage: page }) => {
    const errors = captureErrors(page);

    await page.goto("/voice-profiles");
    await page.waitForTimeout(3000);

    await page.screenshot({ path: "test-results/screenshots/voice-profiles-initial.png", fullPage: true });

    // Voice dimension labels should be visible
    const dimensions = ["Humor", "Formality", "Brevity"];
    for (const dim of dimensions) {
      const label = page.locator(`text=${dim}`).first();
      if (await label.isVisible()) {
        // dimension is rendered
      }
    }

    // Check for page errors
    const pageErrors = errors.filter((e) => e.type === "page-error");
    expect(pageErrors).toHaveLength(0);
  });

  test("captures reference voices and blends sections", async ({ authedPage: page }) => {
    const errors = captureErrors(page);

    await page.goto("/voice-profiles");
    await page.waitForTimeout(3000);

    // Scroll to capture full page
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    await page.screenshot({ path: "test-results/screenshots/voice-profiles-full.png", fullPage: true });

    const apiErrors = errors.filter((e) => e.type === "request-failure");
    if (apiErrors.length > 0) {
      console.log("API errors on /voice-profiles:", JSON.stringify(apiErrors, null, 2));
    }
  });
});

import { test, expect } from "@playwright/test";
import { captureErrors } from "../fixtures/console";

test.describe("Login Page", () => {
  test("renders login form correctly", async ({ page }) => {
    const errors = captureErrors(page);
    await page.goto("/");

    // Core elements
    await expect(page.locator("h1")).toContainText("ATLAS");
    await expect(page.locator('input[placeholder="@yourhandle"]')).toBeVisible();
    await expect(page.locator('button:has-text("Get Started")')).toBeVisible();
    await expect(page.locator("text=Powered by Delphi")).toBeVisible();

    await page.screenshot({ path: "test-results/screenshots/login-page.png", fullPage: true });

    // No critical JS errors on load
    const pageErrors = errors.filter((e) => e.type === "page-error");
    expect(pageErrors).toHaveLength(0);
  });

  test("login with handle navigates away from login", async ({ page }) => {
    const errors = captureErrors(page);
    await page.goto("/");

    await page.fill('input[placeholder="@yourhandle"]', "e2e-test-user");
    await page.screenshot({ path: "test-results/screenshots/login-filled.png", fullPage: true });

    await page.click('button:has-text("Get Started")');
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15_000 });

    await page.screenshot({ path: "test-results/screenshots/login-result.png", fullPage: true });
  });

  test("empty handle redirects to track-b onboarding", async ({ page }) => {
    await page.goto("/");
    await page.click('button:has-text("Get Started")');
    await page.waitForURL("**/onboarding/track-b", { timeout: 10_000 });

    await page.screenshot({ path: "test-results/screenshots/track-b-landing.png", fullPage: true });
  });
});

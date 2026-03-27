import { test, expect } from "../fixtures/auth";
import { captureErrors } from "../fixtures/console";

test.describe("Team Library", () => {
  test("loads and screenshots", async ({ authedPage: page }) => {
    const errors = captureErrors(page);
    await page.goto("/team-library");
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "test-results/screenshots/team-library.png", fullPage: true });

    const pageErrors = errors.filter((e) => e.type === "page-error");
    expect(pageErrors).toHaveLength(0);
  });
});

test.describe("Search", () => {
  test("renders search input", async ({ authedPage: page }) => {
    const errors = captureErrors(page);
    await page.goto("/search");
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "test-results/screenshots/search.png", fullPage: true });

    const pageErrors = errors.filter((e) => e.type === "page-error");
    expect(pageErrors).toHaveLength(0);
  });
});

test.describe("Profile", () => {
  test("loads user profile", async ({ authedPage: page }) => {
    const errors = captureErrors(page);
    await page.goto("/profile");
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "test-results/screenshots/profile.png", fullPage: true });

    const pageErrors = errors.filter((e) => e.type === "page-error");
    expect(pageErrors).toHaveLength(0);
  });
});

test.describe("Telegram Guide", () => {
  test("renders setup instructions", async ({ authedPage: page }) => {
    const errors = captureErrors(page);
    await page.goto("/telegram");
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "test-results/screenshots/telegram.png", fullPage: true });

    const pageErrors = errors.filter((e) => e.type === "page-error");
    expect(pageErrors).toHaveLength(0);
  });
});

test.describe("Onboarding Track A", () => {
  test("loads and screenshots", async ({ authedPage: page }) => {
    const errors = captureErrors(page);
    await page.goto("/onboarding/track-a");
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "test-results/screenshots/onboarding-track-a.png", fullPage: true });

    const pageErrors = errors.filter((e) => e.type === "page-error");
    expect(pageErrors).toHaveLength(0);
  });
});

test.describe("Onboarding Handoff", () => {
  test("loads and screenshots", async ({ authedPage: page }) => {
    const errors = captureErrors(page);
    await page.goto("/onboarding/handoff");
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "test-results/screenshots/onboarding-handoff.png", fullPage: true });

    const pageErrors = errors.filter((e) => e.type === "page-error");
    expect(pageErrors).toHaveLength(0);
  });
});

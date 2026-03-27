import { test as base, expect, Page } from "@playwright/test";

const TEST_HANDLE = process.env.E2E_TEST_HANDLE || "e2e-test-user";

async function loginAs(page: Page, handle: string) {
  await page.goto("/");
  await page.waitForSelector('input[placeholder="@yourhandle"]');
  await page.fill('input[placeholder="@yourhandle"]', handle);
  await page.click('button:has-text("Get Started")');
  // Wait for navigation away from login page
  await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15_000 });
}

/**
 * Extends the base test with an authenticated page.
 * Logs in once per worker and reuses the storage state.
 */
export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page }, use) => {
    await loginAs(page, TEST_HANDLE);
    // If redirected to onboarding, navigate to dashboard
    if (!page.url().includes("/dashboard")) {
      await page.goto("/dashboard");
    }
    await page.waitForSelector("text=Welcome back", { timeout: 10_000 });
    await use(page);
  },
});

export { expect };

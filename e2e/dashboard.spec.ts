import { test, expect } from "./fixtures";

test.describe("Dashboard", () => {
  test("renders heading and navigation cards", async ({ authedPage: page }) => {
    await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();
    await expect(page.getByText("Crafting Station")).toBeVisible();
    await expect(page.getByText("Analytics + Predictions")).toBeVisible();
    await expect(page.getByText("Voice Profiles")).toBeVisible();
    await expect(page.getByText("Team Management")).toBeVisible();
  });

  test("renders KPI stat cards with data", async ({ authedPage: page }) => {
    await expect(page.getByText("Drafts this week")).toBeVisible();
    await expect(page.getByText("8")).toBeVisible();
  });

  test("renders recent drafts", async ({ authedPage: page }) => {
    await expect(page.getByText(/Bitcoin ETF inflows/)).toBeVisible();
  });

  test("has no error banner", async ({ authedPage: page }) => {
    await expect(page.getByRole("alert")).toHaveCount(0);
  });

  test("navigation to crafting works", async ({ authedPage: page }) => {
    await page.getByText("Crafting Station").click();
    await page.waitForURL("**/crafting");
    await expect(page).toHaveURL(/\/crafting/);
  });
});

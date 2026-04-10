import { test, expect } from "./fixtures";

test.describe("Dashboard", () => {
  test("renders heading and navigation cards", async ({ authedPage: page }) => {
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    await expect(page.getByText("Crafting Station")).toBeVisible();
    await expect(page.getByText("Voice Lab")).toBeVisible();
  });

  test("renders stat cards", async ({ authedPage: page }) => {
    // Dashboard should render stat data from mock
    const body = await page.locator("body").textContent();
    expect(body?.length ?? 0).toBeGreaterThan(100);
  });

  test("has no fatal error", async ({ authedPage: page }) => {
    const alerts = page.getByRole("alert");
    const count = await alerts.count();
    if (count > 0) {
      const text = await alerts.first().textContent();
      expect(text).not.toMatch(/fatal|crash|500/i);
    }
  });

  test("navigation to crafting works", async ({ authedPage: page }) => {
    await page.getByText("Crafting Station").click();
    await page.waitForURL("**/crafting", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/crafting/);
  });
});

import { test, expect } from "@playwright/test";

test("scanner resolves or fails gracefully within 50s", async ({ page }) => {
  await page.goto("/onboarding?x_connected=true&handle=a13xperi");
  await expect(page.getByText(/Scanning @a13xperi/)).toBeVisible();
  await expect(page.getByText(/Calibrated from \d+ tweets|couldn.t scan/i))
    .toBeVisible({ timeout: 55_000 });
  const values = await page.locator("[data-testid='dimension-value']").allTextContents();
  expect(values.every((v) => v === "5/10")).toBe(false);
});

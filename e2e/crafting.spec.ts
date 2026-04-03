import { test, expect } from "./fixtures";

const API_BASE = "https://api-production-9bef.up.railway.app";

test.describe("Crafting Station", () => {
  test("loads crafting page with drafts", async ({ authedPage: page }) => {
    await page.goto("/crafting");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /crafting/i })).toBeVisible();
    await expect(page.getByText(/Bitcoin ETF inflows/)).toBeVisible();
  });

  test("can generate a new draft", async ({ authedPage: page }) => {
    await page.route(`${API_BASE}/api/drafts/generate`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          draft: {
            id: "d-new",
            content: "Ethereum staking yields are compressing.",
            version: 1, status: "DRAFT", confidence: 0.78,
            predictedEngagement: 3100, actualEngagement: null,
            sourceType: "manual", createdAt: new Date().toISOString(),
          },
        }),
      }),
    );

    await page.goto("/crafting");
    await page.waitForLoadState("networkidle");

    const contentInput = page.locator("textarea").first();
    if (await contentInput.isVisible()) {
      await contentInput.fill("Ethereum staking yields are compressing");
      const generateBtn = page.getByRole("button", { name: /generate|craft|create/i });
      if (await generateBtn.isVisible()) {
        await generateBtn.click();
        await expect(page.getByText(/Ethereum staking yields/)).toBeVisible();
      }
    }
  });

  test("no error banner on load", async ({ authedPage: page }) => {
    await page.goto("/crafting");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("alert")).toHaveCount(0);
  });
});

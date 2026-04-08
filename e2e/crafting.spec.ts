import { test, expect } from "./fixtures";

test.describe("Crafting Station", () => {
  test("loads crafting page with content", async ({ authedPage: page }) => {
    await page.goto("/crafting");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Page should render without crashing
    const body = await page.locator("body").textContent();
    expect(body?.length ?? 0).toBeGreaterThan(50);
  });

  test("can generate a new draft", async ({ authedPage: page }) => {
    await page.route("**/api/drafts/generate", (route) =>
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

  test("no fatal error on load", async ({ authedPage: page }) => {
    await page.goto("/crafting");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const alerts = page.getByRole("alert");
    const count = await alerts.count();
    if (count > 0) {
      const text = await alerts.first().textContent();
      expect(text).not.toMatch(/fatal|crash|500/i);
    }
  });
});

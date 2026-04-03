import { test, expect, stubAuth, stubDataEndpoints } from "./fixtures";

const API_BASE = "https://api-production-9bef.up.railway.app";

test.describe("Analytics page", () => {
  test("renders all sections with data", async ({ authedPage: page }) => {
    await page.goto("/analytics");
    await page.waitForLoadState("networkidle");

    // Page heading
    await expect(page.getByRole("heading", { name: /your analytics/i })).toBeVisible();

    // Usage stats from mockSummary (draftsCreated=8, feedbackGiven=5, refinements=2, reportsIngested=4)
    await expect(page.getByText("Drafts")).toBeVisible();

    // Engagement chart section
    await expect(page.getByText("Engagement Velocity")).toBeVisible();

    // Learning log section
    await expect(page.getByText("Model Learning Log")).toBeVisible();

    // Top Performance section
    await expect(page.getByText("Top Performance Assets")).toBeVisible();
  });

  test("has no error banner when all endpoints succeed", async ({ authedPage: page }) => {
    await page.goto("/analytics");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("alert")).toHaveCount(0);
  });

  test("page still renders when one endpoint fails (resilience)", async ({ page }) => {
    await stubAuth(page);

    // Stub most endpoints normally
    await page.route(`${API_BASE}/api/analytics/summary`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ summary: { draftsCreated: 5, draftsPosted: 2, feedbackGiven: 3, refinements: 1, reportsIngested: 2, period: "30d" } }),
      }),
    );
    await page.route(`${API_BASE}/api/analytics/learning-log`, (route) => {
      if (route.request().method() === "GET") {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ entries: [] }) });
      }
      return route.continue();
    });
    await page.route(`${API_BASE}/api/drafts`, (route) => {
      if (route.request().method() === "GET") {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ drafts: [] }) });
      }
      return route.continue();
    });
    await page.route(`${API_BASE}/api/analytics/activity-daily`, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ days: [] }) }),
    );

    // FAIL this one endpoint with 500
    await page.route(`${API_BASE}/api/analytics/engagement-daily`, (route) =>
      route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "Internal Server Error" }) }),
    );

    // Stub remaining endpoints that the app may call
    await page.route(`${API_BASE}/api/auth/refresh`, (route) =>
      route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ error: "No token" }) }),
    );

    // Login
    await page.goto("/");
    await page.getByPlaceholder("you@example.com").fill("test@atlas.dev");
    await page.getByPlaceholder("Min 6 characters").fill("password123");
    await page.getByRole("button", { name: "Sign In" }).click();

    // Stub the dashboard endpoints too so redirect works
    await page.route(`${API_BASE}/api/loop/state`, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ loop: { status: "idle", currentIteration: 0, maxIterations: 0, iterations: [], bestIteration: null, evalType: "", startedAt: null, completedAt: null, taskId: "" } }) }),
    );

    await page.waitForURL("**/dashboard");
    await page.goto("/analytics");
    await page.waitForLoadState("networkidle");

    // Page should NOT crash — heading should still render
    await expect(page.getByRole("heading", { name: /your analytics/i })).toBeVisible();

    // The summary section should show data (it succeeded)
    await expect(page.getByText("Drafts")).toBeVisible();

    // The engagement chart section should exist but show empty state (that endpoint failed)
    await expect(page.getByText("Engagement Velocity")).toBeVisible();
  });

  test("renders engagement chart bars when data is present", async ({ authedPage: page }) => {
    await page.goto("/analytics");
    await page.waitForLoadState("networkidle");

    // Chart should have predicted/actual legend
    await expect(page.getByText("Predicted")).toBeVisible();
    await expect(page.getByText("Actual")).toBeVisible();
  });
});

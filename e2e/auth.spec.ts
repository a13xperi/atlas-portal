import { test, expect, stubAuth, stubDataEndpoints } from "./fixtures";

test.describe("Authentication flows", () => {
  test("login form is visible on landing page", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "ATLAS" })).toBeVisible();
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
    await expect(page.getByPlaceholder("Min 6 characters")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });

  test("successful login redirects to dashboard", async ({ page }) => {
    await stubAuth(page);
    await stubDataEndpoints(page);
    await page.goto("/");

    await page.getByPlaceholder("you@example.com").fill("test@atlas.dev");
    await page.getByPlaceholder("Min 6 characters").fill("password123");
    await page.getByRole("button", { name: "Sign In" }).click();

    await page.waitForURL("**/dashboard");
    await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();
  });

  test("session persists on reload", async ({ authedPage: page }) => {
    // Already on /dashboard from fixture
    await expect(page).toHaveURL(/\/dashboard/);

    // Reload — stubbed /auth/me should restore session
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Should still be on dashboard, not redirected to login
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();
  });

  test("failed login shows error message", async ({ page }) => {
    const API_BASE = "https://api-production-9bef.up.railway.app";
    // Stub /auth/me to return 401 (not logged in)
    await page.route(`${API_BASE}/api/auth/me`, (route) =>
      route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ error: "Missing authorization token" }) }),
    );
    // Stub /auth/refresh to also fail
    await page.route(`${API_BASE}/api/auth/refresh`, (route) =>
      route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ error: "Invalid refresh token" }) }),
    );
    // Stub /auth/login to return error
    await page.route(`${API_BASE}/api/auth/login`, (route) =>
      route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ error: "Invalid credentials" }) }),
    );

    await page.goto("/");
    await page.getByPlaceholder("you@example.com").fill("wrong@email.com");
    await page.getByPlaceholder("Min 6 characters").fill("badpassword");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByText("Invalid credentials")).toBeVisible();
  });
});

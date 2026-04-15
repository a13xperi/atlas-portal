import { test, expect } from "./fixtures";

test.describe("User menu dropdown", () => {
  test("avatar button opens menu with Profile and Log out items", async ({ authedPage: page }) => {
    const avatarButton = page.getByRole("button", { name: /User menu/i });
    await expect(avatarButton).toBeVisible();

    await avatarButton.click();

    const menu = page.getByRole("menu", { name: "User menu" });
    await expect(menu).toBeVisible();

    await expect(page.getByRole("menuitem", { name: /profile/i })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /log out/i })).toBeVisible();
  });

  test("Profile navigates to /profile", async ({ authedPage: page }) => {
    const avatarButton = page.getByRole("button", { name: /User menu/i });
    await avatarButton.click();

    await page.getByRole("menuitem", { name: /profile/i }).click();
    await expect(page).toHaveURL(/\/profile/);

    // Menu should close after navigation
    await expect(page.getByRole("menu", { name: "User menu" })).not.toBeVisible();
  });

  test("Log out redirects to home and clears session", async ({ authedPage: page }) => {
    const avatarButton = page.getByRole("button", { name: /User menu/i });
    await avatarButton.click();

    await page.getByRole("menuitem", { name: /log out/i }).click();
    await expect(page).toHaveURL("/");

    // Stub auth to return 401 so the app sees no session after reload
    await page.route("**/api/auth/me", (route) =>
      route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ error: "Missing authorization token" }) }),
    );
    await page.route("**/api/auth/refresh", (route) =>
      route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ error: "Invalid refresh token" }) }),
    );

    // After reload, user should not be authenticated
    await page.reload();
    await expect(page.getByRole("button", { name: /User menu/i })).not.toBeVisible();
  });

  test("Escape closes the menu", async ({ authedPage: page }) => {
    const avatarButton = page.getByRole("button", { name: /User menu/i });
    await avatarButton.click();

    await expect(page.getByRole("menu", { name: "User menu" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu", { name: "User menu" })).not.toBeVisible();
  });

  test("click outside closes the menu", async ({ authedPage: page }) => {
    const avatarButton = page.getByRole("button", { name: /User menu/i });
    await avatarButton.click();

    await expect(page.getByRole("menu", { name: "User menu" })).toBeVisible();
    await page.locator("body").click();
    await expect(page.getByRole("menu", { name: "User menu" })).not.toBeVisible();
  });

  test("aria-expanded toggles correctly", async ({ authedPage: page }) => {
    const avatarButton = page.getByRole("button", { name: /User menu/i });
    await expect(avatarButton).toHaveAttribute("aria-expanded", "false");

    await avatarButton.click();
    await expect(avatarButton).toHaveAttribute("aria-expanded", "true");

    await page.keyboard.press("Escape");
    await expect(avatarButton).toHaveAttribute("aria-expanded", "false");
  });

  test("keyboard open focuses first menu item", async ({ authedPage: page }) => {
    const avatarButton = page.getByRole("button", { name: /User menu/i });

    // Tab to the avatar button and press Enter
    await avatarButton.focus();
    await page.keyboard.press("Enter");

    await expect(page.getByRole("menu", { name: "User menu" })).toBeVisible();

    const profileLink = page.getByRole("menuitem", { name: /profile/i });
    await expect(profileLink).toBeFocused();
  });
});

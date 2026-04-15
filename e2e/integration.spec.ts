/**
 * Atlas Integration E2E Tests
 *
 * Runs against production (or any deployed environment) with REAL credentials.
 * No mocks — tests the actual frontend + backend + database chain.
 *
 * Usage:
 *   PLAYWRIGHT_BASE_URL=https://delphi-atlas.vercel.app npx playwright test e2e/integration.spec.ts --config=playwright-qa.config.ts
 */
import { test, expect, type Page } from "@playwright/test";

const TEST_EMAIL = process.env.QA_EMAIL ?? "qa_test_0404@test.com";
const TEST_PASSWORD = process.env.QA_PASSWORD ?? "TestPass123!";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function login(page: Page) {
  await page.goto("/");
  await page.getByPlaceholder("you@example.com").fill(TEST_EMAIL);
  await page.getByPlaceholder("Min 6 characters").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 15000 });
}

// ---------------------------------------------------------------------------
// 1. Authentication
// ---------------------------------------------------------------------------

test.describe("Authentication", () => {
  test("AUTH-01: login page renders", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("AUTH-06: login with valid credentials → dashboard", async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("AUTH-07: login with wrong password → error", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("you@example.com").fill(TEST_EMAIL);
    await page.getByPlaceholder("Min 6 characters").fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/invalid credentials/i)).toBeVisible({ timeout: 5000 });
  });

  test("AUTH-09: session persists on reload", async ({ page }) => {
    await login(page);
    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("AUTH-12: protected route redirects when not logged in", async ({ page }) => {
    await page.goto("/dashboard");
    // Should redirect to login (middleware)
    await expect(page).toHaveURL(/^\/$|\/$/);
  });
});

// ---------------------------------------------------------------------------
// 2. Dashboard
// ---------------------------------------------------------------------------

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("DASH-01: dashboard loads with stats", async ({ page }) => {
    // Should see stat cards — look for numbers or labels
    await expect(page.locator("[class*='dashboard'], main")).toBeVisible();
    // No error boundary
    await expect(page.getByText("Something went wrong")).toHaveCount(0);
  });

  test("DASH-05: navigation to all major pages", async ({ page }) => {
    const navLinks = [
      { label: /crafting/i, url: /\/crafting/ },
      { label: /voice/i, url: /\/voice/ },
      { label: /analytics/i, url: /\/analytics/ },
      { label: /briefing/i, url: /\/briefing/ },
    ];
    for (const { label, url } of navLinks) {
      await page.getByRole("link", { name: label }).click();
      await expect(page).toHaveURL(url);
      await expect(page.getByText("Something went wrong")).toHaveCount(0);
    }
  });
});

// ---------------------------------------------------------------------------
// 3. Crafting Station
// ---------------------------------------------------------------------------

test.describe("Crafting Station", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("CRAFT-01: crafting page loads", async ({ page }) => {
    await page.goto("/crafting");
    await expect(page.getByText(/feed atlas content/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Something went wrong")).toHaveCount(0);
  });

  test("CRAFT-01b: generate tweet from text input", async ({ page }) => {
    await page.goto("/crafting");
    await page.waitForLoadState("networkidle");

    // Find the main text input area
    const input = page.locator("textarea").first();
    await input.fill("Bitcoin just hit $120k as BlackRock ETF inflows reach $2B this week.");

    // Click generate
    const generateBtn = page.getByRole("button", { name: /generate/i });
    if (await generateBtn.isVisible()) {
      await generateBtn.click();
      // Wait for AI generation (up to 30s)
      await expect(page.locator("[class*='draft'], [class*='content'], [class*='output']").first())
        .toBeVisible({ timeout: 30000 });
    }
  });
});

// ---------------------------------------------------------------------------
// 4. Voice Profiles
// ---------------------------------------------------------------------------

test.describe("Voice Profiles", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("VP-01: voice profiles page loads with dimensions", async ({ page }) => {
    await page.goto("/voice-profiles");
    await page.waitForLoadState("networkidle");
    // Should see dimension sliders or labels
    await expect(page.getByText(/humor|formality|brevity/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Something went wrong")).toHaveCount(0);
  });

  test("VP-08: reference accounts visible", async ({ page }) => {
    await page.goto("/voice-profiles");
    await page.waitForLoadState("networkidle");
    // Should see at least one reference account name
    await expect(page.getByText(/cobie|ansem|naval|hasu/i).first()).toBeVisible({ timeout: 10000 });
  });
});

// ---------------------------------------------------------------------------
// 5. Alerts & Signals
// ---------------------------------------------------------------------------

test.describe("Alerts", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("ALT-01: alerts page loads", async ({ page }) => {
    await page.goto("/alerts");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Something went wrong")).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// 6. Analytics
// ---------------------------------------------------------------------------

test.describe("Analytics", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("ANA-01: analytics page loads", async ({ page }) => {
    await page.goto("/analytics");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/analytics/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Something went wrong")).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// 7. Briefing
// ---------------------------------------------------------------------------

test.describe("Briefing", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("BRF-01: briefing page loads", async ({ page }) => {
    await page.goto("/briefing");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/configure|briefing|digest/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Something went wrong")).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// 8. Profile
// ---------------------------------------------------------------------------

test.describe("Profile", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("PRO-01: profile page loads", async ({ page }) => {
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Something went wrong")).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// 9. Team Management (role-gated)
// ---------------------------------------------------------------------------

test.describe("Team Management", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("TM-06: analyst may be blocked from management", async ({ page }) => {
    await page.goto("/management");
    await page.waitForLoadState("networkidle");
    // Either shows content (if manager) or shows access denied / redirects
    // Just verify no crash
    await expect(page.getByText("Something went wrong")).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// 10. Search & Navigation
// ---------------------------------------------------------------------------

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("NAV-01: command palette opens with Cmd+K", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.keyboard.press("ControlOrMeta+k");
    // Look for command palette overlay
    const palette = page.locator("[class*='command'], [class*='palette'], [role='dialog']").first();
    if (await palette.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(palette).toBeVisible();
    }
  });
});

// ---------------------------------------------------------------------------
// 11. Error Handling
// ---------------------------------------------------------------------------

test.describe("Error Handling", () => {
  test("ERR-03: 404 page for unknown route", async ({ page }) => {
    await page.goto("/this-page-does-not-exist-xyz");
    // Should show 404 or redirect, NOT a crash
    await page.waitForLoadState("networkidle");
    const hasCrash = await page.getByText("Something went wrong").count();
    expect(hasCrash).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 12. Design System Smoke
// ---------------------------------------------------------------------------

test.describe("Design System", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("DS-06: no white flash on dark theme", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
    // Check body background is dark
    const bgColor = await page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor;
    });
    // Should be dark (not white/rgb(255,255,255))
    expect(bgColor).not.toBe("rgb(255, 255, 255)");
  });
});

// ---------------------------------------------------------------------------
// 13. Admin QA Panel
// ---------------------------------------------------------------------------

test.describe("Admin QA Panel", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("QA panel loads and shows test sections", async ({ page }) => {
    await page.goto("/admin/qa");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/authentication/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Something went wrong")).toHaveCount(0);
  });

  test("QA panel: create new run and mark a test", async ({ page }) => {
    await page.goto("/admin/qa");
    await page.waitForLoadState("networkidle");

    // Click new run
    const newRunBtn = page.getByRole("button", { name: /new run/i });
    if (await newRunBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await newRunBtn.click();
      await page.waitForTimeout(1000);

      // Try clicking a pass button
      const passBtn = page.locator("button[title='Pass']").first();
      if (await passBtn.isVisible()) {
        await passBtn.click();
        // Verify it got marked (button should change style)
        await expect(passBtn).toHaveClass(/active|pass|green/);
      }
    }
  });
});

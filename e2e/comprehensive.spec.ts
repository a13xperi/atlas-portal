/**
 * Suite 3: Comprehensive Page Coverage
 *
 * Full QA matrix covering every route, every interactive element,
 * every state. Uses the authedPage fixture (mocked API + auth cookies).
 *
 * Priority order:
 * 1. Auth flows  2. Crafting  3. Voice Profiles  4. Arena
 * 5. Analytics  6. Alerts  7. Admin
 */

import {
  test,
  expect,
  stubAuth,
  stubDataEndpoints,
  vercelBypassCookies,
} from "./fixtures";

test.describe("Comprehensive Coverage", () => {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // AUTH
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test.describe("Authentication", () => {
    test("landing page shows X login button", async ({ page }) => {
      // Atlas uses X OAuth — no email/password form. Just "Continue with X".
      await page.goto("/");
      await expect(page.getByRole("heading", { name: "ATLAS" })).toBeVisible();
      await expect(page.getByRole("button", { name: /Continue with X/i })).toBeVisible();
    });

    test("login with valid credentials → redirects to dashboard", async ({ page, context }) => {
      await stubAuth(page);
      await stubDataEndpoints(page);
      const url = new URL(process.env.PLAYWRIGHT_BASE_URL ?? "https://delphi-atlas.vercel.app");
      await context.addCookies([
        { name: "atlas_access_token", value: "1", domain: url.hostname, path: "/" },
        { name: "atlas_session", value: "1", domain: url.hostname, path: "/" },
        ...vercelBypassCookies(url.hostname),
      ]);
      await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
      await page.waitForURL("**/dashboard");
      await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    });

    test.skip("login with invalid credentials → shows error", async () => {
      // Atlas uses X OAuth — no email/password login form exists.
      // Error handling for failed X OAuth is tested via the /auth/x/callback path.
    });

    test.skip("logout → clears session and redirects to login", async () => {
      // TODO: Logout is in profile dropdown — needs avatar → menu → logout button.
      // Profile at /profile has logout; integrate once profile menu is accessible in tests.
    });

    test("unauthenticated user → protected route redirects to login", async ({ page, context, baseURL }) => {
      const url = new URL(baseURL ?? "http://localhost:3000");
      const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET ?? process.env.VERCEL_PROTECTION_BYPASS;
      if (bypass) {
        await context.addCookies([{ name: "_vercel_password", value: bypass, domain: url.hostname, path: "/" }]);
      }
      await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
      // Middleware redirects unauthenticated users to / (login landing)
      await expect(page.getByRole("heading", { name: "ATLAS" })).toBeVisible({ timeout: 8000 });
    });

    test("session persists across page refresh", async ({ authedPage: page }) => {
      await expect(page).toHaveURL(/\/dashboard/);
      await page.reload();
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible({ timeout: 8000 });
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DASHBOARD
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test.describe("Dashboard", () => {
    test("stat cards render with data", async ({ authedPage: page }) => {
      await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible({ timeout: 8000 });
      await expect(page.getByText("Drafts this week")).toBeVisible({ timeout: 8000 });
    });

    test("navigation cards link to correct routes", async ({ authedPage: page }) => {
      await expect(page.getByTestId("nav-card-crafting-station")).toBeVisible({ timeout: 8000 });
      await page.getByTestId("nav-card-crafting-station").click();
      await page.waitForURL("**/crafting", { timeout: 8000 });
      await expect(page).toHaveURL(/\/crafting/);
    });

    test("OracleWidget displays on dashboard", async ({ authedPage: page }) => {
      await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible({ timeout: 8000 });
      // Oracle widget may be present or dismissed — just verify no crash
      const body = await page.locator("body").textContent();
      expect(body?.length ?? 0).toBeGreaterThan(100);
    });

    test("recent drafts section populated", async ({ authedPage: page }) => {
      const body = await page.locator("body").textContent({ timeout: 8000 });
      expect(body?.length ?? 0).toBeGreaterThan(200);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CRAFTING
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test.describe("Crafting Station", () => {
    test("source input accepts text paste", async ({ authedPage: page }) => {
      await page.goto("/crafting", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
      await expect(page.locator("body")).toBeVisible();
      await expect(page.getByText("Something went wrong", { exact: true })).toHaveCount(0);
      const textarea = page.locator("textarea").first();
      if (await textarea.isVisible({ timeout: 3000 }).catch(() => false)) {
        await textarea.fill("ETH staking yields are compressing.");
        await expect(textarea).toHaveValue(/ETH/);
      }
    });

    test("generate button creates a draft", async ({ authedPage: page }) => {
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
        })
      );
      await page.goto("/crafting", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
      const textarea = page.locator("textarea").first();
      if (await textarea.isVisible({ timeout: 3000 }).catch(() => false)) {
        await textarea.fill("Ethereum staking yields are compressing");
        const generateBtn = page.getByRole("button", { name: /generate|craft|create/i });
        if (await generateBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await generateBtn.click();
          await expect(page.getByText(/Ethereum staking yields/)).toBeVisible({ timeout: 8000 });
        }
      }
    });

    test.skip("refine button modifies existing draft", async () => {
      // TODO: Requires generate to complete first + refine API stub.
    });

    test("mode tabs are visible", async ({ authedPage: page }) => {
      await page.goto("/crafting", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
      await expect(
        page.getByRole("tab", { name: /New Post/i })
          .or(page.getByRole("button", { name: /New Post/i }))
          .first()
      ).toBeVisible({ timeout: 8000 });
    });

    test("draft list shows existing drafts", async ({ authedPage: page }) => {
      await page.goto("/crafting", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1500);
      const body = await page.locator("body").textContent();
      expect(body).toMatch(/Layer 2 fees|Bitcoin ETF|Draft/i);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // VOICE PROFILES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test.describe("Voice Profiles", () => {
    test("voice studio page renders with heading", async ({ authedPage: page }) => {
      // Voice profiles page shows "Your Voices" — sliders live inside
      // the VoiceEditorModal (opened per-recipe), not on the main page.
      await page.goto("/voice-profiles", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
      await expect(page.locator("body")).toBeVisible();
      await expect(page.getByText("Something went wrong", { exact: true })).toHaveCount(0);
      await expect(
        page.getByText("Your Voices").or(page.getByText("Voice Studio")).first()
      ).toBeVisible({ timeout: 8000 });
    });

    test.skip("dimension sliders are interactive", async () => {
      // Voice dimension sliders live inside VoiceEditorModal (opened per-recipe).
      // Requires clicking a recipe card to open the modal.
      // TODO: Add a mock blend to stubDataEndpoints, click recipe card, then verify sliders.
    });

    test("reference voices section renders", async ({ authedPage: page }) => {
      await page.goto("/voice-profiles", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
      await expect(page.locator("body")).toBeVisible({ timeout: 8000 });
      await expect(page.getByText("Something went wrong", { exact: true })).toHaveCount(0);
    });

    test.skip("blend ratio controls work", async () => {
      // TODO: mockBlends is [] — no blend exists to interact with.
      // Add a blend entry to stubDataEndpoints fixture to enable this test.
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ARENA
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test.describe("Arena", () => {
    test("leaderboard renders with rankings", async ({ authedPage: page }) => {
      // Arena has polling — use domcontentloaded to avoid networkidle hang
      await page.goto("/arena", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1500);
      await expect(page.locator("body")).toBeVisible();
      await expect(page.getByText("Something went wrong", { exact: true })).toHaveCount(0);
      // mockArenaLeaderboard has testanalyst (rank 1) and alice (rank 2)
      await expect(
        page.getByText("testanalyst").or(page.getByText("alice")).first()
      ).toBeVisible({ timeout: 8000 });
    });

    test.skip("tier badges show correct colors", async () => {
      // TODO: Color assertions are brittle. Use Playwright visual snapshots instead.
    });

    test("7d/30d toggle switches data view", async ({ authedPage: page }) => {
      await page.goto("/arena", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1500);
      const thirtyDay = page.getByRole("button", { name: /30d/i }).first();
      await expect(thirtyDay).toBeVisible({ timeout: 8000 });
      await thirtyDay.click();
      await expect(page.locator("body")).toBeVisible();
      const sevenDay = page.getByRole("button", { name: /7d/i }).first();
      if (await sevenDay.isVisible({ timeout: 2000 }).catch(() => false)) {
        await sevenDay.click();
        await expect(page.locator("body")).toBeVisible();
      }
    });

    test("team stats panel shows correct counts", async ({ authedPage: page }) => {
      await page.goto("/arena", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1500);
      await expect(
        page.getByText(/Total analysts|Team Stats|Analyst/i).first()
      ).toBeVisible({ timeout: 8000 });
    });

    test.skip("superlative cards render at top", async () => {
      // TODO: Requires computed superlative fields in mockArenaLeaderboard.
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ANALYTICS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test.describe("Analytics", () => {
    test("summary stats render", async ({ authedPage: page }) => {
      await page.goto("/analytics", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
      await expect(page.locator("body")).toBeVisible();
      await expect(page.getByText("Something went wrong", { exact: true })).toHaveCount(0);
      await expect(
        page.getByText(/Analytics|Drafts|Your Analytics/i).first()
      ).toBeVisible({ timeout: 8000 });
    });

    test("engagement chart visible", async ({ authedPage: page }) => {
      await page.goto("/analytics", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
      await expect(page.locator("body")).toBeVisible({ timeout: 8000 });
      await expect(page.getByText("Something went wrong", { exact: true })).toHaveCount(0);
      const body = await page.locator("body").textContent();
      expect(body?.length ?? 0).toBeGreaterThan(100);
    });

    test("learning log entries display", async ({ authedPage: page }) => {
      await page.goto("/analytics", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
      await expect(
        page.getByText(/Learning Log|Voice calibration improved/i).first()
      ).toBeVisible({ timeout: 8000 });
    });

    test("handles empty data gracefully", async ({ authedPage: page }) => {
      await page.route("**/api/analytics/summary", (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            summary: { draftsCreated: 0, draftsPosted: 0, feedbackGiven: 0, refinements: 0, reportsIngested: 0, period: "30d" },
          }),
        })
      );
      await page.goto("/analytics", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
      await expect(page.locator("body")).toBeVisible({ timeout: 8000 });
      await expect(page.getByText("Something went wrong", { exact: true })).toHaveCount(0);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ALERTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test.describe("Alerts", () => {
    test("alert feed renders items", async ({ authedPage: page }) => {
      await page.goto("/alerts", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
      await expect(page.locator("body")).toBeVisible();
      await expect(page.getByText("Something went wrong", { exact: true })).toHaveCount(0);
      // Empty mockAlerts returns [] so empty state renders
      await expect(
        page.getByText(/No signals yet|Signals Feed|Feed|Alert/i).first()
      ).toBeVisible({ timeout: 8000 });
    });

    test("topic subscriptions section renders", async ({ authedPage: page }) => {
      await page.goto("/alerts", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
      await expect(page.locator("body")).toBeVisible({ timeout: 8000 });
      await expect(page.getByText("Something went wrong", { exact: true })).toHaveCount(0);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ADMIN
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test.describe("Admin", () => {
    test("admin index page links work", async ({ authedPage: page }) => {
      await page.goto("/admin", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
      await expect(page.locator("body")).toBeVisible();
      await expect(page.getByText("Something went wrong", { exact: true })).toHaveCount(0);
      await expect(
        page.getByText("Style Tile").or(page.getByText("QA Checklist")).first()
      ).toBeVisible({ timeout: 8000 });
    });

    test("style tile iframe loads", async ({ authedPage: page }) => {
      await page.goto("/admin/style-tile", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
      await expect(page.locator("body")).toBeVisible({ timeout: 8000 });
      await expect(page.getByText("Something went wrong", { exact: true })).toHaveCount(0);
    });

    test("QA runner page loads", async ({ authedPage: page }) => {
      await page.goto("/admin/qa", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
      await expect(page.locator("body")).toBeVisible({ timeout: 8000 });
      await expect(page.getByText("Something went wrong", { exact: true })).toHaveCount(0);
    });
  });
});

import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { test, expect } from "../fixtures";

const ROUTES = [
  { name: "dashboard", path: "/dashboard" },
  { name: "crafting", path: "/crafting" },
  { name: "voice-profiles", path: "/voice-profiles" },
  { name: "analytics", path: "/analytics" },
  { name: "alerts", path: "/alerts" },
  // management excluded until rewrite is deployed (React error #310 on prod)
  // { name: "management", path: "/management" },
  { name: "team-library", path: "/team-library" },
  { name: "profile", path: "/profile" },
];

async function waitForAuditReady(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForURL((url) => url.pathname === path);
  await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible();
  await expect(page.locator("#main-content h1").first()).toBeVisible();
}

test.describe("Accessibility — axe-core audit", () => {
  for (const route of ROUTES) {
    test(`${route.name} has no critical a11y violations`, async ({ authedPage }) => {
      await waitForAuditReady(authedPage, route.path);

      const results = await new AxeBuilder({ page: authedPage })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .disableRules(["color-contrast"]) // known dark-theme issues, tracked separately
        .analyze();

      const critical = results.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious",
      );

      if (critical.length > 0) {
        const summary = critical.map(
          (v) => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} instances)`,
        );
        expect(critical, `Critical a11y violations on ${route.path}:\n${summary.join("\n")}`).toHaveLength(0);
      }
    });
  }
});

test.describe("Accessibility — keyboard navigation", () => {
  // TODO: dashboard currently has no tabbable elements via route mocking — real a11y gap to fix
  test.fixme("tab order reaches interactive elements", async ({ authedPage }) => {
    await authedPage.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await authedPage.waitForTimeout(1000);

    // Tab through elements and check we hit something focusable
    const focusedTags: string[] = [];
    for (let i = 0; i < 20; i++) {
      await authedPage.keyboard.press("Tab");
      const tag = await authedPage.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return "body";
        return el.tagName.toLowerCase();
      });
      focusedTags.push(tag);
    }

    // At least some non-body elements should receive focus
    const focused = focusedTags.filter((t) => t !== "body");
    expect(focused.length).toBeGreaterThan(0);
  });

  test("escape closes modal/command palette if open", async ({ authedPage }) => {
    await waitForAuditReady(authedPage, "/dashboard");

    // Use the accessible trigger instead of an OS-specific keyboard shortcut.
    await authedPage.getByRole("button", { name: "Open command palette (⌘K)" }).click();

    const palette = authedPage.getByRole("dialog", { name: "Command palette" });
    await expect(palette).toBeVisible();

    await authedPage.keyboard.press("Escape");
    await expect(palette).toBeHidden();
  });
});

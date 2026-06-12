import { test, expect } from "../fixtures";

test.describe("Performance — page load times", () => {
  const ROUTES = [
    { name: "dashboard", path: "/dashboard", maxMs: 8000 },
    { name: "crafting", path: "/crafting", maxMs: 8000 },
    { name: "analytics", path: "/analytics", maxMs: 8000 },
  ];

  for (const route of ROUTES) {
    test(`${route.name} loads within ${route.maxMs}ms`, async ({ authedPage }) => {
      const start = Date.now();
      await authedPage.goto(route.path, { waitUntil: "domcontentloaded" });
      const elapsed = Date.now() - start;

      expect(elapsed, `${route.name} took ${elapsed}ms (max ${route.maxMs}ms)`).toBeLessThan(route.maxMs);
    });
  }
});

test.describe("Performance — no console errors", () => {
  test("dashboard has no uncaught errors", async ({ authedPage }) => {
    const errors: string[] = [];
    authedPage.on("pageerror", (err) => errors.push(err.message));

    // domcontentloaded, not networkidle: the dashboard polls continuously,
    // so networkidle never fires against a live preview and the goto times
    // out. The settle wait below gives late errors time to surface.
    await authedPage.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await authedPage.waitForTimeout(2000);

    expect(errors, `Console errors on dashboard: ${errors.join(", ")}`).toHaveLength(0);
  });
});

test.describe("Performance — bundle size checks", () => {
  test("no individual JS chunk exceeds 500KB", async ({ authedPage }) => {
    const resources: { url: string; size: number }[] = [];

    authedPage.on("response", async (response) => {
      const url = response.url();
      if (url.endsWith(".js") || url.includes(".js?")) {
        const body = await response.body().catch(() => null);
        if (body) {
          resources.push({ url, size: body.length });
        }
      }
    });

    // "load" waits for initial resources (the chunks this test measures)
    // without requiring network silence the polling dashboard never gives.
    await authedPage.goto("/dashboard", { waitUntil: "load" });
    await authedPage.waitForTimeout(2000);

    const oversized = resources.filter((r) => r.size > 500_000);
    if (oversized.length > 0) {
      const details = oversized.map((r) => `${r.url.split("/").pop()} (${(r.size / 1024).toFixed(0)}KB)`);
      expect(oversized, `Oversized JS chunks: ${details.join(", ")}`).toHaveLength(0);
    }
  });
});

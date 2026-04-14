import { expect, test, type Route } from "@playwright/test";

const AUTH_COOKIES = (hostname: string) => [
  { name: "atlas_session", value: "1", domain: hostname, path: "/" },
  { name: "atlas_access_token", value: "1", domain: hostname, path: "/" },
];

const ALL_FLAGS_ENABLED: Record<string, boolean> = {
  crafting_station: true,
  voice_lab: true,
  arena: true,
  campaigns: true,
  queue: true,
  analytics_advanced: true,
  signals: true,
  telegram_bot: true,
  tweet_tinder: true,
  multi_model: true,
  super_admin: true,
  management: true,
  feed: true,
  briefing: true,
  library: true,
};

const mockUser = {
  id: "voice-lib-user-1",
  handle: "atlasanalyst",
  email: "atlas@example.com",
  role: "ADMIN" as const,
  displayName: "Atlas Analyst",
  voiceProfile: {
    id: "voice-1",
    userId: "voice-lib-user-1",
    humor: 58,
    formality: 46,
    brevity: 64,
    contrarianTone: 52,
    maturity: "INTERMEDIATE" as const,
    tweetsAnalyzed: 28,
  },
};

const mockBlends = {
  blends: [
    {
      id: "blend-1",
      name: "Macro Desk",
      voices: [
        { label: "My voice", percentage: 60 },
        { label: "Cobie", percentage: 40 },
      ],
    },
    {
      id: "blend-2",
      name: "Research Mode",
      voices: [
        { label: "My voice", percentage: 50 },
        { label: "Hasu", percentage: 50 },
      ],
    },
  ],
};

const mockVoiceReferences = {
  voices: [
    { id: "ref-1", name: "Cobie", handle: "cobie", isActive: true },
    { id: "ref-2", name: "Hasu", handle: "hasufl", isActive: true },
  ],
};

function json(route: Route, body: unknown) {
  return route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function stubVoiceProfilesApi(page: import("@playwright/test").Page) {
  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/api/auth/me")) return json(route, { user: mockUser });
    if (url.includes("/api/voice/profile"))
      return json(route, { profile: mockUser.voiceProfile });
    if (url.includes("/api/voice/references"))
      return json(route, mockVoiceReferences);
    if (url.includes("/api/voice/blends")) return json(route, mockBlends);
    if (url.includes("/api/voice/reference-accounts"))
      return json(route, { accounts: [] });
    if (url.includes("/api/oracle")) return json(route, { response: "preview text" });
    return json(route, {});
  });
}

test.describe("Voice Lab (voice-profiles) — recipe cards + blend UI", () => {
  test.beforeEach(async ({ page, context, baseURL }) => {
    const url = new URL(baseURL ?? "http://localhost:3000");
    await context.addCookies(AUTH_COOKIES(url.hostname));

    const bypass =
      process.env.VERCEL_AUTOMATION_BYPASS_SECRET ??
      process.env.VERCEL_PROTECTION_BYPASS;
    if (bypass) {
      await context.addCookies([
        { name: "_vercel_password", value: bypass, domain: url.hostname, path: "/" },
      ]);
    }

    await context.addInitScript((flags) => {
      try {
        window.localStorage.setItem("atlas-feature-flags", JSON.stringify(flags));
      } catch {
        // ignore
      }
    }, ALL_FLAGS_ENABLED);

    await stubVoiceProfilesApi(page);
    await page.route("https://unavatar.io/**", (route) => route.abort());
  });

  test("renders /voice-profiles without crashing", async ({ page }) => {
    await page.goto("/voice-profiles", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText("Something went wrong", { exact: true })).toHaveCount(0);
  });

  test("voice recipe cards are visible with blend names", async ({ page }) => {
    await page.goto("/voice-profiles", { waitUntil: "domcontentloaded" });

    // Recipe cards for the mock blends should be rendered.
    // Use .first() — "Macro Desk" appears in recipe card <p>, blend <h3>, and compare <option>.
    await expect(page.getByText("Macro Desk").first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByText("Research Mode").first()).toBeVisible({ timeout: 5000 });
  });

  test("blend pair-select UI appears on /voice-profiles", async ({ page }) => {
    await page.goto("/voice-profiles", { waitUntil: "domcontentloaded" });

    // The page renders blend cards showing voice pair percentages.
    // Use .first() — "Macro Desk" appears in multiple elements (card, heading, option).
    await expect(page.getByText("Macro Desk").first()).toBeVisible({ timeout: 8000 });

    // Each blend shows voice pair labels (My voice + reference)
    await expect(page.getByText("My voice").first()).toBeVisible({ timeout: 5000 });
  });

  test("Voice Lab page is reachable via /voices nav label", async ({ page }) => {
    await page.goto("/voice-profiles", { waitUntil: "domcontentloaded" });

    // The nav shows "Voices" (DM-322 label)
    const navVoices = page.getByRole("link", { name: /^Voices$/i });
    await expect(navVoices).toBeVisible({ timeout: 5000 });
  });
});

import { expect, test, type Locator, type Page, type Route } from "@playwright/test";

// Use origin-agnostic glob patterns so stubs work whether the browser hits the
// cross-origin Railway backend directly OR the Next.js rewrite proxy on localhost.

const mockUser = {
  id: "smoke-user-1",
  handle: "atlasanalyst",
  email: "atlas@example.com",
  // ADMIN so FeatureGate-protected routes (campaigns/telegram/management/admin)
  // that need admin or admins-scope flags render their content in smoke tests.
  role: "ADMIN" as const,
  displayName: "Atlas Analyst",
  voiceProfile: {
    id: "voice-1",
    userId: "smoke-user-1",
    humor: 58,
    formality: 46,
    brevity: 64,
    contrarianTone: 52,
    maturity: "INTERMEDIATE" as const,
    tweetsAnalyzed: 28,
  },
};

// All feature flags forced on for smoke runs — mirrors FLAG_DEFS in
// src/lib/feature-flags.tsx. Seeded into localStorage via addInitScript.
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

const mockSummary = {
  summary: {
    draftsCreated: 8,
    draftsPosted: 3,
    feedbackGiven: 5,
    refinements: 2,
    reportsIngested: 4,
    period: "30d",
  },
};

const mockDrafts = {
  drafts: [
    {
      id: "draft-1",
      content:
        "Bitcoin ETF inflows are still climbing. The market keeps underpricing how sticky institutional demand can be.",
      version: 1,
      status: "APPROVED" as const,
      confidence: 0.86,
      predictedEngagement: 4200,
      actualEngagement: 3900,
      sourceType: "REPORT",
      createdAt: "2026-04-01T08:00:00.000Z",
    },
    {
      id: "draft-2",
      content:
        "L2 fees converging to zero means the moat is distribution and product quality, not cheaper block space.",
      version: 1,
      status: "DRAFT" as const,
      confidence: 0.73,
      predictedEngagement: 2800,
      actualEngagement: null,
      sourceType: "MANUAL",
      createdAt: "2026-04-02T10:30:00.000Z",
    },
  ],
};

const mockLearningLog = {
  entries: [
    {
      id: "log-1",
      event: "Voice calibration improved",
      impact: "+12%",
      positive: true,
      createdAt: "2026-04-01T12:00:00.000Z",
    },
    {
      id: "log-2",
      event: "Engagement prediction adjusted",
      impact: "-3%",
      positive: false,
      createdAt: "2026-04-02T12:00:00.000Z",
    },
  ],
};

const mockEngagementDaily = {
  days: [
    { date: "2026-03-28", dayLabel: "Sat", predicted: 1800, actual: 1600 },
    { date: "2026-03-29", dayLabel: "Sun", predicted: 2100, actual: 1900 },
    { date: "2026-03-30", dayLabel: "Mon", predicted: 2400, actual: 2200 },
    { date: "2026-03-31", dayLabel: "Tue", predicted: 2600, actual: 2500 },
    { date: "2026-04-01", dayLabel: "Wed", predicted: 2800, actual: 2700 },
    { date: "2026-04-02", dayLabel: "Thu", predicted: 3000, actual: 2850 },
    { date: "2026-04-03", dayLabel: "Fri", predicted: 3200, actual: 3050 },
  ],
};

const mockActivityDaily = {
  days: [
    { date: "2026-03-28", count: 2 },
    { date: "2026-03-29", count: 4 },
    { date: "2026-03-30", count: 3 },
    { date: "2026-03-31", count: 5 },
    { date: "2026-04-01", count: 6 },
    { date: "2026-04-02", count: 4 },
    { date: "2026-04-03", count: 7 },
  ],
};

const mockVoiceReferences = {
  voices: [
    { id: "ref-1", name: "Cobie", handle: "cobie", isActive: true },
    { id: "ref-2", name: "Hsaka", handle: "hsaka", isActive: true },
    { id: "ref-3", name: "Hasu", handle: "hasufl", isActive: true },
  ],
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
  ],
};

const mockTrendingTopics = {
  topics: [
    {
      id: "trend-1",
      topic: "Solana memes",
      headline: "Solana meme volume jumps 18%",
      context: "Meme liquidity is rotating back into majors.",
    },
  ],
};

const mockLoopState = {
  loop: {
    status: "idle" as const,
    currentIteration: 0,
    maxIterations: 0,
    iterations: [],
    bestIteration: null,
    evalType: "smoke",
    startedAt: null,
    completedAt: null,
    taskId: "atlas-smoke",
  },
};

const mockTeam = {
  team: [
    {
      id: "team-1",
      handle: "alice",
      displayName: "Alice",
      role: "ANALYST",
      voiceProfile: { maturity: "ADVANCED" },
      _count: { tweetDrafts: 15, sessions: 8 },
    },
    {
      id: "team-2",
      handle: "bob",
      displayName: "Bob",
      role: "ANALYST",
      voiceProfile: { maturity: "BEGINNER" },
      _count: { tweetDrafts: 4, sessions: 1 },
    },
  ],
};

const mockTeamAnalytics = {
  analysts: [
    { id: "team-1", handle: "alice", _count: { tweetDrafts: 15, analyticsEvents: 40, sessions: 8 } },
    { id: "team-2", handle: "bob", _count: { tweetDrafts: 4, analyticsEvents: 12, sessions: 1 } },
  ],
};

const mockTeamEngagementDaily = {
  days: [
    {
      date: "2026-03-30",
      dayLabel: "Mon",
      modelTarget: 4,
      teamActual: 3,
    },
    {
      date: "2026-03-31",
      dayLabel: "Tue",
      modelTarget: 6,
      teamActual: 5,
    },
    {
      date: "2026-04-01",
      dayLabel: "Wed",
      modelTarget: 5,
      teamActual: 6,
    },
    {
      date: "2026-04-02",
      dayLabel: "Thu",
      modelTarget: 7,
      teamActual: 6,
    },
    {
      date: "2026-04-03",
      dayLabel: "Fri",
      modelTarget: 8,
      teamActual: 7,
    },
  ],
};

const mockPeaks = {
  peaks: [
    { name: "Alice", days: 12, hasDrafts: true },
    { name: "Bob", days: 24, hasDrafts: true },
  ],
};

type SmokeRoute = {
  name: string;
  path: string;
  finalUrl?: RegExp;
  ready: (page: Page) => Locator;
  readyTimeout?: number;
};

const smokeRoutes: SmokeRoute[] = [
  {
    name: "dashboard landing",
    path: "/",
    finalUrl: /\/dashboard$/,
    ready: (page) => page.getByRole("heading", { name: /welcome back/i }),
  },
  {
    name: "dashboard",
    path: "/dashboard",
    ready: (page) => page.getByRole("heading", { name: /welcome back/i }),
  },
  {
    name: "crafting",
    path: "/crafting",
    ready: (page) => page.getByText(/Feed Atlas content/i),
  },
  {
    name: "voice profiles",
    path: "/voice-profiles",
    ready: (page) => page.getByRole("heading", { name: /your voice/i }).first(),
  },
  {
    name: "analytics",
    path: "/analytics",
    ready: (page) => page.getByRole("heading", { name: /your analytics/i }),
  },
  {
    name: "alerts",
    path: "/alerts",
    ready: (page) => page.getByRole("heading", { name: /draft responses without leaving the feed/i }),
  },
  {
    name: "briefing",
    path: "/briefing",
    ready: (page) =>
      page.getByRole("heading", { name: /briefing|daily digest/i }).first(),
  },
  {
    name: "search",
    path: "/search",
    ready: (page) =>
      page.getByPlaceholder(/search drafts or voice profiles/i),
  },
  {
    name: "team library",
    path: "/team-library",
    ready: (page) => page.getByRole("heading", { name: /team style library/i }),
  },
  {
    name: "telegram",
    path: "/telegram",
    ready: (page) =>
      page.getByRole("heading", { name: /telegram/i }).first(),
    readyTimeout: 15_000,
  },
  {
    name: "campaigns",
    path: "/campaigns",
    ready: (page) => page.getByRole("heading", { name: /campaign/i }).first(),
  },
  {
    name: "management",
    path: "/management",
    ready: (page) => page.getByRole("heading", { name: /atlas arena|team management/i }),
  },
  {
    // /profile was removed for the Wednesday demo (DM-322). Any navigation to
    // /profile now redirects to /crafting — assert the redirect target renders.
    name: "profile",
    path: "/profile",
    finalUrl: /\/crafting$/,
    ready: (page) => page.getByText(/Feed Atlas content/i),
  },
  // Onboarding now uses the conversational Oracle chat UI at /onboarding
  {
    name: "onboarding",
    path: "/onboarding",
    ready: (page) => page.locator('[data-testid="oracle-chat"], [class*="chat"], img[alt*="Oracle"], img[alt*="avatar"]').first(),
  },
];

function json(route: Route, body: unknown) {
  return route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function stubApi(page: Page) {
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const status = url.searchParams.get("status");

    switch (url.pathname) {
      case "/api/auth/me":
        return json(route, { user: mockUser });
      case "/api/auth/login":
        return json(route, {
          user: mockUser,
          token: "smoke-token",
          refresh_token: "smoke-refresh-token",
        });
      case "/api/auth/refresh":
        return json(route, {
          token: "smoke-token",
          refresh_token: "smoke-refresh-token",
        });
      case "/api/auth/logout":
        return json(route, { success: true });
      case "/api/analytics/summary":
        return json(route, mockSummary);
      case "/api/analytics/learning-log":
        return json(route, mockLearningLog);
      case "/api/analytics/engagement-daily":
        return json(route, mockEngagementDaily);
      case "/api/analytics/activity-daily":
        return json(route, mockActivityDaily);
      case "/api/analytics/team":
        return json(route, mockTeamAnalytics);
      case "/api/analytics/team-engagement-daily":
        return json(route, mockTeamEngagementDaily);
      case "/api/analytics/days-to-peak":
        return json(route, mockPeaks);
      case "/api/drafts":
        return json(route, {
          drafts: status === "APPROVED" ? [mockDrafts.drafts[0]] : mockDrafts.drafts,
        });
      case "/api/voice/profile":
        return json(route, { profile: mockUser.voiceProfile });
      case "/api/voice/references":
        return json(route, mockVoiceReferences);
      case "/api/voice/blends":
        return json(route, mockBlends);
      case "/api/trending/topics":
        return json(route, mockTrendingTopics);
      case "/api/loop/state":
        return json(route, mockLoopState);
      case "/api/users/profile":
        return json(route, { user: mockUser });
      case "/api/users/team":
        return json(route, mockTeam);
      case "/api/alerts/feed":
        return json(route, { alerts: [] });
      case "/api/alerts/subscriptions":
        return json(route, { subscriptions: [] });
      default:
        return json(route, {});
    }
  });
}

function monitorClientErrors(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const ignorableConsoleErrors = [
    /WebSocket connection.*failed/,
    /Content Security Policy/,
    /Loading plugin data.*violates/,
    /Failed to load resource/,
    /Failed to fetch RSC payload/,
    /TourProvider/,
    /toggleDemoMode/,
    /error occurred in the/,
  ];

  page.on("console", (message) => {
    if (message.type() === "error") {
      const text = message.text();

      if (ignorableConsoleErrors.some((pattern) => pattern.test(text))) {
        return;
      }

      consoleErrors.push(text);
    }
  });

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  return { consoleErrors, pageErrors };
}

async function expectHealthyPage(
  page: Page,
  smokeRoute: SmokeRoute,
  consoleErrors: string[],
  pageErrors: string[],
) {
  await page.goto(smokeRoute.path, { waitUntil: "domcontentloaded" });

  if (smokeRoute.finalUrl) {
    await page.waitForURL(smokeRoute.finalUrl);
  }

  await expect(smokeRoute.ready(page)).toBeVisible({ timeout: smokeRoute.readyTimeout });
  await expect(page.getByText("Something went wrong", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Page not found", { exact: true })).toHaveCount(0);

  await page.waitForTimeout(250);

  expect(
    consoleErrors,
    `Expected no browser console errors on ${smokeRoute.path}`,
  ).toEqual([]);
  expect(
    pageErrors,
    `Expected no uncaught page errors on ${smokeRoute.path}`,
  ).toEqual([]);
}

test.describe("Route smoke tests", () => {
  for (const smokeRoute of smokeRoutes) {
    test(`renders ${smokeRoute.name}`, async ({ page, context, baseURL }) => {
      // Set auth cookies so middleware allows access to protected routes
      const url = new URL(baseURL ?? "http://localhost:3000");
      const cookies: Array<{ name: string; value: string; domain: string; path: string }> = [
        { name: "atlas_session", value: "1", domain: url.hostname, path: "/" },
        { name: "atlas_access_token", value: "1", domain: url.hostname, path: "/" },
      ];
      // Bypass Vercel deployment protection on preview URLs
      const vercelBypass =
        process.env.VERCEL_AUTOMATION_BYPASS_SECRET ??
        process.env.VERCEL_PROTECTION_BYPASS;
      if (vercelBypass) {
        cookies.push({
          name: "_vercel_password",
          value: vercelBypass,
          domain: url.hostname,
          path: "/",
        });
      }
      await context.addCookies(cookies);

      // Seed feature-flag localStorage BEFORE any page script runs so
      // FeatureGate-protected routes (campaigns/telegram/management/admin)
      // render their real content instead of redirecting to /dashboard.
      await context.addInitScript((flags) => {
        try {
          window.localStorage.setItem(
            "atlas-feature-flags",
            JSON.stringify(flags),
          );
        } catch {
          // ignore storage failures (private mode, etc.)
        }
      }, ALL_FLAGS_ENABLED);

      await stubApi(page);

      const { consoleErrors, pageErrors } = monitorClientErrors(page);

      await expectHealthyPage(page, smokeRoute, consoleErrors, pageErrors);
    });
  }
});

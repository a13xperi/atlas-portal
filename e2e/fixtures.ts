import { test as base, Page, Route } from "@playwright/test";

// Use origin-agnostic glob patterns so stubs work whether the browser hits the
// cross-origin Railway backend directly OR the Next.js rewrite proxy on localhost.

const mockUser = {
  id: "test-user-1",
  handle: "testanalyst",
  email: "test@atlas.dev",
  // ADMIN so FeatureGate-protected routes (campaigns/telegram/management/admin/*)
  // that require admin or admins-scope flags render their content in tests.
  role: "ADMIN" as const,
  displayName: "Test User",
  voiceProfile: {
    id: "vp-1",
    userId: "test-user-1",
    humor: 50,
    formality: 60,
    brevity: 40,
    contrarianTone: 30,
    maturity: "INTERMEDIATE" as const,
    tweetsAnalyzed: 12,
  },
};

// All feature flags forced on for e2e runs so gated routes render.
// Mirrors FLAG_DEFS in src/lib/feature-flags.tsx — add new keys here when the
// source list grows. Seeded via addInitScript before any page script runs.
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
      id: "d1",
      content: "Bitcoin ETF inflows hit $2B this week. Institutional adoption is accelerating faster than most models predicted.",
      version: 1,
      status: "POSTED",
      confidence: 0.85,
      predictedEngagement: 4200,
      actualEngagement: 3800,
      sourceType: "research",
      createdAt: new Date().toISOString(),
    },
    {
      id: "d2",
      content: "Layer 2 fees are converging toward zero. The real moat is developer tooling, not transaction costs.",
      version: 1,
      status: "DRAFT",
      confidence: 0.72,
      predictedEngagement: 2800,
      actualEngagement: null,
      sourceType: "trending",
      createdAt: new Date().toISOString(),
    },
  ],
};

const mockEngagementDaily = {
  days: Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return {
      date: d.toISOString().slice(0, 10),
      dayLabel: dayNames[d.getDay()],
      predicted: 1000 + Math.round(Math.random() * 3000),
      actual: 800 + Math.round(Math.random() * 3000),
    };
  }),
};

const mockActivityDaily = {
  days: Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 29 + i);
    return { date: d.toISOString().slice(0, 10), count: Math.round(Math.random() * 10) };
  }),
};

const mockLearningLog = {
  entries: [
    { id: "ll1", event: "Voice calibration improved", impact: "+12%", positive: true, createdAt: new Date().toISOString() },
    { id: "ll2", event: "Engagement prediction adjusted", impact: "-3%", positive: false, createdAt: new Date().toISOString() },
  ],
};

const mockTeam = {
  team: [
    { id: "u1", handle: "alice", displayName: "Alice", role: "ANALYST", voiceProfile: { maturity: "ADVANCED" }, _count: { tweetDrafts: 15, sessions: 8 } },
    { id: "u2", handle: "bob", displayName: "Bob", role: "ANALYST", voiceProfile: { maturity: "BEGINNER" }, _count: { tweetDrafts: 3, sessions: 1 } },
    { id: "test-user-1", handle: "testanalyst", displayName: "Test User", role: "ADMIN", voiceProfile: { maturity: "INTERMEDIATE" }, _count: { tweetDrafts: 8, sessions: 5 } },
  ],
};

const mockTeamAnalytics = {
  analysts: [
    { id: "u1", handle: "alice", _count: { tweetDrafts: 15, analyticsEvents: 40, sessions: 8 } },
    { id: "u2", handle: "bob", _count: { tweetDrafts: 3, analyticsEvents: 5, sessions: 1 } },
    { id: "test-user-1", handle: "testanalyst", _count: { tweetDrafts: 8, analyticsEvents: 20, sessions: 5 } },
  ],
};

const mockBlends = { blends: [] };
const mockVoiceProfile = { profile: mockUser.voiceProfile };
const mockAlerts = { alerts: [] };
const mockSubscriptions = { subscriptions: [] };

const mockArenaLeaderboard = {
  entries: [
    { rank: 1, userId: "test-user-1", handle: "testanalyst", displayName: "Test User", tweetsCount: 12, engagementScore: 4800, consistencyScore: 0.9, totalScore: 9.2 },
    { rank: 2, userId: "u1", handle: "alice", displayName: "Alice", tweetsCount: 10, engagementScore: 3900, consistencyScore: 0.8, totalScore: 7.8 },
  ],
  period: "last_30_days",
  updatedAt: new Date().toISOString(),
};

function json(route: Route, body: unknown) {
  return route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

/** Stub all auth endpoints so the app thinks we're logged in. */
async function stubAuth(page: Page) {
  await page.route("**/api/auth/**", (route) => {
    const url = new URL(route.request().url());
    switch (url.pathname) {
      case "/api/auth/me":
        return json(route, { user: mockUser });
      case "/api/auth/login":
        return json(route, { user: mockUser, token: "fake-jwt", refresh_token: "fake-refresh" });
      case "/api/auth/refresh":
        return json(route, { token: "fake-jwt", refresh_token: "fake-refresh" });
      case "/api/auth/logout":
        return json(route, { success: true });
      default:
        return json(route, {});
    }
  });
}

/** Stub common data endpoints with realistic responses. */
async function stubDataEndpoints(page: Page) {
  await page.route("**/api/**", (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;

    // Auth endpoints are handled by stubAuth — skip them here
    if (path.startsWith("/api/auth/")) return route.fallback();

    switch (path) {
      case "/api/analytics/summary":
        return json(route, mockSummary);
      case "/api/drafts":
        if (route.request().method() === "GET") return json(route, mockDrafts);
        return route.continue();
      case "/api/analytics/engagement-daily":
        return json(route, mockEngagementDaily);
      case "/api/analytics/activity-daily":
        return json(route, mockActivityDaily);
      case "/api/analytics/learning-log":
        if (route.request().method() === "GET") return json(route, mockLearningLog);
        return route.continue();
      case "/api/users/team":
        return json(route, mockTeam);
      case "/api/analytics/team":
        return json(route, mockTeamAnalytics);
      case "/api/analytics/team-engagement-daily":
        return json(route, mockEngagementDaily);
      case "/api/analytics/days-to-peak":
        return json(route, { peaks: [{ name: "Alice", days: 12, hasDrafts: true }, { name: "Bob", days: 28, hasDrafts: true }] });
      case "/api/voice/blends":
        return json(route, mockBlends);
      case "/api/voice/profile":
        if (route.request().method() === "GET") return json(route, mockVoiceProfile);
        return route.continue();
      case "/api/alerts/feed":
        return json(route, mockAlerts);
      case "/api/alerts/subscriptions":
        return json(route, mockSubscriptions);
      case "/api/trending/topics":
        return json(route, { topics: [] });
      case "/api/loop/state":
        return json(route, { loop: { status: "idle", currentIteration: 0, maxIterations: 0, iterations: [], bestIteration: null, evalType: "", startedAt: null, completedAt: null, taskId: "" } });
      case "/api/users/profile":
        return json(route, { user: mockUser });
      case "/api/voice/references":
        return json(route, { voices: [] });
      case "/api/voice/reference-accounts":
        return json(route, { accounts: [] });
      case "/api/campaigns":
        return json(route, { campaigns: [] });
      case "/api/arena/leaderboard":
        return json(route, mockArenaLeaderboard);
      case "/api/arena/me":
        return json(route, { entry: mockArenaLeaderboard.entries[0] ?? null });
      default:
        // Catch-all for any remaining API calls (including briefing, etc.)
        if (route.request().method() === "GET") return json(route, {});
        return route.continue();
    }
  });
}

/** Return the Vercel deployment-protection bypass cookie if the env var is set. */
export function vercelBypassCookies(
  domain: string,
): Array<{ name: string; value: string; domain: string; path: string }> {
  const token =
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET ??
    process.env.VERCEL_PROTECTION_BYPASS;
  if (!token) return [];
  return [{ name: "_vercel_password", value: token, domain, path: "/" }];
}

/** Extended test fixture that provides an authenticated page. */
export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page, context, baseURL }, use) => {
    // Set auth cookie so middleware and client auth both see an active session
    const url = new URL(baseURL ?? "http://localhost:3000");
    const cookies: Array<{ name: string; value: string; domain: string; path: string }> = [
      { name: "atlas_access_token", value: "1", domain: url.hostname, path: "/" },
      { name: "atlas_session", value: "1", domain: url.hostname, path: "/" },
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

    // Seed feature-flag localStorage + demo mode BEFORE any page script runs.
    // This keeps gated routes (campaigns/telegram/management/admin/*) rendering
    // their real content instead of FeatureGate redirecting to /dashboard.
    await context.addInitScript((flags) => {
      try {
        window.localStorage.setItem("atlas-feature-flags", JSON.stringify(flags));
      } catch {
        // ignore storage failures (private mode, etc.)
      }
    }, ALL_FLAGS_ENABLED);

    await stubAuth(page);
    await stubDataEndpoints(page);

    // Abort external avatar requests so they resolve instantly (404 → initials fallback).
    // Without this, waitForLoadState("networkidle") hangs waiting for unavatar.io
    // in CI environments where the connection is slow or external images take too long.
    await page.route("https://unavatar.io/**", (route) => route.abort());
    await page.route("https://pbs.twimg.com/**", (route) => route.abort());

    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForURL("**/dashboard");

    await use(page);
  },
});

export { stubAuth, stubDataEndpoints, vercelBypassCookies, mockUser, mockSummary, mockDrafts, mockEngagementDaily, mockActivityDaily, mockLearningLog };
export { expect } from "@playwright/test";

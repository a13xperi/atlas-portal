import { test as base, Page } from "@playwright/test";

const API_BASE = "https://api-production-9bef.up.railway.app";

const mockUser = {
  id: "test-user-1",
  handle: "testanalyst",
  email: "test@atlas.dev",
  role: "MANAGER" as const,
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
  ],
};

const mockTeamAnalytics = {
  analysts: [
    { id: "u1", handle: "alice", _count: { tweetDrafts: 15, analyticsEvents: 40, sessions: 8 } },
    { id: "u2", handle: "bob", _count: { tweetDrafts: 3, analyticsEvents: 5, sessions: 1 } },
  ],
};

const mockBlends = { blends: [] };
const mockVoiceProfile = { profile: mockUser.voiceProfile };
const mockAlerts = { alerts: [] };
const mockSubscriptions = { subscriptions: [] };

/** Stub all auth endpoints so the app thinks we're logged in. */
async function stubAuth(page: Page) {
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: mockUser }) }),
  );
  await page.route('**/api/auth/login', (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ user: mockUser, token: "fake-jwt", refresh_token: "fake-refresh" }),
    }),
  );
  await page.route('**/api/auth/refresh', (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ token: "fake-jwt", refresh_token: "fake-refresh" }) }),
  );
  await page.route('**/api/auth/logout', (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) }),
  );
}

/** Stub common data endpoints with realistic responses. */
async function stubDataEndpoints(page: Page) {
  await page.route('**/api/analytics/summary', (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockSummary) }),
  );
  await page.route('**/api/drafts', (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockDrafts) });
    }
    return route.continue();
  });
  await page.route('**/api/analytics/engagement-daily', (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockEngagementDaily) }),
  );
  await page.route('**/api/analytics/activity-daily', (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockActivityDaily) }),
  );
  await page.route('**/api/analytics/learning-log', (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockLearningLog) });
    }
    return route.continue();
  });
  await page.route('**/api/users/team', (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockTeam) }),
  );
  await page.route('**/api/analytics/team', (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockTeamAnalytics) }),
  );
  await page.route('**/api/analytics/team-engagement-daily', (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockEngagementDaily) }),
  );
  await page.route('**/api/analytics/days-to-peak', (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ peaks: [{ name: "Alice", days: 12, hasDrafts: true }, { name: "Bob", days: 28, hasDrafts: true }] }),
    }),
  );
  await page.route('**/api/voice/blends', (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockBlends) }),
  );
  await page.route('**/api/voice/profile', (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockVoiceProfile) });
    }
    return route.continue();
  });
  await page.route('**/api/alerts/feed', (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockAlerts) }),
  );
  await page.route('**/api/alerts/subscriptions', (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockSubscriptions) }),
  );
  await page.route('**/api/trending/topics', (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ topics: [] }) }),
  );
  await page.route('**/api/loop/state', (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ loop: { status: "idle", currentIteration: 0, maxIterations: 0, iterations: [], bestIteration: null, evalType: "", startedAt: null, completedAt: null, taskId: "" } }) }),
  );
  await page.route('**/api/users/profile', (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: mockUser }) }),
  );
  await page.route('**/api/voice/reference-accounts', (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ accounts: [] }) }),
  );
  await page.route('**/api/briefing/**', (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) }),
  );
  // Catch-all for any remaining API calls
  await page.route('**/api/**', (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) });
    }
    return route.continue();
  });
}

/** Extended test fixture that provides an authenticated page. */
export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page, context, baseURL }, use) => {
    // Set auth cookie so middleware and client auth both see an active session
    const url = new URL(baseURL ?? "http://localhost:3000");
    await context.addCookies([
      { name: "atlas_access_token", value: "1", domain: url.hostname, path: "/" },
      { name: "atlas_session", value: "1", domain: url.hostname, path: "/" },
    ]);

    await stubAuth(page);
    await stubDataEndpoints(page);

    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForURL("**/dashboard");
    await use(page);
  },
});

export { stubAuth, stubDataEndpoints, mockUser, mockSummary, mockDrafts, mockEngagementDaily, mockActivityDaily, mockLearningLog };
export { expect } from "@playwright/test";

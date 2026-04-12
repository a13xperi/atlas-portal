import { executeAction, summarizeResult } from "@/lib/oracle-action-executor";
import { api } from "@/lib/api";
import type {
  OracleAgentAction,
  OracleActionResult,
} from "@/lib/oracle-agent-types";

jest.mock("@/lib/api", () => ({
  api: {
    drafts: {
      generate: jest.fn(),
      list: jest.fn(),
      refine: jest.fn(),
      postToX: jest.fn(),
      schedule: jest.fn(),
    },
    voice: {
      getProfile: jest.fn(),
      calibrate: jest.fn(),
      updateProfile: jest.fn(),
    },
    analytics: { summary: jest.fn() },
    trending: { topics: jest.fn() },
    alerts: { feed: jest.fn(), subscribe: jest.fn() },
    research: { conduct: jest.fn() },
  },
}));

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
} as unknown as Parameters<typeof executeAction>[1]["router"];

function action(
  overrides: Partial<OracleAgentAction> & { type: string },
): OracleAgentAction {
  return {
    id: `a-${overrides.type}`,
    type: overrides.type as OracleAgentAction["type"],
    input: overrides.input ?? {},
    requiresConfirmation: overrides.requiresConfirmation ?? false,
    label: overrides.label ?? overrides.type,
  };
}

beforeEach(() => {
  jest.resetAllMocks();
});

// ── executeAction ────────────────────────────────────────────────────────

describe("executeAction", () => {
  // ── Server-resolved shortcut ──

  it("returns cached _serverResult without calling any API", async () => {
    const a = action({
      type: "list_drafts",
      input: { _serverResult: [{ id: "d1" }] },
    });
    const res = await executeAction(a, { router: mockRouter });
    expect(res.success).toBe(true);
    expect(res.data).toEqual([{ id: "d1" }]);
    expect(api.drafts.list).not.toHaveBeenCalled();
  });

  // ── navigate ──

  it("pushes simple page", async () => {
    const a = action({ type: "navigate", input: { page: "/dashboard" } });
    const res = await executeAction(a, { router: mockRouter });
    expect(mockRouter.push).toHaveBeenCalledWith("/dashboard");
    expect(res.success).toBe(true);
    expect((res.data as Record<string, unknown>).navigatedTo).toBe(
      "/dashboard",
    );
  });

  it("appends query params to page URL", async () => {
    const a = action({
      type: "navigate",
      input: { page: "/crafting", params: { source: "oracle" } },
    });
    const res = await executeAction(a, { router: mockRouter });
    expect(mockRouter.push).toHaveBeenCalledWith(
      "/crafting?source=oracle",
    );
    expect(res.success).toBe(true);
  });

  // ── generate_draft ──

  it("calls api.drafts.generate with correct args", async () => {
    const draft = { id: "d1", content: "BTC to 100k" };
    (api.drafts.generate as jest.Mock).mockResolvedValue({ draft });

    const a = action({
      type: "generate_draft",
      input: {
        sourceContent: "Bitcoin report",
        sourceType: "REPORT",
        blendId: "blend-1",
      },
    });
    const res = await executeAction(a, { router: mockRouter });

    expect(api.drafts.generate).toHaveBeenCalledWith(
      "Bitcoin report",
      "REPORT",
      "blend-1",
    );
    expect(res.success).toBe(true);
    expect(res.data).toEqual(draft);
  });

  it("defaults sourceType to MANUAL", async () => {
    (api.drafts.generate as jest.Mock).mockResolvedValue({
      draft: { id: "d2" },
    });

    const a = action({
      type: "generate_draft",
      input: { sourceContent: "quick thought" },
    });
    await executeAction(a, { router: mockRouter });

    expect(api.drafts.generate).toHaveBeenCalledWith(
      "quick thought",
      "MANUAL",
      undefined,
    );
  });

  // ── list_drafts ──

  it("passes optional status filter", async () => {
    (api.drafts.list as jest.Mock).mockResolvedValue([]);

    const a = action({
      type: "list_drafts",
      input: { status: "DRAFT" },
    });
    const res = await executeAction(a, { router: mockRouter });

    expect(api.drafts.list).toHaveBeenCalledWith("DRAFT");
    expect(res.success).toBe(true);
  });

  // ── get_voice_profile ──

  it("calls api.voice.getProfile", async () => {
    const profile = { humor: 70, formality: 40 };
    (api.voice.getProfile as jest.Mock).mockResolvedValue(profile);

    const res = await executeAction(
      action({ type: "get_voice_profile" }),
      { router: mockRouter },
    );

    expect(api.voice.getProfile).toHaveBeenCalled();
    expect(res.data).toEqual(profile);
  });

  // ── get_analytics_summary ──

  it("calls api.analytics.summary", async () => {
    const summary = { draftsCreated: 12, postsPublished: 5 };
    (api.analytics.summary as jest.Mock).mockResolvedValue(summary);

    const res = await executeAction(
      action({ type: "get_analytics_summary" }),
      { router: mockRouter },
    );

    expect(res.data).toEqual(summary);
  });

  // ── get_trending ──

  it("returns trending topics", async () => {
    const topics = [{ topic: "BTC" }];
    (api.trending.topics as jest.Mock).mockResolvedValue(topics);

    const res = await executeAction(
      action({ type: "get_trending" }),
      { router: mockRouter },
    );
    expect(res.success).toBe(true);
    expect(res.data).toEqual(topics);
  });

  it("returns soft fallback when trending throws", async () => {
    (api.trending.topics as jest.Mock).mockRejectedValue(
      new Error("503"),
    );

    const res = await executeAction(
      action({ type: "get_trending" }),
      { router: mockRouter },
    );
    expect(res.success).toBe(true);
    expect((res.data as Record<string, string>).message).toContain(
      "unavailable",
    );
  });

  // ── get_signals ──

  it("passes category to alerts.feed", async () => {
    (api.alerts.feed as jest.Mock).mockResolvedValue([]);

    const res = await executeAction(
      action({ type: "get_signals", input: { category: "SIGNAL" } }),
      { router: mockRouter },
    );

    expect(api.alerts.feed).toHaveBeenCalledWith("SIGNAL");
    expect(res.success).toBe(true);
  });

  // ── conduct_research ──

  it("calls api.research.conduct", async () => {
    const result = { report: "summary" };
    (api.research.conduct as jest.Mock).mockResolvedValue(result);

    const res = await executeAction(
      action({
        type: "conduct_research",
        input: { query: "ETH merge impact" },
      }),
      { router: mockRouter },
    );

    expect(api.research.conduct).toHaveBeenCalledWith("ETH merge impact");
    expect(res.data).toEqual(result);
  });

  it("returns fail when research throws", async () => {
    (api.research.conduct as jest.Mock).mockRejectedValue(
      new Error("timeout"),
    );

    const res = await executeAction(
      action({
        type: "conduct_research",
        input: { query: "anything" },
      }),
      { router: mockRouter },
    );

    expect(res.success).toBe(false);
    expect(res.error).toBe("Research service unavailable.");
  });

  // ── refine_draft ──

  it("calls api.drafts.refine with draftId and instruction", async () => {
    (api.drafts.refine as jest.Mock).mockResolvedValue({
      draft: { content: "shorter version" },
    });

    const res = await executeAction(
      action({
        type: "refine_draft",
        input: { draftId: "d5", instruction: "make it punchier" },
      }),
      { router: mockRouter },
    );

    expect(api.drafts.refine).toHaveBeenCalledWith(
      "d5",
      "make it punchier",
    );
    expect(res.success).toBe(true);
  });

  // ── post_draft ──

  it("calls api.drafts.postToX", async () => {
    (api.drafts.postToX as jest.Mock).mockResolvedValue({
      tweetId: "tw-1",
    });

    const res = await executeAction(
      action({ type: "post_draft", input: { draftId: "d6" } }),
      { router: mockRouter },
    );

    expect(api.drafts.postToX).toHaveBeenCalledWith("d6");
    expect(res.success).toBe(true);
  });

  // ── schedule_draft ──

  it("calls api.drafts.schedule", async () => {
    (api.drafts.schedule as jest.Mock).mockResolvedValue({
      draft: { scheduledAt: "2026-04-15T10:00:00Z" },
    });

    const res = await executeAction(
      action({
        type: "schedule_draft",
        input: { draftId: "d7", scheduledAt: "2026-04-15T10:00:00Z" },
      }),
      { router: mockRouter },
    );

    expect(api.drafts.schedule).toHaveBeenCalledWith(
      "d7",
      "2026-04-15T10:00:00Z",
    );
    expect(res.success).toBe(true);
  });

  // ── calibrate_voice ──

  it("calls api.voice.calibrate", async () => {
    (api.voice.calibrate as jest.Mock).mockResolvedValue({ ok: true });

    const res = await executeAction(
      action({
        type: "calibrate_voice",
        input: { handle: "hasufl" },
      }),
      { router: mockRouter },
    );

    expect(api.voice.calibrate).toHaveBeenCalledWith("hasufl");
    expect(res.success).toBe(true);
  });

  // ── update_voice_dimension ──

  it("calls api.voice.updateProfile with dimensions", async () => {
    (api.voice.updateProfile as jest.Mock).mockResolvedValue({ ok: true });

    const dims = { humor: 80, formality: 30 };
    const res = await executeAction(
      action({
        type: "update_voice_dimension",
        input: { dimensions: dims },
      }),
      { router: mockRouter },
    );

    expect(api.voice.updateProfile).toHaveBeenCalledWith(dims);
    expect(res.success).toBe(true);
  });

  // ── subscribe_signal ──

  it("calls api.alerts.subscribe", async () => {
    (api.alerts.subscribe as jest.Mock).mockResolvedValue({ id: "sub-1" });

    const res = await executeAction(
      action({
        type: "subscribe_signal",
        input: { type: "KEYWORD", value: "DeFi" },
      }),
      { router: mockRouter },
    );

    expect(api.alerts.subscribe).toHaveBeenCalledWith("KEYWORD", "DeFi");
    expect(res.success).toBe(true);
  });

  // ── Unknown action ──

  it("returns fail for unknown action type", async () => {
    const res = await executeAction(
      action({ type: "teleport" as string }),
      { router: mockRouter },
    );
    expect(res.success).toBe(false);
    expect(res.error).toBe("Unknown action: teleport");
  });

  // ── Generic error handling ──

  it("catches thrown errors and returns fail", async () => {
    (api.voice.getProfile as jest.Mock).mockRejectedValue(
      new Error("Network down"),
    );

    const res = await executeAction(
      action({ type: "get_voice_profile" }),
      { router: mockRouter },
    );

    expect(res.success).toBe(false);
    expect(res.error).toBe("Network down");
  });

  it("stringifies non-Error throws", async () => {
    (api.voice.getProfile as jest.Mock).mockRejectedValue("raw string");

    const res = await executeAction(
      action({ type: "get_voice_profile" }),
      { router: mockRouter },
    );

    expect(res.success).toBe(false);
    expect(res.error).toBe("raw string");
  });
});

// ── summarizeResult ──────────────────────────────────────────────────────

describe("summarizeResult", () => {
  function result(
    a: OracleAgentAction,
    overrides: Partial<OracleActionResult>,
  ): OracleActionResult {
    return {
      actionId: a.id,
      type: a.type,
      success: true,
      ...overrides,
    };
  }

  it("returns error message on failure", () => {
    const a = action({ type: "navigate" });
    const r = result(a, { success: false, error: "Unauthorized" });
    expect(summarizeResult(a, r)).toBe("Failed: Unauthorized");
  });

  it("returns label when data is undefined", () => {
    const a = action({ type: "navigate", label: "Go to dashboard" });
    const r = result(a, { data: undefined });
    expect(summarizeResult(a, r)).toBe("Go to dashboard");
  });

  it("summarizes navigate", () => {
    const a = action({ type: "navigate" });
    const r = result(a, { data: { navigatedTo: "/crafting" } });
    expect(summarizeResult(a, r)).toBe("Navigated to /crafting");
  });

  it("summarizes generate_draft with content preview", () => {
    const a = action({ type: "generate_draft" });
    const content = "A".repeat(200);
    const r = result(a, { data: { content } });
    const summary = summarizeResult(a, r);
    expect(summary).toContain('Draft: "');
    expect(summary.length).toBeLessThan(200);
  });

  it("summarizes generate_draft without content", () => {
    const a = action({ type: "generate_draft" });
    const r = result(a, { data: {} });
    expect(summarizeResult(a, r)).toBe("Draft generated.");
  });

  it("summarizes list_drafts with count", () => {
    const a = action({ type: "list_drafts" });
    const r = result(a, { data: { drafts: [{}, {}, {}] } });
    expect(summarizeResult(a, r)).toBe("Found 3 drafts.");
  });

  it("summarizes list_drafts singular", () => {
    const a = action({ type: "list_drafts" });
    const r = result(a, { data: { drafts: [{}] } });
    expect(summarizeResult(a, r)).toBe("Found 1 draft.");
  });

  it("summarizes list_drafts with no drafts array", () => {
    const a = action({ type: "list_drafts" });
    const r = result(a, { data: {} });
    expect(summarizeResult(a, r)).toBe("No drafts found.");
  });

  it("summarizes get_analytics_summary", () => {
    const a = action({ type: "get_analytics_summary" });
    const r = result(a, {
      data: { draftsCreated: 10, postsPublished: 3 },
    });
    expect(summarizeResult(a, r)).toBe(
      "30-day stats: 10 drafts, 3 posted.",
    );
  });

  it("summarizes get_voice_profile", () => {
    const a = action({ type: "get_voice_profile" });
    const r = result(a, { data: { humor: 70 } });
    expect(summarizeResult(a, r)).toBe("Voice profile loaded.");
  });

  it("summarizes get_trending", () => {
    const a = action({ type: "get_trending" });
    const r = result(a, { data: { topics: [] } });
    expect(summarizeResult(a, r)).toBe("Trending topics loaded.");
  });

  it("summarizes get_signals with count", () => {
    const a = action({ type: "get_signals" });
    const r = result(a, { data: { signals: [{}, {}] } });
    expect(summarizeResult(a, r)).toBe("2 signals in your feed.");
  });

  it("summarizes get_signals singular", () => {
    const a = action({ type: "get_signals" });
    const r = result(a, { data: { signals: [{}] } });
    expect(summarizeResult(a, r)).toBe("1 signal in your feed.");
  });

  it("summarizes get_signals with no array", () => {
    const a = action({ type: "get_signals" });
    const r = result(a, { data: {} });
    expect(summarizeResult(a, r)).toBe("No signals right now.");
  });

  it("summarizes refine_draft with content", () => {
    const a = action({ type: "refine_draft" });
    const r = result(a, { data: { content: "Shorter take on ETH." } });
    expect(summarizeResult(a, r)).toContain("Refined:");
  });

  it("summarizes refine_draft without content", () => {
    const a = action({ type: "refine_draft" });
    const r = result(a, { data: {} });
    expect(summarizeResult(a, r)).toBe("Draft refined.");
  });

  it("summarizes post_draft", () => {
    const a = action({ type: "post_draft" });
    const r = result(a, { data: { tweetId: "tw-1" } });
    expect(summarizeResult(a, r)).toBe("Posted to X.");
  });

  it("summarizes schedule_draft with date", () => {
    const a = action({ type: "schedule_draft" });
    const r = result(a, {
      data: { scheduledAt: "2026-04-15T14:00:00.000Z" },
    });
    expect(summarizeResult(a, r)).toContain("Scheduled for 2026-04-15T14");
  });

  it("summarizes schedule_draft without date", () => {
    const a = action({ type: "schedule_draft" });
    const r = result(a, { data: {} });
    expect(summarizeResult(a, r)).toContain("Scheduled for later");
  });

  it("summarizes calibrate_voice", () => {
    const a = action({ type: "calibrate_voice" });
    const r = result(a, { data: {} });
    expect(summarizeResult(a, r)).toBe(
      "Voice calibrated from X account.",
    );
  });

  it("summarizes update_voice_dimension", () => {
    const a = action({ type: "update_voice_dimension" });
    const r = result(a, { data: {} });
    expect(summarizeResult(a, r)).toBe("Voice dimensions updated.");
  });

  it("summarizes subscribe_signal", () => {
    const a = action({ type: "subscribe_signal" });
    const r = result(a, { data: {} });
    expect(summarizeResult(a, r)).toBe("Subscribed to signals.");
  });

  it("summarizes conduct_research", () => {
    const a = action({ type: "conduct_research" });
    const r = result(a, { data: {} });
    expect(summarizeResult(a, r)).toBe("Research complete.");
  });

  it("falls back to label for unknown type", () => {
    const a = action({ type: "teleport" as string, label: "Beam me up" });
    const r = result(a, { data: {} });
    expect(summarizeResult(a, r)).toBe("Beam me up");
  });
});

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => {
      return {
        json: async () => body,
        status: init?.status ?? 200,
      };
    },
  },
}));

const { POST } = require("@/app/api/queue/smart-rank/route");

describe("POST /api/queue/smart-rank", () => {
  function makeReq(body: unknown, opts?: { cookies?: Record<string, string>; authHeader?: string }) {
    return {
      json: async () => body,
      cookies: {
        has: (name: string) => Boolean(opts?.cookies?.[name]),
      },
      headers: {
        get: (name: string) => (name.toLowerCase() === "authorization" ? opts?.authHeader ?? null : null),
      },
    } as unknown as import("next/server").NextRequest;
  }

  function makeBadReq() {
    return {
      json: async () => {
        throw new Error("Invalid JSON");
      },
      cookies: { has: () => true },
      headers: { get: () => null },
    } as unknown as import("next/server").NextRequest;
  }

  it("returns 401 when no session", async () => {
    const req = makeReq({ drafts: [] });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when text exceeds 500 chars", async () => {
    const req = makeReq({ text: "a".repeat(501) }, { cookies: { atlas_session: "1" } });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns empty array when no drafts provided", async () => {
    const req = makeReq({ drafts: [] }, { cookies: { atlas_session: "1" } });
    const res = await POST(req);
    const json = await res.json();
    expect(json).toEqual({ drafts: [] });
  });

  it("ranks drafts and assigns optimal times", async () => {
    const drafts = [
      {
        id: "d1",
        content: "Just a basic update",
        status: "APPROVED",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      },
      {
        id: "d2",
        content: "Bitcoin breakout analysis 🧵 #btc #crypto",
        status: "APPROVED",
        createdAt: new Date().toISOString(),
      },
    ];

    const req = makeReq({ drafts }, { cookies: { atlas_session: "1" } });
    const res = await POST(req);
    const json = await res.json();

    expect(json.drafts).toHaveLength(2);
    expect(json.drafts[0].id).toBe("d2");
    expect(json.drafts[0].predictedEngagement).toBeGreaterThan(
      json.drafts[1].predictedEngagement
    );
    expect(json.drafts[0].optimalTime).toBeDefined();
    expect(json.drafts[0].optimalTimeBadge).toMatch(/\d+:\d+/);
  });

  it("returns 500 on invalid JSON", async () => {
    const req = makeBadReq();
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});

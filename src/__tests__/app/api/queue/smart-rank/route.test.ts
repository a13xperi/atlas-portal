import { POST } from "@/app/api/queue/smart-rank/route";

describe("POST /api/queue/smart-rank", () => {
  it("returns empty array when no drafts provided", async () => {
    const req = new Request("http://localhost/api/queue/smart-rank", {
      method: "POST",
      body: JSON.stringify({ drafts: [] }),
    }) as unknown as import("next/server").NextRequest;

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

    const req = new Request("http://localhost/api/queue/smart-rank", {
      method: "POST",
      body: JSON.stringify({ drafts }),
    }) as unknown as import("next/server").NextRequest;

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
    const req = new Request("http://localhost/api/queue/smart-rank", {
      method: "POST",
      body: "not-json",
    }) as unknown as import("next/server").NextRequest;

    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});

import { api } from "@/lib/api";

const API_URL = "http://localhost:3001";

beforeEach(() => {
  jest.resetAllMocks();
});

function mockFetch(body: unknown, ok = true, status = 200) {
  const res = {
    ok,
    status,
    statusText: ok ? "OK" : "Bad Request",
    json: jest.fn().mockResolvedValue(body),
  };
  global.fetch = jest.fn().mockResolvedValue(res);
  return global.fetch as jest.Mock;
}

describe("api.auth.login", () => {
  it("sends POST with email and password in body", async () => {
    const data = { user: { id: "1", handle: "alice", role: "ANALYST" }, token: "tok_123", refresh_token: "rt_123" };
    mockFetch(data);

    const result = await api.auth.login("alice@example.com", "password123");

    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/api/auth/login`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
        body: JSON.stringify({ email: "alice@example.com", password: "password123" }),
        credentials: "include",
      })
    );
    expect(result).toEqual(data);
  });
});

describe("api.auth.me", () => {
  it("sends GET with credentials: include (cookie-based auth)", async () => {
    const data = { user: { id: "1", handle: "alice", role: "ANALYST", voiceProfile: null } };
    mockFetch(data);

    await api.auth.me();

    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/api/auth/me`,
      expect.objectContaining({
        method: "GET",
        credentials: "include",
      })
    );
  });
});

describe("api.auth.register", () => {
  it("sends POST with handle, email, and password", async () => {
    const data = { user: { id: "2", handle: "bob", role: "ANALYST" }, token: "tok_456", refresh_token: "rt_456" };
    mockFetch(data);

    await api.auth.register("bob", "bob@example.com", "pass123", "crypto");

    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/api/auth/register`,
      expect.objectContaining({
        body: JSON.stringify({ handle: "bob", email: "bob@example.com", password: "pass123", onboardingTrack: "crypto" }),
        credentials: "include",
      })
    );
  });
});

describe("error handling", () => {
  it("throws with error message from response body (non-retryable)", async () => {
    mockFetch({ error: "Invalid credentials" }, false, 401);

    await expect(api.auth.login("bad@test.com", "wrong")).rejects.toThrow("Invalid credentials");
  });

  it("does not retry on 401", async () => {
    mockFetch({ error: "Unauthorized" }, false, 401);

    await expect(api.auth.login("bad@test.com", "wrong")).rejects.toThrow("Unauthorized");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("does not retry on 404", async () => {
    const res = {
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: jest.fn().mockRejectedValue(new Error("parse error")),
    };
    global.fetch = jest.fn().mockResolvedValue(res);

    await expect(api.auth.login("bad@test.com", "wrong")).rejects.toThrow("Not Found");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("retries on 500 up to 3 times then throws", async () => {
    const res500 = {
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: jest.fn().mockResolvedValue({ error: "Server Error" }),
    };
    global.fetch = jest.fn().mockResolvedValue(res500);

    await expect(api.auth.login("test@test.com", "pass")).rejects.toThrow("Server Error");
    expect(fetch).toHaveBeenCalledTimes(3);
  }, 15000);

  it("succeeds on second attempt after transient 500", async () => {
    const res500 = {
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: jest.fn().mockResolvedValue({ error: "Temporary failure" }),
    };
    const resOk = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ user: { id: "1" }, token: "tok", refresh_token: "rt" }),
    };
    global.fetch = jest.fn()
      .mockResolvedValueOnce(res500)
      .mockResolvedValueOnce(resOk);

    const result = await api.auth.login("test@test.com", "pass");
    expect(result).toEqual({ user: { id: "1" }, token: "tok", refresh_token: "rt" });
    expect(fetch).toHaveBeenCalledTimes(2);
  }, 15000);
});

describe("api.drafts.list", () => {
  it("appends status query param when provided", async () => {
    mockFetch({ drafts: [] });

    await api.drafts.list("DRAFT");

    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/api/drafts?status=DRAFT`,
      expect.anything()
    );
  });

  it("omits query param when status is undefined", async () => {
    mockFetch({ drafts: [] });

    await api.drafts.list();

    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/api/drafts`,
      expect.anything()
    );
  });
});

describe("api.drafts.generate", () => {
  it("sends the selected reply angle metadata in the request body", async () => {
    mockFetch({ draft: { id: "draft_1" } });

    await api.drafts.generate({
      sourceContent: "ETH keeps pushing into key resistance.",
      sourceType: "MANUAL",
      blendId: "blend_123",
      replyAngle: "Curious",
      angleInstruction:
        "Write with a curious, questioning tone. Pose thought-provoking questions.",
    });

    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/api/drafts/generate`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          sourceContent: "ETH keeps pushing into key resistance.",
          sourceType: "MANUAL",
          blendId: "blend_123",
          replyAngle: "Curious",
          angleInstruction:
            "Write with a curious, questioning tone. Pose thought-provoking questions.",
        }),
        credentials: "include",
      })
    );
  });
});

describe("api.briefing.updatePreferences", () => {
  it("sends PUT with the briefing preferences payload", async () => {
    const data = {
      preference: {
        deliveryTime: "08:00",
        topics: ["Macro"],
        sources: ["News"],
        channel: "Portal Only",
      },
    };
    mockFetch(data);

    await api.briefing.updatePreferences({
      deliveryTime: "08:00",
      topics: ["Macro"],
      sources: ["News"],
      channel: "Portal Only",
    });

    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/api/briefing/preferences`,
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          deliveryTime: "08:00",
          topics: ["Macro"],
          sources: ["News"],
          channel: "Portal Only",
        }),
        credentials: "include",
      })
    );
  });
});

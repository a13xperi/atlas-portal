import { api, setAccessToken } from "@/lib/api";

const API_URL = "http://localhost:3001";

beforeEach(() => {
  jest.resetAllMocks();
  setAccessToken(null);
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

describe("api.admin.resetUser", () => {
  it("sends POST with the bearer token when present", async () => {
    setAccessToken("tok_admin");
    mockFetch({ success: true });

    await api.admin.resetUser();

    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/api/admin/reset-user`,
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: "Bearer tok_admin",
        }),
      })
    );
  });
});

describe("api.auth.register", () => {
  it("sends POST with handle, email, and password", async () => {
    const data = { user: { id: "2", handle: "bob", role: "ANALYST" }, token: "tok_456", refresh_token: "rt_456" };
    mockFetch(data);

    await api.auth.register("bob", "bob@example.com", "pass123", "TRACK_A");

    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/api/auth/register`,
      expect.objectContaining({
        body: JSON.stringify({ handle: "bob", email: "bob@example.com", password: "pass123", onboardingTrack: "TRACK_A" }),
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

describe("api.analytics.engagementDaily", () => {
  it("wraps legacy array responses in a days object", async () => {
    const data = [{ date: "2026-04-09", dayLabel: "Wed", predicted: 12, actual: 9 }];
    mockFetch(data);

    const result = await api.analytics.engagementDaily();

    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/api/analytics/engagement-daily`,
      expect.objectContaining({
        method: "GET",
        credentials: "include",
      })
    );
    expect(result).toEqual({ days: data });
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

describe("api.referenceAccounts", () => {
  it("loads the reference account catalog from the new endpoint", async () => {
    mockFetch({ accounts: [] });

    await api.referenceAccounts.getAll();

    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/api/voice/reference-accounts`,
      expect.objectContaining({
        method: "GET",
        credentials: "include",
      })
    );
  });

  it("saves selected reference account ids and weights for a user", async () => {
    mockFetch({ success: true, ids: ["hosseeb", "naval"] });

    await api.referenceAccounts.saveSelections("user_1", ["hosseeb", "naval"], {
      hosseeb: 0.5,
      naval: 0.5,
    });

    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/api/users/user_1/reference-accounts`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          ids: ["hosseeb", "naval"],
          weights: {
            hosseeb: 0.5,
            naval: 0.5,
          },
        }),
        credentials: "include",
      })
    );
  });
});

describe("api.twitter.follows", () => {
  it("maps follow payloads from the Twitter follows endpoint", async () => {
    mockFetch({
      follows: [
        {
          id: "tw_1",
          handle: "hasufl",
          display_name: "Hasu",
          bio: "Markets and crypto structure.",
          avatar_url: "https://example.com/hasu.jpg",
          follower_count: 120000,
        },
      ],
      cached: false,
    });

    const result = await api.twitter.follows();

    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/api/twitter/follows`,
      expect.objectContaining({
        method: "GET",
        credentials: "include",
      })
    );
    expect(result).toEqual({
      cached: false,
      follows: [
        {
          id: "tw_1",
          handle: "hasufl",
          displayName: "Hasu",
          bio: "Markets and crypto structure.",
          avatarUrl: "https://example.com/hasu.jpg",
          followerCount: 120000,
        },
      ],
    });
  });
});

describe("api.voice.blend", () => {
  it("sends the primary and additional inspiration ids to the blend endpoint", async () => {
    mockFetch({
      blendedProfile: {
        id: "blend_1",
        primaryTwitterId: "tw_1",
        additionalTwitterIds: ["tw_2"],
        weights: { tw_1: 0.7, tw_2: 0.3 },
        tweetsAnalyzed: 100,
      },
      inspirations: [],
      dimensions: {
        humor: 50,
        formality: 50,
        brevity: 50,
        contrarianTone: 50,
        directness: 50,
        warmth: 50,
        technicalDepth: 50,
        confidence: 50,
        evidenceOrientation: 50,
        solutionOrientation: 50,
        socialPosture: 50,
        selfPromotionalIntensity: 50,
      },
      summary: "ok",
    });

    await api.voice.blend("tw_1", ["tw_2"]);

    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/api/voice/blend`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          primary_id: "tw_1",
          additional_ids: ["tw_2"],
        }),
        credentials: "include",
      })
    );
  });
});

describe("api.briefing.updatePreferences", () => {
  it("sends PATCH with the briefing preferences payload", async () => {
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

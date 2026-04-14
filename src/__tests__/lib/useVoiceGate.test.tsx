import "@testing-library/jest-dom";
import { renderHook, waitFor } from "@testing-library/react";
import { AuthProvider } from "@/lib/auth";
import { api } from "@/lib/api";
import {
  MIN_TWEETS_FOR_VOICE_CALIBRATION,
  useVoiceGate,
} from "@/lib/useVoiceGate";
import { ReactNode } from "react";

jest.mock("@/lib/api", () => ({
  api: {
    auth: {
      login: jest.fn(),
      register: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
      me: jest.fn(),
    },
  },
  setAccessToken: jest.fn(),
  getAccessToken: jest.fn(),
}));

const mockMe = api.auth.me as jest.Mock;
const mockRefresh = api.auth.refresh as jest.Mock;

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

beforeEach(() => {
  jest.resetAllMocks();
});

describe("useVoiceGate", () => {
  it("blocks with reason=no_profile when user has no voiceProfile", async () => {
    mockMe.mockResolvedValue({
      user: { id: "1", handle: "alice", role: "ANALYST", voiceProfile: null },
    });

    const { result } = renderHook(() => useVoiceGate(), { wrapper });

    await waitFor(() => expect(result.current.isBlocked).toBe(true));
    expect(result.current.reason).toBe("no_profile");
    expect(result.current.tweetsAnalyzed).toBe(0);
    expect(result.current.tweetsRemaining).toBe(MIN_TWEETS_FOR_VOICE_CALIBRATION);
    // CTA should route an unconnected user to the X-first onboarding flow,
    // not the Voice Lab — Anil's directive: connect X before Voice Lab.
    expect(result.current.ctaHref).toBe("/onboarding/track-b");
    expect(result.current.ctaLabel).toBe("Calibrate voice");
  });

  it("blocks with reason=insufficient_tweets when profile exists but under floor", async () => {
    mockMe.mockResolvedValue({
      user: {
        id: "1",
        handle: "alice",
        role: "ANALYST",
        voiceProfile: {
          id: "vp-1",
          userId: "1",
          humor: 50,
          formality: 50,
          brevity: 50,
          contrarianTone: 50,
          maturity: "BEGINNER",
          tweetsAnalyzed: 1,
        },
      },
    });

    const { result } = renderHook(() => useVoiceGate(), { wrapper });

    await waitFor(() => expect(result.current.isBlocked).toBe(true));
    expect(result.current.reason).toBe("insufficient_tweets");
    expect(result.current.tweetsAnalyzed).toBe(1);
    expect(result.current.tweetsRemaining).toBe(
      MIN_TWEETS_FOR_VOICE_CALIBRATION - 1
    );
    // Once a profile exists, further calibration happens in the Voice Lab —
    // not back through onboarding.
    expect(result.current.ctaHref).toBe("/voice-profiles");
    expect(result.current.ctaLabel).toBe("Open Voice Lab");
  });

  it("allows generation when profile exists and tweetsAnalyzed meets the floor", async () => {
    mockMe.mockResolvedValue({
      user: {
        id: "1",
        handle: "alice",
        role: "ANALYST",
        voiceProfile: {
          id: "vp-1",
          userId: "1",
          humor: 50,
          formality: 50,
          brevity: 50,
          contrarianTone: 50,
          maturity: "INTERMEDIATE",
          tweetsAnalyzed: MIN_TWEETS_FOR_VOICE_CALIBRATION,
        },
      },
    });

    const { result } = renderHook(() => useVoiceGate(), { wrapper });

    await waitFor(() =>
      expect(result.current.tweetsAnalyzed).toBe(MIN_TWEETS_FOR_VOICE_CALIBRATION)
    );
    expect(result.current.isBlocked).toBe(false);
    expect(result.current.reason).toBeNull();
    expect(result.current.tweetsRemaining).toBe(0);
  });

  it("bypasses insufficient_tweets gate when existingDraftCount > 0", async () => {
    mockMe.mockResolvedValue({
      user: {
        id: "1",
        handle: "alice",
        role: "ANALYST",
        voiceProfile: {
          id: "vp-1",
          userId: "1",
          humor: 50,
          formality: 50,
          brevity: 50,
          contrarianTone: 50,
          maturity: "BEGINNER",
          tweetsAnalyzed: 0,
        },
      },
    });

    const { result } = renderHook(
      () => useVoiceGate({ existingDraftCount: 5 }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.tweetsAnalyzed).toBe(0));
    // Should NOT be blocked because the user has existing drafts
    expect(result.current.isBlocked).toBe(false);
    expect(result.current.reason).toBeNull();
  });

  it("does NOT bypass no_profile gate even when existingDraftCount > 0", async () => {
    mockMe.mockResolvedValue({
      user: { id: "1", handle: "alice", role: "ANALYST", voiceProfile: null },
    });

    const { result } = renderHook(
      () => useVoiceGate({ existingDraftCount: 5 }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isBlocked).toBe(true));
    // no_profile is never bypassed — the user genuinely has no voice data
    expect(result.current.reason).toBe("no_profile");
  });

  it("starts blocked while auth is still loading (no user yet)", () => {
    // Auth.me() never resolves — simulates the brief mount window before
    // session restore completes. The gate should fail closed: blocked.
    mockMe.mockReturnValue(new Promise(() => {}));
    mockRefresh.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useVoiceGate(), { wrapper });

    expect(result.current.isBlocked).toBe(true);
    expect(result.current.reason).toBe("no_profile");
  });
});

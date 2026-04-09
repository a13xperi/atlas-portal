import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import VoiceLabInspirationPicker from "@/components/voice-profiles/VoiceLabInspirationPicker";

const mockStatus = jest.fn();
const mockAuthorize = jest.fn();
const mockFollows = jest.fn();
const mockGetBlendedProfile = jest.fn();
const mockBlend = jest.fn();
const mockGetProfile = jest.fn();

jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/lib/auth", () => ({
  useAuth: () => ({
    user: { id: "user-1", handle: "atlas" },
  }),
}));

jest.mock("@/lib/api", () => ({
  ApiError: class ApiError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
    }
  },
  api: {
    auth: {
      x: {
        status: () => mockStatus(),
        authorize: () => mockAuthorize(),
      },
    },
    twitter: {
      follows: () => mockFollows(),
    },
    voice: {
      getBlendedProfile: () => mockGetBlendedProfile(),
      blend: (...args: unknown[]) => mockBlend(...args),
      getProfile: () => mockGetProfile(),
    },
  },
}));

const { ApiError: MockApiError } = jest.requireMock("@/lib/api") as {
  ApiError: new (message: string, statusCode: number) => Error & {
    statusCode: number;
  };
};

function makeFollow(index: number) {
  return {
    id: `follow-${index}`,
    handle: `voice${index}`,
    displayName: `Voice ${index}`,
    bio: `Bio snippet for voice ${index}`,
    avatarUrl: null,
    followerCount: 10_000 - index * 100,
  };
}

describe("VoiceLabInspirationPicker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows the X connect CTA when the account is not linked", async () => {
    mockStatus.mockResolvedValue({ linked: false, xHandle: null });
    mockGetBlendedProfile.mockRejectedValue(new MockApiError("Missing", 404));

    render(<VoiceLabInspirationPicker />);

    expect(
      await screen.findByText("Connect X to unlock inspiration picking")
    ).toBeInTheDocument();
    expect(mockFollows).not.toHaveBeenCalled();
  });

  it("renders a slim follow list and saves the selected inspiration mix", async () => {
    const refreshedProfile = {
      id: "vp-1",
      userId: "user-1",
      humor: 55,
      formality: 67,
      brevity: 61,
      contrarianTone: 58,
      directness: 60,
      warmth: 44,
      technicalDepth: 73,
      confidence: 66,
      evidenceOrientation: 80,
      solutionOrientation: 54,
      socialPosture: 42,
      selfPromotionalIntensity: 18,
      maturity: "ADVANCED" as const,
      tweetsAnalyzed: 120,
    };

    mockStatus.mockResolvedValue({ linked: true, xHandle: "atlas_handle" });
    mockGetBlendedProfile
      .mockRejectedValueOnce(new MockApiError("Missing", 404))
      .mockResolvedValueOnce({
        profile: {
          id: "blend-1",
          primaryTwitterId: "follow-1",
          primaryHandle: "voice1",
          additionalTwitterIds: ["follow-2"],
          additionalHandles: ["voice2"],
          weights: { "follow-1": 0.7, "follow-2": 0.3 },
          dimensions: {
            humor: 55,
            formality: 67,
            brevity: 61,
            contrarianTone: 58,
            directness: 60,
            warmth: 44,
            technicalDepth: 73,
            confidence: 66,
            evidenceOrientation: 80,
            solutionOrientation: 54,
            socialPosture: 42,
            selfPromotionalIntensity: 18,
          },
          styleSignals: null,
          tweetsAnalyzed: 120,
          blendSummary: "Saved blend",
          createdAt: "2026-04-09T00:00:00.000Z",
          updatedAt: "2026-04-09T00:00:00.000Z",
        },
      });
    mockFollows.mockResolvedValue({
      cached: false,
      follows: Array.from({ length: 13 }, (_, index) => makeFollow(index + 1)),
    });
    mockBlend.mockResolvedValue({ summary: "ok" });
    mockGetProfile.mockResolvedValue({ profile: refreshedProfile });

    const onProfileRefresh = jest.fn();

    render(<VoiceLabInspirationPicker onProfileRefresh={onProfileRefresh} />);

    expect(await screen.findByText("Voice 1")).toBeInTheDocument();
    expect(screen.getByText("Bio snippet for voice 1")).toBeInTheDocument();
    expect(screen.queryByText("Voice 13")).not.toBeInTheDocument();

    const voiceOneCard = screen.getByText("Voice 1").closest("article");
    const voiceTwoCard = screen.getByText("Voice 2").closest("article");

    expect(voiceOneCard).not.toBeNull();
    expect(voiceTwoCard).not.toBeNull();

    fireEvent.click(
      within(voiceOneCard as HTMLElement).getByRole("button", {
        name: "Set primary",
      })
    );
    fireEvent.click(
      within(voiceTwoCard as HTMLElement).getByRole("button", {
        name: "Add secondary",
      })
    );

    const saveButton = screen.getByRole("button", {
      name: "Apply inspirations",
    });

    await waitFor(() => {
      expect(saveButton).toBeEnabled();
    });

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockBlend).toHaveBeenCalledWith("follow-1", ["follow-2"]);
    });
    expect(mockGetProfile).toHaveBeenCalledTimes(1);
    expect(onProfileRefresh).toHaveBeenCalledWith(refreshedProfile);
    expect(
      await screen.findByText("Voice inspirations saved to your profile.")
    ).toBeInTheDocument();
  });

  it("preloads an existing saved blend and keeps saved inspirations visible", async () => {
    mockStatus.mockResolvedValue({ linked: true, xHandle: "atlas_handle" });
    mockGetBlendedProfile.mockResolvedValue({
      profile: {
        id: "blend-2",
        primaryTwitterId: "follow-9",
        primaryHandle: "voice9",
        additionalTwitterIds: ["follow-10"],
        additionalHandles: ["voice10"],
        weights: { "follow-9": 0.7, "follow-10": 0.3 },
        dimensions: {
          humor: 49,
          formality: 72,
          brevity: 63,
          contrarianTone: 62,
          directness: 65,
          warmth: 41,
          technicalDepth: 78,
          confidence: 70,
          evidenceOrientation: 84,
          solutionOrientation: 57,
          socialPosture: 39,
          selfPromotionalIntensity: 16,
        },
        styleSignals: null,
        tweetsAnalyzed: 144,
        blendSummary: "Saved blend",
        createdAt: "2026-04-09T00:00:00.000Z",
        updatedAt: "2026-04-09T00:00:00.000Z",
      },
    });
    mockFollows.mockResolvedValue({
      cached: false,
      follows: Array.from({ length: 13 }, (_, index) => makeFollow(index + 1)),
    });

    render(<VoiceLabInspirationPicker />);

    await waitFor(() => {
      expect(screen.getAllByText("Voice 9").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Voice 10").length).toBeGreaterThan(0);
    });
    expect(screen.getByText("Saved blend")).toBeInTheDocument();
    expect(screen.getByText("144 tweets analyzed")).toBeInTheDocument();
  });
});

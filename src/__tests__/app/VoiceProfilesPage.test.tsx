import "@testing-library/jest-dom";
import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DEFAULT_VOICE_DIMENSIONS } from "@/lib/voice-profile-dimensions";

const ctDegenPreset = {
  ...DEFAULT_VOICE_DIMENSIONS,
  humor: 80,
  formality: 20,
  brevity: 90,
  contrarianTone: 70,
};

const mockProfile = {
  id: "vp1",
  userId: "u1",
  humor: 35,
  formality: 70,
  brevity: 65,
  contrarianTone: 45,
  directness: 6,
  warmth: 5,
  technicalDepth: 7,
  confidence: 6,
  evidenceOrientation: 8,
  solutionOrientation: 5,
  socialPosture: 4,
  selfPromotionalIntensity: 3,
  maturity: "ADVANCED" as const,
  tweetsAnalyzed: 150,
};

const mockApi = {
  referenceAccounts: {
    getAll: jest.fn().mockResolvedValue({
      accounts: [
        {
          id: "hasufl",
          handle: "hasufl",
          displayName: "Hasu",
          category: "Crypto/VC",
        },
      ],
    }),
    saveSelections: jest.fn().mockResolvedValue({ success: true, ids: [] }),
  },
  voice: {
    getProfile: jest.fn().mockResolvedValue({ profile: mockProfile }),
    getReferences: jest.fn().mockResolvedValue({
      voices: [
        { id: "r1", name: "Hasu", handle: "hasufl", isActive: true },
      ],
    }),
    getBlends: jest.fn().mockResolvedValue({ blends: [] }),
    updateProfile: jest.fn().mockResolvedValue({ profile: mockProfile }),
    calibrate: jest.fn().mockResolvedValue({
      profile: mockProfile,
      calibration: {
        confidence: 0.92,
        analysis: "Aligned",
        tweetsAnalyzed: 150,
        twitterUser: { username: "hasufl", name: "Hasu" },
      },
    }),
    addReference: jest.fn().mockResolvedValue({}),
    createBlend: jest.fn().mockResolvedValue({}),
  },
};

jest.mock("@/components/layout/AppShell", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/components/voice-profiles/ReferenceVoicesSection", () => ({
  __esModule: true,
  default: ({
    references,
  }: {
    references: Array<{ id: string; name: string }>;
  }) => (
    <div>
      {references.map((reference) => (
        <span key={reference.id}>{reference.name}</span>
      ))}
    </div>
  ),
}));

jest.mock("@/lib/api", () => ({
  api: mockApi,
}));

const VoiceProfilesPage = require("@/app/voice-profiles/page").default;

describe("VoiceProfilesPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockApi.voice.getProfile.mockResolvedValue({ profile: mockProfile });
    mockApi.referenceAccounts.getAll.mockResolvedValue({
      accounts: [
        {
          id: "hasufl",
          handle: "hasufl",
          displayName: "Hasu",
          category: "Crypto/VC",
        },
      ],
    });
    mockApi.voice.getReferences.mockResolvedValue({
      voices: [{ id: "r1", name: "Hasu", handle: "hasufl", isActive: true }],
    });
    mockApi.voice.getBlends.mockResolvedValue({ blends: [] });
    mockApi.voice.updateProfile.mockResolvedValue({ profile: mockProfile });
    mockApi.voice.calibrate.mockResolvedValue({
      profile: mockProfile,
      calibration: {
        confidence: 0.92,
        analysis: "Aligned",
        tweetsAnalyzed: 150,
        twitterUser: { username: "hasufl", name: "Hasu" },
      },
    });
  });

  it("renders voice dimensions", async () => {
    render(<VoiceProfilesPage />);

    await waitFor(() => {
      expect(screen.getByText(/humor/i)).toBeInTheDocument();
      expect(screen.getByText(/formality/i)).toBeInTheDocument();
    });
  });

  it("shows reference voices", async () => {
    render(<VoiceProfilesPage />);

    expect((await screen.findAllByText("Hasu")).length).toBeGreaterThan(0);
  });

  it("toggles a saved blend as active and persists it", async () => {
    mockApi.voice.getBlends.mockResolvedValue({
      blends: [
        {
          id: "blend-1",
          name: "Research-heavy",
          voices: [
            { label: "Personal", percentage: 60 },
            { label: "Hasu", percentage: 40 },
          ],
        },
      ],
    });

    render(<VoiceProfilesPage />);

    expect(await screen.findByText("Research-heavy")).toBeInTheDocument();

    const useButton = screen.getByText("Use This Voice");
    fireEvent.click(useButton);

    expect(await screen.findByText("Active")).toBeInTheDocument();
    expect(localStorage.getItem("atlas_active_blend")).toBe("blend-1");
  });

  it("shows the calibration CTA for uncalibrated users and calibrates their handle", async () => {
    const calibratedProfile = {
      ...mockProfile,
      tweetsAnalyzed: 42,
      humor: 55,
    };

    mockApi.voice.getProfile.mockResolvedValue({
      profile: { ...mockProfile, tweetsAnalyzed: 0 },
    });
    mockApi.voice.calibrate.mockResolvedValue({
      profile: calibratedProfile,
      calibration: {
        confidence: 0.88,
        analysis: "Aligned",
        tweetsAnalyzed: 42,
        twitterUser: { username: "vitalik", name: "Vitalik" },
      },
    });

    render(<VoiceProfilesPage />);

    const handleInput = await screen.findByPlaceholderText("@handle");
    expect(handleInput).toBeInTheDocument();

    fireEvent.change(handleInput, { target: { value: "@vitalik" } });
    fireEvent.click(screen.getByText("Calibrate"));

    await waitFor(() => {
      expect(mockApi.voice.calibrate).toHaveBeenCalledWith("vitalik");
    });
  });

  it("shows voice library grid with Personal Voice card", async () => {
    render(<VoiceProfilesPage />);

    expect(await screen.findByText("Personal Voice")).toBeInTheDocument();
    expect(screen.getByText("Your Voices")).toBeInTheDocument();
    expect(screen.getByText("New Voice")).toBeInTheDocument();
  });

  it("shows blend editor section", async () => {
    render(<VoiceProfilesPage />);

    expect(await screen.findByText("Create or Edit a Blend")).toBeInTheDocument();
  });
});

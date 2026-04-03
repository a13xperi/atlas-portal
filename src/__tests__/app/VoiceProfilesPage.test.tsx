import "@testing-library/jest-dom";
import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DEFAULT_VOICE_DIMENSIONS } from "@/lib/voice-profile-dimensions";

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

jest.mock("@/lib/api", () => ({
  api: mockApi,
}));

const VoiceProfilesPage = require("@/app/voice-profiles/page").default;

describe("VoiceProfilesPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockApi.voice.getProfile.mockResolvedValue({ profile: mockProfile });
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

    const useButton = screen.getByText("Use");
    fireEvent.click(useButton);

    expect(await screen.findByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Active Blend")).toBeInTheDocument();
    expect(screen.getAllByText(/60%\s*Personal/).length).toBeGreaterThan(0);
    expect(screen.getByText("40% Hasu")).toBeInTheDocument();
    expect(
      screen.getByText("Drafts will use this blend's voice mix")
    ).toBeInTheDocument();
    expect(localStorage.getItem("atlas_active_blend")).toBe("blend-1");

    fireEvent.click(screen.getByText("Active"));

    await waitFor(() => {
      expect(localStorage.getItem("atlas_active_blend")).toBeNull();
    });
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

    expect(
      await screen.findByText("Auto-calibrate your voice")
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByPlaceholderText("Your X handle (e.g. @vitalik)"),
      {
        target: { value: "@vitalik" },
      }
    );

    fireEvent.click(screen.getByText("Calibrate"));

    await waitFor(() => {
      expect(mockApi.voice.calibrate).toHaveBeenCalledWith("vitalik");
      expect(
        screen.queryByText("Auto-calibrate your voice")
      ).not.toBeInTheDocument();
    });

    expect(screen.getByText("Based on 42 tweets analyzed.")).toBeInTheDocument();
  });

  it("resets voice dimensions to defaults", async () => {
    const resetProfile = {
      ...mockProfile,
      ...DEFAULT_VOICE_DIMENSIONS,
    };

    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);
    mockApi.voice.updateProfile.mockResolvedValueOnce({ profile: resetProfile });

    render(<VoiceProfilesPage />);

    expect(
      await screen.findByRole("button", { name: /reset to defaults/i })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /reset to defaults/i }));

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalledWith(
        "Reset all voice dimensions to defaults?"
      );
      expect(mockApi.voice.updateProfile).toHaveBeenCalledWith(
        DEFAULT_VOICE_DIMENSIONS
      );
    });

    confirmSpy.mockRestore();
  });
});

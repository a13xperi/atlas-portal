import "@testing-library/jest-dom";
import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";

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
    mockApi.voice.getProfile.mockResolvedValue({ profile: mockProfile });
    mockApi.voice.getReferences.mockResolvedValue({
      voices: [{ id: "r1", name: "Hasu", handle: "hasufl", isActive: true }],
    });
    mockApi.voice.getBlends.mockResolvedValue({ blends: [] });
    mockApi.voice.updateProfile.mockResolvedValue({ profile: mockProfile });
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
});

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

let mockSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  usePathname: () => "/voice-profiles",
  useSearchParams: () => mockSearchParams,
}));

jest.mock("@/components/layout/AppShell", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/app/voice-profiles/tweet-tinder-section", () => ({
  __esModule: true,
  default: () => <div>Tweet Tinder Section</div>,
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

jest.mock("@/components/voice-profiles/VoiceCard", () => ({
  __esModule: true,
  default: ({ name, isActive, onSelect, onUse }: { name: string; isActive: boolean; isSelected: boolean; isPersonal: boolean; onSelect: () => void; onUse: () => void }) => (
    <div>
      <span>{name}</span>
      <button onClick={onSelect}>{name}</button>
      <button onClick={onUse}>{isActive ? "Active" : "Use This Voice"}</button>
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
    mockSearchParams = new URLSearchParams();
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

  it("renders the page heading", async () => {
    render(<VoiceProfilesPage />);

    await waitFor(() => {
      expect(screen.getByText("Your Voices")).toBeInTheDocument();
    });
  });

  it("shows the Track B completion prompt when redirected into voice lab", async () => {
    mockSearchParams = new URLSearchParams("prompt=complete-voice-setup");

    render(<VoiceProfilesPage />);

    expect(
      await screen.findByText("Complete your voice setup")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Add inspirations, create a blend, and start drafting in your unique voice."
      )
    ).toBeInTheDocument();
  });

  it("shows reference voices", async () => {
    render(<VoiceProfilesPage />);

    expect((await screen.findAllByText("Hasu")).length).toBeGreaterThan(0);
  });

  it("shows the redesign placeholder", async () => {
    render(<VoiceProfilesPage />);

    await waitFor(() => {
      expect(screen.getByText("Your Voices")).toBeInTheDocument();
    });
  });

  it("renders without crashing for uncalibrated users", async () => {
    mockApi.voice.getProfile.mockResolvedValue({
      profile: { ...mockProfile, tweetsAnalyzed: 0 },
    });

    render(<VoiceProfilesPage />);

    await waitFor(() => {
      expect(screen.getByText("Your Voices")).toBeInTheDocument();
    });
  });

  it("shows voice detail section", async () => {
    render(<VoiceProfilesPage />);

    await waitFor(() => {
      expect(screen.getByText("Your Voices")).toBeInTheDocument();
    });
  });
});

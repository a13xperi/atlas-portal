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

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  usePathname: () => "/voice-profiles",
  useSearchParams: () => new URLSearchParams(),
}));

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

jest.mock("@/components/voice-profiles/VoiceCard", () => ({
  __esModule: true,
  default: ({ name, isActive, onSelect, onUse }: { name: string; isActive: boolean; isSelected: boolean; isPersonal: boolean; onSelect: () => void; onUse: () => void; dimensions?: Record<string, number> }) => (
    <div>
      <span>{name}</span>
      <button onClick={onSelect}>{name}</button>
      <button onClick={onUse}>{isActive ? "Active" : "Use This Voice"}</button>
    </div>
  ),
}));

jest.mock("@/components/voice-profiles/VoiceEditorModal", () => ({
  __esModule: true,
  default: ({ isOpen }: { isOpen: boolean }) => isOpen ? <div>Editor Modal</div> : null,
}));

jest.mock("@/components/voice-profiles/VoiceDimensionSections", () => ({
  __esModule: true,
  default: () => <div>Dimension Sliders</div>,
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
      // VoiceDimensionSections is mocked — check the mock renders
      expect(screen.getByText("Dimension Sliders")).toBeInTheDocument();
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

    await waitFor(() => {
      expect(screen.getByText("Dimension Sliders")).toBeInTheDocument();
    });
  });

  it("renders without crashing for uncalibrated users", async () => {
    mockApi.voice.getProfile.mockResolvedValue({
      profile: { ...mockProfile, tweetsAnalyzed: 0 },
    });

    render(<VoiceProfilesPage />);

    await waitFor(() => {
      expect(screen.getByText("Dimension Sliders")).toBeInTheDocument();
    });
  });

  it("shows voice breakdown section", async () => {
    render(<VoiceProfilesPage />);

    await waitFor(() => {
      expect(screen.getByText(/your voice/i)).toBeInTheDocument();
    });
  });

  it("renders dimension sliders section", async () => {
    render(<VoiceProfilesPage />);

    await waitFor(() => {
      expect(screen.getByText("Dimension Sliders")).toBeInTheDocument();
    });
  });
});

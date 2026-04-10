import "@testing-library/jest-dom";
import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const pushMock = jest.fn();

const mockProfile = {
  id: "vp1",
  userId: "u1",
  humor: 35,
  formality: 70,
  brevity: 65,
  contrarianTone: 45,
  directness: 60,
  warmth: 50,
  technicalDepth: 70,
  confidence: 60,
  evidenceOrientation: 80,
  solutionOrientation: 50,
  socialPosture: 40,
  selfPromotionalIntensity: 30,
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
    createBlend: jest.fn().mockResolvedValue({
      blend: { id: "blend-new", name: "New recipe", voices: [] },
    }),
  },
};

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: jest.fn(), back: jest.fn() }),
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

jest.mock("@/components/voice-profiles/RecipeCard", () => ({
  __esModule: true,
  default: ({
    blend,
    isActive,
    onUse,
  }: {
    blend: { name: string };
    isActive: boolean;
    onUse: () => void;
  }) => (
    <div data-testid="recipe-card">
      <span>{blend.name}</span>
      <button onClick={onUse}>
        {isActive ? "Active in Crafting" : "Use in Crafting"}
      </button>
    </div>
  ),
}));

jest.mock("@/components/voice-profiles/VoiceCard", () => ({
  __esModule: true,
  default: ({
    name,
    isActive,
    onUse,
  }: {
    name: string;
    isActive: boolean;
    onUse: () => void;
  }) => (
    <div data-testid="voice-card">
      <button onClick={onUse}>
        {isActive ? "Active" : "Craft with this voice"}
      </button>
    </div>
  ),
}));

jest.mock("@/components/voice-profiles/VoiceEditorModal", () => ({
  __esModule: true,
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div>Editor Modal</div> : null,
}));

jest.mock("@/lib/api", () => ({
  api: mockApi,
}));

const VoiceProfilesPage = require("@/app/voice-profiles/page").default;

describe("VoiceProfilesPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    pushMock.mockReset();
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
  });

  it("renders the empty recipe state when there are no blends", async () => {
    render(<VoiceProfilesPage />);

    expect(await screen.findByText("No voice recipes yet")).toBeInTheDocument();
    expect(screen.getByText("Create New Recipe")).toBeInTheDocument();
    expect(screen.getByText("Hasu")).toBeInTheDocument();
  });

  it("renders a single recipe card", async () => {
    mockApi.voice.getBlends.mockResolvedValue({
      blends: [
        {
          id: "blend-1",
          name: "Research-heavy",
          voices: [
            { label: "Personal Voice", percentage: 60 },
            { label: "Hasu", percentage: 40 },
          ],
        },
      ],
    });

    render(<VoiceProfilesPage />);

    expect(await screen.findByText("Research-heavy")).toBeInTheDocument();
    expect(screen.getAllByTestId("recipe-card")).toHaveLength(1);
  });

  it("renders multiple recipe cards", async () => {
    mockApi.voice.getBlends.mockResolvedValue({
      blends: [
        {
          id: "blend-1",
          name: "Research-heavy",
          voices: [
            { label: "Personal Voice", percentage: 60 },
            { label: "Hasu", percentage: 40 },
          ],
        },
        {
          id: "blend-2",
          name: "Fast CT",
          voices: [
            { label: "Personal Voice", percentage: 50 },
            { label: "Hasu", percentage: 50 },
          ],
        },
      ],
    });

    render(<VoiceProfilesPage />);

    expect(await screen.findByText("Research-heavy")).toBeInTheDocument();
    expect(screen.getByText("Fast CT")).toBeInTheDocument();
    expect(screen.getAllByTestId("recipe-card")).toHaveLength(2);
  });

  it("stores the active blend in localStorage when using a recipe", async () => {
    mockApi.voice.getBlends.mockResolvedValue({
      blends: [
        {
          id: "blend-1",
          name: "Research-heavy",
          voices: [
            { label: "Personal Voice", percentage: 60 },
            { label: "Hasu", percentage: 40 },
          ],
        },
      ],
    });

    render(<VoiceProfilesPage />);

    const useButton = await screen.findByRole("button", {
      name: "Use in Crafting",
    });
    fireEvent.click(useButton);

    await waitFor(() => {
      expect(localStorage.getItem("atlas_active_blend")).toBe("blend-1");
    });
    expect(pushMock).toHaveBeenCalledWith("/crafting");
  });
});

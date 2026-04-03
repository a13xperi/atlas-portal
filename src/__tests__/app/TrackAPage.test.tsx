import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import TrackAPage from "@/app/onboarding/track-a/page";
import { api } from "@/lib/api";

const push = jest.fn();
const mockUseAuth = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
  }),
}));

jest.mock("@/lib/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("@/components/layout/OnboardingShell", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/components/voice-profiles/VoiceDimensionSections", () => ({
  __esModule: true,
  default: () => <div>Voice dimensions</div>,
}));

jest.mock("@/lib/api", () => ({
  api: {
    users: {
      updateProfile: jest.fn(),
    },
    voice: {
      updateProfile: jest.fn(),
      addReference: jest.fn(),
      createBlend: jest.fn(),
    },
  },
}));

const mockedApi = api as {
  users: { updateProfile: jest.Mock };
  voice: {
    updateProfile: jest.Mock;
    addReference: jest.Mock;
    createBlend: jest.Mock;
  };
};

describe("TrackAPage", () => {
  beforeEach(() => {
    push.mockClear();
    mockUseAuth.mockReturnValue({
      user: { handle: "AtlasAnalyst", displayName: "" },
    });
    mockedApi.users.updateProfile.mockReset();
    mockedApi.voice.updateProfile.mockReset();
    mockedApi.voice.addReference.mockReset();
    mockedApi.voice.createBlend.mockReset();
    mockedApi.users.updateProfile.mockResolvedValue({ user: {} });
    mockedApi.voice.updateProfile.mockResolvedValue({ profile: {} });
    mockedApi.voice.addReference.mockResolvedValue({ voice: {} });
    mockedApi.voice.createBlend.mockResolvedValue({ blend: {} });
  });

  it("shows an inline display name validation error before saving", async () => {
    render(<TrackAPage />);

    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "A" },
    });
    fireEvent.click(screen.getByRole("button", { name: /get started/i }));

    expect(
      await screen.findByText("Display name must be at least 2 characters.")
    ).toBeInTheDocument();
    expect(mockedApi.users.updateProfile).not.toHaveBeenCalled();
    expect(mockedApi.voice.updateProfile).not.toHaveBeenCalled();
  });

  it("saves the display name and 12-dimension voice profile when the form is valid", async () => {
    render(<TrackAPage />);

    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "Atlas Analyst" },
    });
    fireEvent.click(screen.getByRole("button", { name: /get started/i }));

    await waitFor(() => {
      expect(mockedApi.users.updateProfile).toHaveBeenCalledWith({
        displayName: "Atlas Analyst",
      });
      expect(mockedApi.voice.updateProfile).toHaveBeenCalledWith({
        humor: 35,
        formality: 20,
        brevity: 60,
        contrarianTone: 45,
        directness: 62,
        warmth: 44,
        technicalDepth: 72,
        confidence: 64,
        evidenceOrientation: 68,
        solutionOrientation: 56,
        socialPosture: 48,
        selfPromotionalIntensity: 18,
      });
      expect(push).toHaveBeenCalledWith("/onboarding/handoff");
    });
  });
});

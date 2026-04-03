import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

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

const { api } = require("@/lib/api");
const TrackBPage = require("@/app/onboarding/track-b/page").default;

const mockedApi = api as unknown as {
  users: { updateProfile: jest.Mock };
  voice: {
    updateProfile: jest.Mock;
    addReference: jest.Mock;
    createBlend: jest.Mock;
  };
};

describe("TrackBPage", () => {
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
    render(<TrackBPage />);

    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "A" },
    });
    fireEvent.click(screen.getByRole("button", { name: /let.*get started/i }));

    expect(
      await screen.findByText("Display name must be at least 2 characters.")
    ).toBeInTheDocument();
    expect(mockedApi.users.updateProfile).not.toHaveBeenCalled();
    expect(mockedApi.voice.updateProfile).not.toHaveBeenCalled();
  });

  it("saves the display name and selected style as a full voice profile", async () => {
    render(<TrackBPage />);

    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "Atlas Analyst" },
    });
    fireEvent.click(screen.getByRole("button", { name: /let.*get started/i }));

    await waitFor(() => {
      expect(mockedApi.users.updateProfile).toHaveBeenCalledWith({
        displayName: "Atlas Analyst",
      });
      expect(mockedApi.voice.updateProfile).toHaveBeenCalledWith({
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
      });
      expect(push).toHaveBeenCalledWith("/onboarding/handoff");
    });
  });
});

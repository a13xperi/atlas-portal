import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import TrackBPage from "@/app/onboarding/track-b/page";
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

jest.mock("@/lib/api", () => ({
  api: {
    voice: {
      updateProfile: jest.fn(),
      addReference: jest.fn(),
      createBlend: jest.fn(),
    },
  },
}));

const mockedApi = api as {
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
      user: { handle: "AtlasAnalyst" },
    });
    mockedApi.voice.updateProfile.mockReset();
    mockedApi.voice.addReference.mockReset();
    mockedApi.voice.createBlend.mockReset();
    mockedApi.voice.updateProfile.mockResolvedValue({ profile: {} });
    mockedApi.voice.addReference.mockResolvedValue({ voice: {} });
    mockedApi.voice.createBlend.mockResolvedValue({ blend: {} });
  });

  it("saves the selected style as a 12-dimension voice profile", async () => {
    render(<TrackBPage />);

    fireEvent.click(screen.getByRole("button", { name: /let.*get started/i }));

    await waitFor(() => {
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

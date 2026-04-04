import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const push = jest.fn();
const mockUseAuth = jest.fn();
const mockOnboardingShell = jest.fn();

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
  default: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    step?: number;
    totalSteps?: number;
  }) => {
    mockOnboardingShell(props);
    return <div>{children}</div>;
  },
}));

jest.mock("@/components/voice-profiles/VoiceDimensionSections", () => ({
  __esModule: true,
  default: () => <div>Voice dimensions</div>,
}));

jest.mock("@/components/onboarding/ReferenceVoiceSelector", () => ({
  __esModule: true,
  default: ({
    selected,
    onContinue,
    onSelectionChange,
  }: {
    selected: string[];
    onContinue: () => void;
    onSelectionChange: (ids: string[]) => void;
  }) => (
    <div>
      <p>Reference selector</p>
      <p>{selected.join(",")}</p>
      <button type="button" onClick={() => onSelectionChange(["ref-1", "ref-2"])}>
        Select references
      </button>
      <button type="button" onClick={onContinue}>
        Continue selector
      </button>
    </div>
  ),
}));

jest.mock("@/lib/api", () => ({
  api: {
    users: {
      updateProfile: jest.fn(),
    },
    voice: {
      updateProfile: jest.fn(),
    },
    referenceAccounts: {
      saveSelections: jest.fn(),
    },
  },
}));

const { api } = require("@/lib/api");
const TrackBPage = require("@/app/onboarding/track-b/page").default;

const mockedApi = api as unknown as {
  users: { updateProfile: jest.Mock };
  voice: {
    updateProfile: jest.Mock;
  };
  referenceAccounts: {
    saveSelections: jest.Mock;
  };
};

describe("TrackBPage", () => {
  beforeEach(() => {
    push.mockClear();
    mockOnboardingShell.mockClear();
    mockUseAuth.mockReturnValue({
      user: { id: "u1", handle: "AtlasAnalyst", displayName: "" },
    });
    mockedApi.users.updateProfile.mockReset();
    mockedApi.voice.updateProfile.mockReset();
    mockedApi.referenceAccounts.saveSelections.mockReset();
    mockedApi.users.updateProfile.mockResolvedValue({ user: {} });
    mockedApi.voice.updateProfile.mockResolvedValue({ profile: {} });
    mockedApi.referenceAccounts.saveSelections.mockResolvedValue({
      success: true,
      ids: ["ref-1", "ref-2"],
    });
  });

  it("shows an inline display name validation error before saving", async () => {
    render(<TrackBPage />);

    expect(mockOnboardingShell).toHaveBeenCalledWith({
      maxWidth: "720px",
      step: 1,
      totalSteps: 3,
    });

    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "A" },
    });
    fireEvent.click(screen.getByRole("button", { name: /let.*get started/i }));

    expect(
      await screen.findByText("Display name must be at least 2 characters.")
    ).toBeInTheDocument();
    expect(mockedApi.users.updateProfile).not.toHaveBeenCalled();
    expect(mockedApi.voice.updateProfile).not.toHaveBeenCalled();
    expect(mockedApi.referenceAccounts.saveSelections).not.toHaveBeenCalled();
  });

  it("saves the first step, then persists selected reference voices", async () => {
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
    });

    expect(await screen.findByText("Reference selector")).toBeInTheDocument();
    expect(mockOnboardingShell).toHaveBeenCalledWith({
      maxWidth: "1120px",
      step: 2,
      totalSteps: 3,
    });

    fireEvent.click(screen.getByRole("button", { name: "Select references" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue selector" }));

    await waitFor(() => {
      expect(mockedApi.referenceAccounts.saveSelections).toHaveBeenCalledWith(
        "u1",
        ["ref-1", "ref-2"]
      );
      expect(push).toHaveBeenCalledWith("/onboarding/handoff");
    });
  });
});

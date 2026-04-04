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
      <button type="button" onClick={() => onSelectionChange(["hosseeb", "naval"])}>
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
      addReference: jest.fn(),
      createBlend: jest.fn(),
    },
    referenceAccounts: {
      saveSelections: jest.fn(),
    },
  },
}));

const { api } = require("@/lib/api");
const TrackAPage = require("@/app/onboarding/track-a/page").default;

const mockedApi = api as unknown as {
  users: { updateProfile: jest.Mock };
  voice: {
    updateProfile: jest.Mock;
    addReference: jest.Mock;
    createBlend: jest.Mock;
  };
  referenceAccounts: {
    saveSelections: jest.Mock;
  };
};

describe("TrackAPage", () => {
  beforeEach(() => {
    push.mockClear();
    mockOnboardingShell.mockClear();
    mockUseAuth.mockReturnValue({
      user: { id: "u1", handle: "AtlasAnalyst", displayName: "" },
    });
    mockedApi.users.updateProfile.mockReset();
    mockedApi.voice.updateProfile.mockReset();
    mockedApi.voice.addReference.mockReset();
    mockedApi.voice.createBlend.mockReset();
    mockedApi.referenceAccounts.saveSelections.mockReset();
    mockedApi.users.updateProfile.mockResolvedValue({ user: {} });
    mockedApi.voice.updateProfile.mockResolvedValue({ profile: {} });
    mockedApi.voice.addReference.mockResolvedValue({ voice: {} });
    mockedApi.voice.createBlend.mockResolvedValue({ blend: {} });
    mockedApi.referenceAccounts.saveSelections.mockResolvedValue({
      success: true,
      ids: ["hosseeb", "naval"],
    });
  });

  it("shows an inline display name validation error before saving", async () => {
    render(<TrackAPage />);

    expect(mockOnboardingShell).toHaveBeenCalledWith({
      maxWidth: "720px",
      step: 1,
      totalSteps: 3,
    });

    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "A" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /continue to reference voices/i })
    );

    expect(
      await screen.findByText("Display name must be at least 2 characters.")
    ).toBeInTheDocument();
    expect(mockedApi.users.updateProfile).not.toHaveBeenCalled();
    expect(mockedApi.voice.updateProfile).not.toHaveBeenCalled();
    expect(mockedApi.referenceAccounts.saveSelections).not.toHaveBeenCalled();
  });

  it("saves the first step, then persists selected reference voices", async () => {
    render(<TrackAPage />);

    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "Atlas Analyst" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /continue to reference voices/i })
    );

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
    });

    expect(await screen.findByText("Reference selector")).toBeInTheDocument();
    expect(mockOnboardingShell).toHaveBeenCalledWith({
      maxWidth: "720px",
      step: 2,
      totalSteps: 3,
    });

    fireEvent.click(screen.getByRole("button", { name: "Select references" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue selector" }));

    await waitFor(() => {
      expect(mockedApi.referenceAccounts.saveSelections).toHaveBeenCalledWith(
        "u1",
        ["hosseeb", "naval"],
        { hosseeb: 0.5, naval: 0.5 }
      );
      expect(mockedApi.voice.createBlend).toHaveBeenCalledWith(
        "Onboarding blend",
        [
          { label: "My voice", percentage: 50 },
          { label: "Haseeb Qureshi", percentage: 25 },
          { label: "Naval", percentage: 25 },
        ]
      );
      expect(push).toHaveBeenCalledWith("/onboarding/handoff");
    });
  });
});

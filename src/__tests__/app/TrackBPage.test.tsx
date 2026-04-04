import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

const push = jest.fn();
const mockUseAuth = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

jest.mock("@/lib/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode }) => (
      <div {...props}>{children}</div>
    ),
    span: ({ children, ...props }: { children: React.ReactNode }) => (
      <span {...props}>{children}</span>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

jest.mock("@/components/onboarding/ReferenceVoiceSelector", () => ({
  __esModule: true,
  default: () => <div>Reference selector</div>,
}));

jest.mock("@/components/voice-profiles/VoiceDimensionSections", () => ({
  __esModule: true,
  default: () => <div>Voice dimensions</div>,
}));

jest.mock("@/lib/api", () => ({
  api: {
    users: { updateProfile: jest.fn() },
    voice: {
      updateProfile: jest.fn(),
      calibrate: jest.fn(),
      addReference: jest.fn(),
      createBlend: jest.fn(),
    },
    referenceAccounts: { saveSelections: jest.fn() },
    briefing: { updatePreferences: jest.fn() },
  },
}));

const TrackBPage = require("@/app/onboarding/track-b/page").default;

describe("TrackBPage", () => {
  beforeEach(() => {
    push.mockClear();
    mockUseAuth.mockReturnValue({
      user: { id: "u1", handle: "AtlasAnalyst", displayName: "" },
    });
  });

  it("renders OracleChat and auto-selects Track B", () => {
    render(<TrackBPage />);
    // Track B auto-select triggers the welcome message and style picker
    expect(
      screen.getByText(/no wrong way to do this/i)
    ).toBeInTheDocument();
  });

  it("shows style picker options for Track B", () => {
    render(<TrackBPage />);
    expect(screen.getByText("Fun")).toBeInTheDocument();
    expect(screen.getByText("Serious")).toBeInTheDocument();
    expect(screen.getByText("Custom mix")).toBeInTheDocument();
  });
});

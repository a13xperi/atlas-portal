import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

const push = jest.fn();
const mockUseAuth = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/onboarding/track-a",
}));

jest.mock("@/lib/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => <div {...props}>{children}</div>,
    span: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => <span {...props}>{children}</span>,
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

const TrackAPage = require("@/app/onboarding/track-a/page").default;

describe("TrackAPage", () => {
  beforeEach(() => {
    push.mockClear();
    mockUseAuth.mockReturnValue({
      user: { id: "u1", handle: "AtlasAnalyst", displayName: "" },
    });
  });

  it("renders OracleChat and auto-selects Track A", () => {
    render(<TrackAPage />);
    // Track A auto-select shows the handle input prompt
    expect(screen.getByText(/scan your tweets/i)).toBeInTheDocument();
  });

  it("shows the NavBar in onboarding mode", () => {
    render(<TrackAPage />);
    expect(document.querySelector("nav")).toBeInTheDocument();
  });
});

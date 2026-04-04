import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";

const push = jest.fn();
const mockUseAuth = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/onboarding/track-b",
}));

jest.mock("@/lib/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode; [k: string]: unknown }) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: { children: React.ReactNode; [k: string]: unknown }) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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
    voice: { updateProfile: jest.fn(), calibrate: jest.fn(), addReference: jest.fn(), createBlend: jest.fn() },
    referenceAccounts: { saveSelections: jest.fn() },
    briefing: { updatePreferences: jest.fn() },
  },
}));

beforeAll(() => { window.HTMLElement.prototype.scrollIntoView = jest.fn(); });

const TrackBPage = require("@/app/onboarding/track-b/page").default;

describe("TrackBPage", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    push.mockClear();
    mockUseAuth.mockReturnValue({
      user: { id: "u1", handle: "AtlasAnalyst", displayName: "" },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders Oracle welcome message initially", () => {
    render(<TrackBPage />);
    expect(screen.getByText(/how you write/i)).toBeInTheDocument();
  });

  it("auto-selects Track B with style picker after delay", async () => {
    render(<TrackBPage />);
    jest.advanceTimersByTime(1000);
    await waitFor(() => {
      expect(screen.getByText(/no wrong way to do this/i)).toBeInTheDocument();
    });
  });
});

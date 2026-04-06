import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  usePathname: () => "/briefing",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/components/layout/AppShell", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/components/ui/GlassCard", () => ({
  __esModule: true,
  default: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

jest.mock("@/components/ui/GradientButton", () => ({
  __esModule: true,
  default: ({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
}));

const mockApi = {
  briefing: {
    getPreferences: jest.fn(),
    updatePreferences: jest.fn(),
    history: jest.fn(),
    generate: jest.fn(),
  },
};

jest.mock("@/lib/api", () => ({
  api: mockApi,
}));

const BriefingPage = require("@/app/briefing/page").default;

describe("BriefingPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.briefing.history.mockResolvedValue({ briefings: [] });
  });

  it("shows setup form when no preferences exist", async () => {
    mockApi.briefing.getPreferences.mockResolvedValue({ preference: null });

    render(<BriefingPage />);

    await waitFor(() => {
      expect(screen.getByText("Your Daily Briefing")).toBeInTheDocument();
    });
  });

  it("shows briefing inbox when preferences exist", async () => {
    mockApi.briefing.getPreferences.mockResolvedValue({
      preference: {
        deliveryTime: "08:00",
        topics: ["DeFi"],
        sources: ["News"],
        channel: "Portal Only",
      },
    });

    render(<BriefingPage />);

    await waitFor(() => {
      expect(screen.getByText("Your Briefings")).toBeInTheDocument();
    });
  });

  it("saves preferences and switches to inbox", async () => {
    mockApi.briefing.getPreferences.mockResolvedValue({ preference: null });
    mockApi.briefing.updatePreferences.mockResolvedValue({
      preference: { deliveryTime: "08:00", topics: ["DeFi"], sources: ["News"], channel: "Portal Only" },
    });

    const user = userEvent.setup();
    render(<BriefingPage />);

    await waitFor(() => {
      expect(screen.getByText("Your Daily Briefing")).toBeInTheDocument();
    });

    await user.click(screen.getByText("DeFi"));
    await user.click(screen.getByText("News"));
    await user.click(screen.getByText("Save Preferences"));

    await waitFor(() => {
      expect(screen.getByText("Your Briefings")).toBeInTheDocument();
    });

    expect(mockApi.briefing.updatePreferences).toHaveBeenCalledWith({
      deliveryTime: "08:00",
      topics: ["DeFi"],
      sources: ["News"],
      channel: "Portal Only",
    });
  });
});

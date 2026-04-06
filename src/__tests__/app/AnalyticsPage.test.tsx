import "@testing-library/jest-dom";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";

const mockUseAuth = jest.fn(() => ({
  user: { handle: "TestUser" },
}));

const mockApi = {
  analytics: {
    summary: jest.fn().mockResolvedValue({ summary: null }),
    learningLog: jest.fn().mockResolvedValue({ entries: [] }),
    engagementDaily: jest.fn().mockResolvedValue({ days: [] }),
    activityDaily: jest.fn().mockResolvedValue({ days: [] }),
  },
  drafts: {
    list: jest.fn().mockResolvedValue({ drafts: [] }),
  },
};

jest.mock("@/lib/auth", () => ({
  useAuth: mockUseAuth,
}));

jest.mock("@/components/layout/AppShell", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  usePathname: () => "/analytics",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock("@/lib/api", () => ({
  api: mockApi,
}));

const AnalyticsPage = require("@/app/analytics/page").default;

describe("AnalyticsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { handle: "TestUser" },
    });
    mockApi.analytics.summary.mockResolvedValue({ summary: null });
    mockApi.analytics.learningLog.mockResolvedValue({ entries: [] });
    mockApi.analytics.engagementDaily.mockResolvedValue({ days: [] });
    mockApi.analytics.activityDaily.mockResolvedValue({ days: [] });
    mockApi.drafts.list.mockResolvedValue({ drafts: [] });
  });

  it("renders the empty analytics state when every data source is empty", async () => {
    render(<AnalyticsPage />);

    expect(
      await screen.findByRole("heading", { name: "No analytics data yet" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Start crafting drafts to see your analytics here.")
    ).toBeInTheDocument();
  });

  it("renders zero-value analytics data without invalid chart heights", async () => {
    mockApi.analytics.summary.mockResolvedValueOnce({
      summary: {
        draftsCreated: 0,
        draftsPosted: 0,
        feedbackGiven: 0,
        refinements: 0,
        reportsIngested: 0,
        period: "7d",
      },
    });
    mockApi.analytics.engagementDaily.mockResolvedValueOnce({
      days: [
        {
          date: "2026-04-01",
          dayLabel: "Tue",
          predicted: 0,
          actual: 0,
        },
      ],
    });
    mockApi.analytics.activityDaily.mockResolvedValueOnce({
      days: [
        {
          date: "2026-04-01",
          count: 0,
        },
      ],
    });

    const { container } = render(<AnalyticsPage />);

    expect(
      await screen.findByRole("heading", { name: "Your Analytics" })
    ).toBeInTheDocument();
    expect(screen.getByText("100% Accuracy")).toBeInTheDocument();
    expect(screen.getByText("Engagement Velocity")).toBeInTheDocument();
    expect(screen.getByText("Predicted")).toBeInTheDocument();
    expect(screen.getByText("Actual")).toBeInTheDocument();

    const zeroHeightElements = Array.from(
      container.querySelectorAll<HTMLElement>('[style*="height: 0px"]')
    );

    expect(zeroHeightElements.length).toBeGreaterThan(0);

    const inlineStyles = Array.from(container.querySelectorAll<HTMLElement>("[style]"))
      .map((element) => element.getAttribute("style") ?? "");

    expect(inlineStyles.some((style) => style.includes("NaN"))).toBe(false);
    expect(inlineStyles.some((style) => style.includes("Infinity"))).toBe(false);
  });
});

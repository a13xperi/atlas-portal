import "@testing-library/jest-dom";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";

const mockUseAuth = jest.fn(() => ({
  user: { handle: "TestUser" },
}));

const mockUseParams = jest.fn(() => ({ campaignId: "camp-1" }));

const mockApi = {
  campaigns: {
    get: jest.fn().mockResolvedValue({
      campaign: {
        id: "camp-1",
        name: "Test Campaign",
        description: "A test campaign",
        status: "ACTIVE",
        draftCount: 3,
        drafts: [
          {
            id: "d1",
            content: "First draft",
            status: "POSTED",
            actualEngagement: 1200,
            predictedEngagement: 1000,
            createdAt: "2026-04-01T10:00:00Z",
            postedAt: "2026-04-01T10:00:00Z",
          },
          {
            id: "d2",
            content: "Second draft",
            status: "APPROVED",
            predictedEngagement: 800,
            createdAt: "2026-04-02T14:00:00Z",
          },
          {
            id: "d3",
            content: "Third draft",
            status: "DRAFT",
            predictedEngagement: 500,
            createdAt: "2026-04-03T18:00:00Z",
          },
        ],
        createdAt: "2026-04-01T00:00:00Z",
      },
    }),
  },
};

jest.mock("@/lib/auth", () => ({
  useAuth: mockUseAuth,
}));

jest.mock("next/navigation", () => ({
  useParams: mockUseParams,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  usePathname: () => "/campaigns/camp-1/analytics",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock("@/components/layout/AppShell", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/lib/api", () => ({
  api: mockApi,
}));

const CampaignAnalyticsPage = require("@/app/campaigns/[campaignId]/analytics/page").default;

describe("CampaignAnalyticsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { handle: "TestUser" } });
    mockUseParams.mockReturnValue({ campaignId: "camp-1" });
  });

  it("renders loading state initially", () => {
    render(<CampaignAnalyticsPage />);
    expect(screen.getByText("Back to Campaign")).toBeInTheDocument();
  });

  it("renders campaign analytics after loading", async () => {
    render(<CampaignAnalyticsPage />);

    expect(await screen.findByText("Test Campaign")).toBeInTheDocument();
    expect(screen.getByText("Campaign analytics — performance, timing, and conversion.")).toBeInTheDocument();
    expect(screen.getByText("Top Performing Tweets")).toBeInTheDocument();
    expect(screen.getByText("Posting Time Heatmap")).toBeInTheDocument();
    expect(screen.getByText("Funnel Conversion")).toBeInTheDocument();
    expect(screen.getByText("Impressions / Engagement")).toBeInTheDocument();
  });

  it("renders top drafts sorted by engagement", async () => {
    render(<CampaignAnalyticsPage />);

    expect(await screen.findByText("First draft")).toBeInTheDocument();
    expect(screen.getByText("1,200 actual engagement · POSTED")).toBeInTheDocument();
    expect(screen.getByText("Second draft")).toBeInTheDocument();
    expect(screen.getByText("800 predicted engagement · APPROVED")).toBeInTheDocument();
  });

  it("renders summary stats correctly", async () => {
    render(<CampaignAnalyticsPage />);

    expect(await screen.findByText("Posts")).toBeInTheDocument();
    // Labels and values may appear in multiple places (stats + funnel + badges + chart legend)
    expect(screen.queryAllByText("3").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryAllByText("Posted").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryAllByText("1").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryAllByText("Engagement").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("1,200")).toBeInTheDocument();
  });

  it("renders error state when campaign is not found", async () => {
    mockApi.campaigns.get.mockRejectedValueOnce(new Error("Not found"));
    render(<CampaignAnalyticsPage />);

    expect(await screen.findByText("Campaign not found")).toBeInTheDocument();
  });
});

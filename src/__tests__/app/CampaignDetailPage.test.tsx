import "@testing-library/jest-dom";
import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockPush = jest.fn();
const mockUseAuth = jest.fn(() => ({
  user: { handle: "TestUser" },
}));

const mockApi = {
  campaigns: {
    get: jest.fn().mockResolvedValue({
      campaign: {
        id: "camp-1",
        name: "Test Campaign",
        description: "A test campaign",
        status: "DRAFT",
        draftCount: 1,
        drafts: [
          { id: "draft-1", content: "Draft content", status: "DRAFT", createdAt: new Date().toISOString() },
        ],
        createdAt: new Date().toISOString(),
      },
    }),
    update: jest.fn().mockResolvedValue({ campaign: {} }),
    delete: jest.fn().mockResolvedValue({ success: true }),
    clone: jest.fn().mockResolvedValue({
      campaign: { id: "camp-clone", name: "Test Campaign (Copy)", status: "DRAFT", draftCount: 1, createdAt: new Date().toISOString() },
    }),
  },
};

jest.mock("@/lib/auth", () => ({
  useAuth: mockUseAuth,
}));

jest.mock("@/components/layout/AppShell", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/components/ui/FeatureGate", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock("next/navigation", () => ({
  useParams: () => ({ campaignId: "camp-1" }),
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("@/lib/api", () => ({
  api: mockApi,
}));

const { api } = require("@/lib/api");
const CampaignDetailPageGated = require("@/app/campaigns/[campaignId]/page").default;

const mockedApi = api as typeof mockApi;

describe("CampaignDetailPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { handle: "TestUser" },
    });
  });

  it("renders campaign details", async () => {
    render(<CampaignDetailPageGated />);

    expect(await screen.findByText("Test Campaign")).toBeInTheDocument();
    expect(screen.getByText("A test campaign")).toBeInTheDocument();
    expect(screen.getByText("Draft content")).toBeInTheDocument();
  });

  it("shows the back to campaigns link", async () => {
    render(<CampaignDetailPageGated />);

    expect(await screen.findByText("Test Campaign")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Campaigns" })).toHaveAttribute(
      "href",
      "/campaigns"
    );
  });

  it("shows the Post All Approved button", async () => {
    render(<CampaignDetailPageGated />);

    expect(await screen.findByText("Test Campaign")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Post All Approved" })).toBeInTheDocument();
  });
});

import "@testing-library/jest-dom";
import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockPush = jest.fn();
let mockSearchParams = new URLSearchParams();
const mockUseAuth = jest.fn(() => ({
  user: { handle: "TestUser" },
}));

const mockApi = {
  campaigns: {
    list: jest.fn().mockResolvedValue({ campaigns: [] }),
    create: jest.fn().mockResolvedValue({ campaign: { id: "camp-new", name: "New Campaign", status: "DRAFT", draftCount: 0, createdAt: new Date().toISOString() } }),
    delete: jest.fn().mockResolvedValue({ success: true }),
    clone: jest.fn().mockResolvedValue({ campaign: { id: "camp-clone", name: "Test Campaign (Copy)", status: "DRAFT", draftCount: 0, createdAt: new Date().toISOString() } }),
  },
  drafts: {
    get: jest.fn().mockResolvedValue({ draft: { id: "draft-1", content: "Draft content" } }),
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
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("@/lib/api", () => ({
  api: mockApi,
}));

const { api } = require("@/lib/api");
const CampaignsPage = require("@/app/campaigns/page").default;

const mockedApi = api as typeof mockApi;

describe("CampaignsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    mockUseAuth.mockReturnValue({
      user: { handle: "TestUser" },
    });
  });

  it("renders the campaigns heading", async () => {
    render(<CampaignsPage />);

    expect(
      await screen.findByRole("heading", { name: "Campaigns" })
    ).toBeInTheDocument();

    await waitFor(() => expect(mockedApi.campaigns.list).toHaveBeenCalled());
  });

  it("shows empty state when no campaigns exist", async () => {
    render(<CampaignsPage />);

    expect(
      await screen.findByText(/No campaigns yet/i)
    ).toBeInTheDocument();
  });

  it("renders campaign list and allows cloning", async () => {
    mockedApi.campaigns.list.mockResolvedValueOnce({
      campaigns: [
        { id: "camp-1", name: "Test Campaign", status: "DRAFT", draftCount: 2, createdAt: new Date().toISOString() },
      ],
    });

    render(<CampaignsPage />);

    expect(await screen.findByText("Test Campaign")).toBeInTheDocument();

    const cloneBtn = screen.getByTitle("Clone campaign");
    fireEvent.click(cloneBtn);

    await waitFor(() =>
      expect(mockedApi.campaigns.clone).toHaveBeenCalledWith("camp-1")
    );

    expect(await screen.findByText("Test Campaign (Copy)")).toBeInTheDocument();
  });

  it("allows deleting a campaign", async () => {
    mockedApi.campaigns.list.mockResolvedValueOnce({
      campaigns: [
        { id: "camp-1", name: "Test Campaign", status: "DRAFT", draftCount: 2, createdAt: new Date().toISOString() },
      ],
    });

    render(<CampaignsPage />);

    expect(await screen.findByText("Test Campaign")).toBeInTheDocument();

    const deleteBtn = screen.getByTitle("Delete campaign");
    fireEvent.click(deleteBtn);

    await waitFor(() =>
      expect(mockedApi.campaigns.delete).toHaveBeenCalledWith("camp-1")
    );

    expect(screen.queryByText("Test Campaign")).not.toBeInTheDocument();
  });

  it("allows creating a new campaign", async () => {
    render(<CampaignsPage />);

    const newBtn = await screen.findByRole("button", { name: /New Campaign/i });
    fireEvent.click(newBtn);

    const input = screen.getByPlaceholderText(/Campaign name/i);
    fireEvent.change(input, { target: { value: "My New Campaign" } });

    fireEvent.click(screen.getByRole("button", { name: /Create Campaign$/i }));

    await waitFor(() =>
      expect(mockedApi.campaigns.create).toHaveBeenCalledWith(
        "My New Campaign",
        undefined
      )
    );
  });
});

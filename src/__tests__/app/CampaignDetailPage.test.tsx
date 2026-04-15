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
  useParams: () => ({ id: "camp-1" }),
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("@/lib/api", () => ({
  api: mockApi,
}));

const { api } = require("@/lib/api");
const CampaignDetailPageGated = require("@/app/campaigns/[id]/page").default;

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

  it("allows cloning the campaign and routes to the clone", async () => {
    render(<CampaignDetailPageGated />);

    expect(await screen.findByText("Test Campaign")).toBeInTheDocument();

    const cloneBtn = screen.getByTitle("Clone campaign");
    fireEvent.click(cloneBtn);

    await waitFor(() =>
      expect(mockedApi.campaigns.clone).toHaveBeenCalledWith("camp-1")
    );

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith("/campaigns/camp-clone")
    );
  });

  it("allows deleting the campaign and routes back to list", async () => {
    render(<CampaignDetailPageGated />);

    expect(await screen.findByText("Test Campaign")).toBeInTheDocument();

    const deleteBtn = screen.getByTitle("Delete campaign");
    fireEvent.click(deleteBtn);

    await waitFor(() =>
      expect(mockedApi.campaigns.delete).toHaveBeenCalledWith("camp-1")
    );

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith("/campaigns")
    );
  });

  it("allows editing the campaign name", async () => {
    mockedApi.campaigns.update.mockResolvedValueOnce({
      campaign: {
        id: "camp-1",
        name: "Updated Campaign",
        description: "A test campaign",
        status: "DRAFT",
        draftCount: 1,
        createdAt: new Date().toISOString(),
      },
    });

    render(<CampaignDetailPageGated />);

    expect(await screen.findByText("Test Campaign")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Edit/i }));

    const nameInput = screen.getByDisplayValue("Test Campaign");
    fireEvent.change(nameInput, { target: { value: "Updated Campaign" } });

    fireEvent.click(screen.getByRole("button", { name: /Save/i }));

    await waitFor(() =>
      expect(mockedApi.campaigns.update).toHaveBeenCalledWith("camp-1", {
        name: "Updated Campaign",
        description: "A test campaign",
      })
    );

    expect(await screen.findByText("Updated Campaign")).toBeInTheDocument();
  });
});

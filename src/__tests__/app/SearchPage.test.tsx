import "@testing-library/jest-dom";
import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockUseAuth = jest.fn(() => ({
  user: {
    handle: "TestUser",
    voiceProfile: null,
  },
}));

const mockApi = {
  drafts: {
    list: jest.fn().mockResolvedValue({ drafts: [] }),
  },
  voice: {
    getProfile: jest.fn().mockResolvedValue({ profile: null }),
  },
};

jest.mock("@/lib/auth", () => ({
  useAuth: mockUseAuth,
}));

jest.mock("@/components/layout/AppShell", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
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

const SearchPage = require("@/app/search/page").default;

describe("SearchPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockUseAuth.mockReturnValue({
      user: {
        handle: "TestUser",
        voiceProfile: null,
      },
    });
    mockApi.drafts.list.mockResolvedValue({ drafts: [] });
    mockApi.voice.getProfile.mockResolvedValue({ profile: null });
  });

  it("renders recent searches from localStorage when the input is empty", async () => {
    localStorage.setItem(
      "atlas_recent_searches",
      JSON.stringify(["L2 adoption", "macro setup"])
    );

    render(<SearchPage />);

    expect(await screen.findByText("Recent searches")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "L2 adoption" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "macro setup" })).toBeInTheDocument();
  });

  it("saves a submitted query and shows it once the input is cleared", async () => {
    render(<SearchPage />);

    const searchInput = screen.getByPlaceholderText(
      "Search drafts or voice profiles..."
    );

    fireEvent.change(searchInput, {
      target: { value: "  solana memecoins  " },
    });
    fireEvent.submit(searchInput.closest("form") as HTMLFormElement);

    await waitFor(() => {
      expect(localStorage.getItem("atlas_recent_searches")).toBe(
        JSON.stringify(["solana memecoins"])
      );
    });

    fireEvent.change(searchInput, { target: { value: "" } });

    expect(
      await screen.findByRole("button", { name: "solana memecoins" })
    ).toBeInTheDocument();
  });
});

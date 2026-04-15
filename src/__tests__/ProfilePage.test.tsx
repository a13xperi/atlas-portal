import "@testing-library/jest-dom";
import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockUseAuth = jest.fn();

const mockApi = {
  users: {
    updateProfile: jest.fn(),
  },
};

jest.mock("@/lib/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("@/lib/api", () => ({
  api: mockApi,
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

const ProfilePage = require("@/app/profile/page").default;

describe("ProfilePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: {
        id: "user-1",
        handle: "alice",
        displayName: "Alice Ledger",
        role: "ANALYST",
        avatarUrl: "https://example.com/avatar.png",
      },
      logout: jest.fn(),
      refreshUser: jest.fn(),
    });

    mockApi.users.updateProfile.mockResolvedValue({
      user: {
        id: "user-1",
        handle: "alice",
        displayName: "Alice Alpha",
        role: "ANALYST",
      },
    });
  });

  it("renders the user profile information", async () => {
    render(<ProfilePage />);

    expect(screen.getByRole("img", { name: "Alice Ledger avatar" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Alice Ledger" })).toBeInTheDocument();
    expect(screen.getByText("@alice")).toBeInTheDocument();
    expect(screen.getByText("ANALYST")).toBeInTheDocument();
  });

  it("falls back to initials when no avatar URL is provided", async () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: "user-1",
        handle: "alice",
        displayName: "Alice Ledger",
        role: "ANALYST",
        avatarUrl: null,
      },
      logout: jest.fn(),
      refreshUser: jest.fn(),
    });

    render(<ProfilePage />);

    expect(screen.queryByRole("img", { name: "Alice Ledger avatar" })).not.toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("preserves the display name save flow", async () => {
    render(<ProfilePage />);

    const displayNameInput = screen.getByLabelText("Display name");
    fireEvent.change(displayNameInput, { target: { value: "Alice Alpha" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockApi.users.updateProfile).toHaveBeenCalledWith({
        displayName: "Alice Alpha",
      });
    });
  });

  it("calls logout when the log out button is clicked", async () => {
    const logout = jest.fn();
    mockUseAuth.mockReturnValue({
      user: {
        id: "user-1",
        handle: "alice",
        displayName: "Alice Ledger",
        role: "ANALYST",
        avatarUrl: "https://example.com/avatar.png",
      },
      logout,
      refreshUser: jest.fn(),
    });

    render(<ProfilePage />);

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));
    expect(logout).toHaveBeenCalled();
  });
});

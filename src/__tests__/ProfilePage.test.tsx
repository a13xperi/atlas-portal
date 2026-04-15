import "@testing-library/jest-dom";
import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockUseAuth = jest.fn();

const mockApi = {
  users: {
    updateProfile: jest.fn(),
  },
  voice: {
    getProfile: jest.fn(),
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
        twitterId: "tw-1",
        telegramChatId: null,
        xAvatarUrl: "https://example.com/avatar.png",
      },
      logout: jest.fn(),
    });

    mockApi.users.updateProfile.mockResolvedValue({
      user: {
        id: "user-1",
        handle: "alice",
        displayName: "Alice Ledger",
        role: "ANALYST",
      },
    });
    mockApi.voice.getProfile.mockResolvedValue({
      profile: {
        id: "voice-1",
        userId: "user-1",
        humor: 50,
        formality: 60,
        brevity: 70,
        contrarianTone: 40,
        maturity: "ADVANCED",
        tweetsAnalyzed: 88,
      },
    });
  });

  it("renders zeroed profile stats when the typed stats API is unavailable", async () => {
    render(<ProfilePage />);

    expect(await screen.findByText("Drafts Created")).toBeInTheDocument();
    expect(screen.getByText("Tweets Published")).toBeInTheDocument();
    expect(screen.getByText("Voices Saved")).toBeInTheDocument();
    expect(screen.getByText("Campaigns Active")).toBeInTheDocument();
    expect(screen.getAllByText("0")).toHaveLength(4);

    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(screen.getByText("Not Connected")).toBeInTheDocument();
  });

  it("falls back to initials when the avatar image errors", async () => {
    render(<ProfilePage />);

    const avatar = screen.getByRole("img", { name: "Alice Ledger avatar" });
    fireEvent.error(avatar);

    await waitFor(() => {
      expect(
        screen.getByLabelText("Profile initials"),
      ).toHaveTextContent("AL");
    });

    expect(
      screen.queryByRole("img", { name: "Alice Ledger avatar" }),
    ).not.toBeInTheDocument();
  });

  it("shows the onboarding CTA when no voice profile exists", async () => {
    mockApi.voice.getProfile.mockRejectedValueOnce(new Error("missing"));

    render(<ProfilePage />);

    expect(
      await screen.findByText("You have not calibrated a voice profile yet."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Calibrate your voice/i })).toHaveAttribute(
      "href",
      "/onboarding",
    );
  });

  it("preserves the display name save flow", async () => {
    mockApi.users.updateProfile.mockResolvedValueOnce({
      user: {
        id: "user-1",
        handle: "alice",
        displayName: "Alice Alpha",
        role: "ANALYST",
      },
    });

    render(<ProfilePage />);

    const displayNameInput = screen.getByLabelText("Display Name");
    fireEvent.change(displayNameInput, { target: { value: "Alice Alpha" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(mockApi.users.updateProfile).toHaveBeenCalledWith({
        displayName: "Alice Alpha",
      });
    });

    expect(await screen.findByText("Saved.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Alice Alpha" })).toBeInTheDocument();
  });
});

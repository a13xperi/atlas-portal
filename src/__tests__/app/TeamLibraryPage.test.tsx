import "@testing-library/jest-dom";
import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";

const mockUseAuth = jest.fn();
const mockTeam = jest.fn();
const mockList = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/team-library",
}));

jest.mock("@/lib/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("@/components/layout/AppShell", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/lib/api", () => ({
  api: {
    drafts: {
      team: (...args: unknown[]) => mockTeam(...args),
      list: (...args: unknown[]) => mockList(...args),
    },
  },
}));

const TeamLibraryPage = require("@/app/team-library/page").default;

describe("TeamLibraryPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: { id: "u1", handle: "testuser", role: "ANALYST" },
      token: "mock-token",
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      loading: false,
    });

    mockTeam.mockResolvedValue({
      drafts: [
        {
          id: "d1",
          content: "Bitcoin is showing strong support at 65k",
          version: 1,
          status: "APPROVED",
          confidence: 0.85,
          actualEngagement: 120,
          createdAt: "2026-04-01T12:00:00Z",
          blendName: "Research Mode",
          user: { handle: "alice", displayName: "Alice", avatarUrl: null },
        },
      ],
      total: 1,
    });

    mockList.mockResolvedValue({
      drafts: [
        {
          id: "d1",
          content: "Bitcoin is showing strong support at 65k",
          version: 1,
          status: "APPROVED",
          confidence: 0.85,
          actualEngagement: 120,
          createdAt: "2026-04-01T12:00:00Z",
        },
      ],
    });
  });

  it("renders library items", async () => {
    render(<TeamLibraryPage />);

    await waitFor(() => {
      expect(screen.getByText(/bitcoin/i)).toBeInTheDocument();
    });
  });

  it("shows author info", async () => {
    render(<TeamLibraryPage />);

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    expect(screen.getByText("@alice")).toBeInTheDocument();
  });
});

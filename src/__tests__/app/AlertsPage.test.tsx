import "@testing-library/jest-dom";
import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import AlertsPage from "@/app/alerts/page";

const mockUseAuth = jest.fn(() => ({
  user: { handle: "analyst", role: "ANALYST" },
}));

jest.mock("@/lib/auth", () => ({
  useAuth: mockUseAuth,
}));

jest.mock("@/components/layout/AppShell", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe("AlertsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { handle: "analyst", role: "ANALYST" },
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ alerts: [] }),
    }) as jest.Mock;
  });

  it("shows the clean empty state when there are no alerts", async () => {
    render(<AlertsPage />);

    expect(await screen.findByText("No alerts yet")).toBeInTheDocument();
    expect(
      screen.getByText(
        "When trending topics or market movements match your interests, alerts will appear here."
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /enable subscriptions/i })
    ).not.toBeInTheDocument();
  });

  it("renders alerts from the feed with inline draft actions", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        alerts: [
          {
            id: "alert-1",
            type: "WHALE_ACTIVITY",
            title: "Whale moved a large ETH position",
            context: "Exchange-bound flows ticked higher over the last 15 minutes.",
            createdAt: "2026-04-03T10:00:00.000Z",
          },
        ],
      }),
    });

    render(<AlertsPage />);

    expect(
      await screen.findByText("Whale moved a large ETH position")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Draft Post" })).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.queryByText("No alerts yet")).not.toBeInTheDocument()
    );
  });

  it("hides manager nudges for non-manager users", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        alerts: [
          {
            id: "alert-1",
            type: "WHALE_ACTIVITY",
            title: "Whale moved a large ETH position",
            context: "Exchange-bound flows ticked higher over the last 15 minutes.",
            createdAt: "2026-04-03T10:00:00.000Z",
          },
          {
            id: "alert-2",
            type: "TEAM_NUDGE",
            title: "Send a nudge to inactive analysts",
            context: "Three analysts have not drafted this week.",
            createdAt: "2026-04-03T11:00:00.000Z",
          },
        ],
      }),
    });

    render(<AlertsPage />);

    expect(
      await screen.findByText("Whale moved a large ETH position")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Send a nudge to inactive analysts")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Team Nudges")).not.toBeInTheDocument();
  });

  it("separates team nudges for manager users", async () => {
    mockUseAuth.mockReturnValue({
      user: { handle: "manager", role: "MANAGER" },
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        alerts: [
          {
            id: "alert-1",
            type: "WHALE_ACTIVITY",
            title: "Whale moved a large ETH position",
            context: "Exchange-bound flows ticked higher over the last 15 minutes.",
            createdAt: "2026-04-03T10:00:00.000Z",
          },
          {
            id: "alert-2",
            type: "TEAM_NUDGE",
            title: "Send a nudge to inactive analysts",
            context: "Three analysts have not drafted this week.",
            createdAt: "2026-04-03T11:00:00.000Z",
          },
        ],
      }),
    });

    render(<AlertsPage />);

    expect(
      await screen.findByText("Whale moved a large ETH position")
    ).toBeInTheDocument();
    expect(screen.getByText("Team Nudges")).toBeInTheDocument();
    expect(
      screen.getByText("Send a nudge to inactive analysts")
    ).toBeInTheDocument();
  });
});

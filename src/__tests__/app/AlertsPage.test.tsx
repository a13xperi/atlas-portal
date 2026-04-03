import "@testing-library/jest-dom";
import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import AlertsPage from "@/app/alerts/page";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => "/alerts"),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

jest.mock("@/lib/auth", () => ({
  useAuth: jest.fn(() => ({
    user: { handle: "analyst", role: "ANALYST" },
  })),
}));

jest.mock("@/components/layout/AppShell", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const mockUseRouter = jest.mocked(useRouter);

describe("AlertsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    } as unknown as ReturnType<typeof useRouter>);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ alerts: [] }),
    }) as jest.Mock;
  });

  it("shows the clean empty state when there are no alerts", async () => {
    render(<AlertsPage />);

    expect(await screen.findByText("No signals yet")).toBeInTheDocument();
    expect(screen.getByText("Signals Feed")).toBeInTheDocument();
    expect(
      screen.getByText(
        /configure your subscriptions to start receiving signals/i
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /enable subscriptions/i })
    ).toBeInTheDocument();
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
    expect((global.fetch as jest.Mock).mock.calls[0]?.[0]).toContain(
      "/api/alerts/feed?category=SIGNAL"
    );

    await waitFor(() =>
      expect(screen.queryByText("No signals yet")).not.toBeInTheDocument()
    );
  });

  it("requests the signal-only feed", async () => {
    render(<AlertsPage />);

    await waitFor(() =>
      expect((global.fetch as jest.Mock).mock.calls[0]?.[0]).toContain(
        "/api/alerts/feed?category=SIGNAL"
      )
    );
  });
});

import "@testing-library/jest-dom";
import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import AlertsPage from "@/app/alerts/page";

const mockPush = jest.fn();

function createMockResponse(body: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue(body),
  });
}

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
    global.fetch = jest.fn((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/alerts/subscriptions")) {
        return createMockResponse({ subscriptions: [] });
      }

      if (url.includes("/api/alerts/feed?category=SIGNAL")) {
        return createMockResponse({ alerts: [] });
      }

      return createMockResponse({});
    }) as jest.Mock;
  });

  it("shows the clean empty state when there are no alerts", async () => {
    render(<AlertsPage />);

    expect(await screen.findByText("No signals yet")).toBeInTheDocument();
    expect(screen.getByText("Signals Feed")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Set up your subscriptions and Atlas will surface signals worth drafting on/i
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /enable subscriptions/i })
    ).toBeInTheDocument();
  });

  it("renders alerts from the feed with inline draft actions", async () => {
    (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/alerts/subscriptions")) {
        return createMockResponse({ subscriptions: [] });
      }

      if (url.includes("/api/alerts/feed?category=SIGNAL")) {
        return createMockResponse({
          alerts: [
            {
              id: "alert-1",
              type: "WHALE_ACTIVITY",
              title: "Whale moved a large ETH position",
              context: "Exchange-bound flows ticked higher over the last 15 minutes.",
              createdAt: "2026-04-03T10:00:00.000Z",
            },
          ],
        });
      }

      return createMockResponse({});
    });

    render(<AlertsPage />);

    expect(
      await screen.findByText("Whale moved a large ETH position")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Draft Post" })).toBeInTheDocument();
    expect(
      (global.fetch as jest.Mock).mock.calls.some(([url]) =>
        String(url).includes("/api/alerts/feed?category=SIGNAL")
      )
    ).toBe(true);

    await waitFor(() =>
      expect(screen.queryByText("No signals yet")).not.toBeInTheDocument()
    );
  });

  it("conducts inline research for an alert without leaving the feed", async () => {
    (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/alerts/subscriptions")) {
        return createMockResponse({ subscriptions: [] });
      }

      if (url.includes("/api/alerts/feed?category=SIGNAL")) {
        return createMockResponse({
          alerts: [
            {
              id: "alert-1",
              type: "WHALE_ACTIVITY",
              title: "Whale moved a large ETH position",
              context: "Exchange-bound flows ticked higher over the last 15 minutes.",
              createdAt: "2026-04-03T10:00:00.000Z",
            },
          ],
        });
      }

      if (url.includes("/api/research")) {
        return createMockResponse({
          result: {
            id: "research-1",
            query: "Whale moved a large ETH position",
            summary: "Large holders are rotating ETH to exchanges, which can precede near-term selling pressure.",
          },
        });
      }

      return createMockResponse({});
    });

    render(<AlertsPage />);

    fireEvent.click(await screen.findByRole("button", { name: "Research" }));

    expect(await screen.findByText("Research Summary")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Large holders are rotating ETH to exchanges, which can precede near-term selling pressure."
      )
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(
        (global.fetch as jest.Mock).mock.calls.some(([url]) =>
          String(url).includes("/api/research")
        )
      ).toBe(true)
    );
  });

  it("requests the signal-only feed", async () => {
    render(<AlertsPage />);

    await waitFor(() =>
      expect(
        (global.fetch as jest.Mock).mock.calls.some(([url]) =>
          String(url).includes("/api/alerts/feed?category=SIGNAL")
        )
      ).toBe(true)
    );
  });

  it("shows subscription details when the subscriptions panel is expanded", async () => {
    (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/alerts/subscriptions")) {
        return createMockResponse({
          subscriptions: [
            {
              id: "sub-1",
              type: "topic",
              value: "Bitcoin ETF flows",
              isActive: true,
              delivery: ["IN_APP"],
            },
            {
              id: "sub-2",
              type: "token",
              value: "ETH",
              isActive: false,
              delivery: ["IN_APP"],
            },
          ],
        });
      }

      if (url.includes("/api/alerts/feed?category=SIGNAL")) {
        return createMockResponse({ alerts: [] });
      }

      return createMockResponse({});
    });

    render(<AlertsPage />);

    const subscriptionsButton = await screen.findByRole("button", {
      name: /monitors \(1\)|subscriptions \(1\)/i,
    });

    fireEvent.click(subscriptionsButton);

    // MonitorBuilder renders when panel is open — check it appears
    await waitFor(() => {
      // The panel should be visible (any content from MonitorBuilder)
      expect(subscriptionsButton).toBeInTheDocument();
    });
    expect(screen.getByText("ETH")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Paused")).toBeInTheDocument();
  });

  describe("advanced controls gating", () => {
    const originalEnv = process.env.NEXT_PUBLIC_ALERTS_ADVANCED;

    afterEach(() => {
      process.env.NEXT_PUBLIC_ALERTS_ADVANCED = originalEnv;
    });

    it("renders the gated placeholder when NEXT_PUBLIC_ALERTS_ADVANCED is absent", async () => {
      delete process.env.NEXT_PUBLIC_ALERTS_ADVANCED;
      render(<AlertsPage />);

      expect(
        await screen.findByTestId("alerts-advanced-gated")
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Auto-fire" })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Subscribe" })
      ).not.toBeInTheDocument();
    });

    it("renders Auto-fire and Subscribe buttons when NEXT_PUBLIC_ALERTS_ADVANCED is true", async () => {
      process.env.NEXT_PUBLIC_ALERTS_ADVANCED = "true";
      render(<AlertsPage />);

      expect(
        await screen.findByRole("button", { name: "Auto-fire" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Subscribe" })
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId("alerts-advanced-gated")
      ).not.toBeInTheDocument();
    });
  });
});

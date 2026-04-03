import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AlertsPage from "@/app/alerts/page";

const push = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
  }),
}));

jest.mock("@/components/layout/AppShell", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("AlertsPage", () => {
  beforeEach(() => {
    push.mockClear();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ alerts: [] }),
    }) as jest.Mock;
  });

  it("shows the empty state and routes the CTA to subscription setup", async () => {
    render(<AlertsPage />);

    expect(
      await screen.findByText(
        "No alerts yet — configure your subscriptions to start receiving signals."
      )
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Enable Subscriptions" })
    );

    expect(push).toHaveBeenCalledWith("/telegram");
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
      expect(screen.queryByText(/No alerts yet/)).not.toBeInTheDocument()
    );
  });
});

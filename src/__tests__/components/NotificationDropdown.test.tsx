import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor, act } from "@testing-library/react";
import NotificationDropdown from "@/components/ui/NotificationDropdown";
import type { Alert } from "@/lib/api";

// ---- Mocks ----

const mockClearUnread = jest.fn();

jest.mock("@/lib/alertSocket", () => ({
  useAlertSocket: () => ({ clearUnread: mockClearUnread }),
}));

const mockFeed = jest.fn();

jest.mock("@/lib/api", () => ({
  api: {
    alerts: {
      feed: (...args: unknown[]) => mockFeed(...args),
    },
  },
}));

// ---- Helpers ----

function makeAlert(overrides: Partial<Alert> = {}): Alert {
  return {
    id: "alert-1",
    type: "mention",
    title: "Someone mentioned you",
    context: "in a thread about ETH",
    createdAt: new Date(Date.now() - 30 * 60_000).toISOString(), // 30m ago
    ...overrides,
  };
}

const noop = () => {};

// ---- Tests ----

describe("NotificationDropdown", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFeed.mockResolvedValue({ alerts: [] });
  });

  // --- Render / visibility ---

  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <NotificationDropdown isOpen={false} onClose={noop} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders the dropdown when isOpen is true", async () => {
    render(<NotificationDropdown isOpen={true} onClose={noop} />);
    expect(
      await screen.findByRole("dialog", { name: /notifications/i }),
    ).toBeInTheDocument();
  });

  it("displays the Notifications heading", async () => {
    render(<NotificationDropdown isOpen={true} onClose={noop} />);
    expect(await screen.findByText("Notifications")).toBeInTheDocument();
  });

  // --- Loading state ---

  it("shows a loading indicator while fetching", async () => {
    // Never resolve so we stay in loading state
    mockFeed.mockReturnValue(new Promise(() => {}));

    render(<NotificationDropdown isOpen={true} onClose={noop} />);
    expect(await screen.findByRole("status")).toHaveTextContent("Loading");
  });

  // --- Empty state ---

  it('shows "All caught up" when there are no notifications', async () => {
    mockFeed.mockResolvedValue({ alerts: [] });

    render(<NotificationDropdown isOpen={true} onClose={noop} />);
    expect(await screen.findByText("All caught up")).toBeInTheDocument();
  });

  // --- Populated list ---

  it("renders notification items from the API", async () => {
    mockFeed.mockResolvedValue({
      alerts: [
        makeAlert({ id: "a1", title: "Price alert triggered" }),
        makeAlert({ id: "a2", title: "New follower" }),
      ],
    });

    render(<NotificationDropdown isOpen={true} onClose={noop} />);

    expect(await screen.findByText("Price alert triggered")).toBeInTheDocument();
    expect(screen.getByText("New follower")).toBeInTheDocument();
  });

  it("displays the notification type badge", async () => {
    mockFeed.mockResolvedValue({
      alerts: [makeAlert({ type: "signal" })],
    });

    render(<NotificationDropdown isOpen={true} onClose={noop} />);
    expect(await screen.findByText("signal")).toBeInTheDocument();
  });

  it("renders the context when present", async () => {
    mockFeed.mockResolvedValue({
      alerts: [makeAlert({ context: "Deep-dive on L2 rollups" })],
    });

    render(<NotificationDropdown isOpen={true} onClose={noop} />);
    expect(
      await screen.findByText("Deep-dive on L2 rollups"),
    ).toBeInTheDocument();
  });

  it("omits context paragraph when context is absent", async () => {
    mockFeed.mockResolvedValue({
      alerts: [makeAlert({ context: undefined })],
    });

    render(<NotificationDropdown isOpen={true} onClose={noop} />);
    await screen.findByText("Someone mentioned you");
    // Only the title and type badge text nodes — no context paragraph
    const dialog = screen.getByRole("dialog");
    expect(dialog.querySelectorAll("p.line-clamp-2")).toHaveLength(0);
  });

  // --- Relative time formatting ---

  it("formats time as minutes for < 1 hour", async () => {
    mockFeed.mockResolvedValue({
      alerts: [
        makeAlert({ createdAt: new Date(Date.now() - 5 * 60_000).toISOString() }),
      ],
    });

    render(<NotificationDropdown isOpen={true} onClose={noop} />);
    expect(await screen.findByText("5m ago")).toBeInTheDocument();
  });

  it("formats time as hours for < 24 hours", async () => {
    mockFeed.mockResolvedValue({
      alerts: [
        makeAlert({
          createdAt: new Date(Date.now() - 3 * 60 * 60_000).toISOString(),
        }),
      ],
    });

    render(<NotificationDropdown isOpen={true} onClose={noop} />);
    expect(await screen.findByText("3h ago")).toBeInTheDocument();
  });

  it("formats time as days for >= 24 hours", async () => {
    mockFeed.mockResolvedValue({
      alerts: [
        makeAlert({
          createdAt: new Date(Date.now() - 48 * 60 * 60_000).toISOString(),
        }),
      ],
    });

    render(<NotificationDropdown isOpen={true} onClose={noop} />);
    expect(await screen.findByText("2d ago")).toBeInTheDocument();
  });

  // --- clearUnread on open ---

  it("calls clearUnread when opened", async () => {
    render(<NotificationDropdown isOpen={true} onClose={noop} />);
    await waitFor(() => expect(mockClearUnread).toHaveBeenCalledTimes(1));
  });

  it("calls api.alerts.feed when opened", async () => {
    render(<NotificationDropdown isOpen={true} onClose={noop} />);
    await waitFor(() => expect(mockFeed).toHaveBeenCalledTimes(1));
  });

  // --- Close interactions ---

  it("calls onClose when the close button is clicked", async () => {
    const onClose = jest.fn();
    render(<NotificationDropdown isOpen={true} onClose={onClose} />);

    const closeBtn = await screen.findByRole("button", {
      name: /close notifications/i,
    });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose on Escape keydown", async () => {
    const onClose = jest.fn();
    render(<NotificationDropdown isOpen={true} onClose={onClose} />);

    await screen.findByRole("dialog");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when clicking outside the dropdown", async () => {
    const onClose = jest.fn();
    render(
      <div>
        <div data-testid="outside">outside</div>
        <NotificationDropdown isOpen={true} onClose={onClose} />
      </div>,
    );

    await screen.findByRole("dialog");
    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does NOT call onClose when clicking inside the dropdown", async () => {
    const onClose = jest.fn();
    render(<NotificationDropdown isOpen={true} onClose={onClose} />);

    const dialog = await screen.findByRole("dialog");
    fireEvent.mouseDown(dialog);
    expect(onClose).not.toHaveBeenCalled();
  });

  // --- Error handling ---

  it("shows empty state when API call fails", async () => {
    mockFeed.mockRejectedValue(new Error("Network error"));

    render(<NotificationDropdown isOpen={true} onClose={noop} />);
    expect(await screen.findByText("All caught up")).toBeInTheDocument();
  });

  // --- Re-open fetches again ---

  it("fetches again when re-opened", async () => {
    const { rerender } = render(
      <NotificationDropdown isOpen={true} onClose={noop} />,
    );

    await waitFor(() => expect(mockFeed).toHaveBeenCalledTimes(1));

    rerender(<NotificationDropdown isOpen={false} onClose={noop} />);
    rerender(<NotificationDropdown isOpen={true} onClose={noop} />);

    await waitFor(() => expect(mockFeed).toHaveBeenCalledTimes(2));
  });
});

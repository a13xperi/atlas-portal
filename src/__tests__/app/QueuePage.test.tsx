import "@testing-library/jest-dom";
import type { ReactNode } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockApi = {
  drafts: {
    list: jest.fn().mockResolvedValue({ drafts: [] }),
    update: jest.fn().mockResolvedValue({}),
  },
  queue: {
    smartRank: jest.fn().mockResolvedValue({ drafts: [] }),
  },
};

jest.mock("@/components/layout/AppShell", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/components/ui/FeatureGate", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

jest.mock("@/lib/api", () => ({
  api: mockApi,
}));

const { api } = require("@/lib/api");
const QueuePage = require("@/app/queue/page").default;
const mockedApi = api as typeof mockApi;

const mockDrafts = [
  {
    id: "d1",
    content: "Bitcoin is looking bullish today #btc",
    status: "APPROVED",
    predictedEngagement: 0.45,
    scheduledAt: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "d2",
    content: "Ethereum analysis thread 🧵",
    status: "APPROVED",
    predictedEngagement: 0.6,
    scheduledAt: null,
    createdAt: new Date().toISOString(),
  },
];

describe("QueuePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApi.drafts.list.mockResolvedValue({ drafts: mockDrafts });
  });

  it("renders approved drafts", async () => {
    render(<QueuePage />);
    await waitFor(() => {
      expect(screen.getByText(/Bitcoin is looking bullish/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Ethereum analysis thread/i)).toBeInTheDocument();
  });

  it("shows Smart Order button", async () => {
    render(<QueuePage />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Smart Order/i })).toBeInTheDocument();
    });
  });

  it("calls smartRank and shows optimal time badges when Smart Order is clicked", async () => {
    mockedApi.queue.smartRank.mockResolvedValue({
      drafts: [
        { ...mockDrafts[1], optimalTime: "2025-01-15T08:00:00.000Z", optimalTimeBadge: "Wed, 8:00 AM" },
        { ...mockDrafts[0], optimalTime: "2025-01-15T10:00:00.000Z", optimalTimeBadge: "Wed, 10:00 AM" },
      ],
    });

    render(<QueuePage />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Smart Order/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Smart Order/i }));

    await waitFor(() => {
      expect(mockedApi.queue.smartRank).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: "d1" }),
          expect.objectContaining({ id: "d2" }),
        ])
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/Optimal: Wed, 8:00 AM/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Optimal: Wed, 10:00 AM/i)).toBeInTheDocument();
  });

  it("disables Smart Order button while ranking", async () => {
    let resolveSmartRank: (value: unknown) => void;
    mockedApi.queue.smartRank.mockImplementation(
      () => new Promise((resolve) => { resolveSmartRank = resolve; })
    );

    render(<QueuePage />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Smart Order/i })).toBeInTheDocument();
    });

    const btn = screen.getByRole("button", { name: /Smart Order/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Ranking.../i })).toBeDisabled();
    });

    resolveSmartRank!({ drafts: [] });
  });
});

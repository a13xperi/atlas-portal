import "@testing-library/jest-dom";
import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockPush = jest.fn();
const mockUseAuth = jest.fn(() => ({
  user: { handle: "TestUser" },
}));

const mockApi = {
  auth: {
    register: jest.fn().mockResolvedValue({}),
    login: jest.fn().mockResolvedValue({}),
    refresh: jest.fn().mockResolvedValue({}),
    logout: jest.fn().mockResolvedValue({}),
    me: jest.fn().mockResolvedValue({}),
  },
  voice: {
    getProfile: jest.fn().mockResolvedValue({}),
    updateProfile: jest.fn().mockResolvedValue({}),
    getReferences: jest.fn().mockResolvedValue({ voices: [] }),
    addReference: jest.fn().mockResolvedValue({}),
    getBlends: jest.fn().mockResolvedValue({ blends: [] }),
    createBlend: jest.fn().mockResolvedValue({}),
    calibrate: jest.fn().mockResolvedValue({}),
  },
  drafts: {
    list: jest.fn().mockResolvedValue({ drafts: [] }),
    get: jest.fn().mockResolvedValue({}),
    create: jest.fn().mockResolvedValue({}),
    generate: jest.fn().mockResolvedValue({}),
    regenerate: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
    refine: jest.fn().mockResolvedValue({}),
    team: jest.fn().mockResolvedValue({ drafts: [], total: 0 }),
  },
  analytics: {
    summary: jest.fn().mockResolvedValue({ summary: null }),
    learningLog: jest.fn().mockResolvedValue({ entries: [] }),
    engagement: jest.fn().mockResolvedValue({ events: [] }),
    engagementDaily: jest.fn().mockResolvedValue({ days: [] }),
    activityDaily: jest.fn().mockResolvedValue({ days: [] }),
    teamEngagementDaily: jest.fn().mockResolvedValue({ days: [] }),
    team: jest.fn().mockResolvedValue({ analysts: [] }),
    daysToPeak: jest.fn().mockResolvedValue({ peaks: [] }),
  },
  alerts: {
    feed: jest.fn().mockResolvedValue({ alerts: [] }),
    subscriptions: jest.fn().mockResolvedValue({ subscriptions: [] }),
    subscribe: jest.fn().mockResolvedValue({}),
  },
  images: {
    generate: jest.fn().mockResolvedValue({}),
    generateForDraft: jest.fn().mockResolvedValue({}),
    forDraft: jest.fn().mockResolvedValue({ images: [] }),
  },
  trending: {
    scan: jest.fn().mockResolvedValue({ alerts: [] }),
    topics: jest.fn().mockResolvedValue({ topics: [] }),
  },
  research: {
    conduct: jest.fn().mockResolvedValue({}),
    history: jest.fn().mockResolvedValue({ results: [] }),
  },
  loop: {
    state: jest.fn().mockResolvedValue({
      loop: {
        taskId: "",
        status: "idle",
        currentIteration: 0,
        maxIterations: 0,
        iterations: [],
        bestIteration: null,
        evalType: "",
        startedAt: null,
        completedAt: null,
      },
    }),
    createPR: jest.fn().mockResolvedValue({ prUrl: "" }),
  },
  users: {
    profile: jest.fn().mockResolvedValue({}),
    updateProfile: jest.fn().mockResolvedValue({}),
    team: jest.fn().mockResolvedValue({ team: [] }),
    pushTopProfiles: jest.fn().mockResolvedValue({}),
    sendNudge: jest.fn().mockResolvedValue({}),
    pushStyle: jest.fn().mockResolvedValue({}),
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

jest.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("@/lib/api", () => ({
  api: mockApi,
}));

const { api } = require("@/lib/api");
const DashboardPage = require("@/app/dashboard/page").default;

const mockedApi = api as typeof mockApi;

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

describe("DashboardPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { handle: "TestUser" },
    });
  });

  it("renders the dashboard heading", async () => {
    render(<DashboardPage />);

    expect(
      await screen.findByRole("heading", { name: "Welcome back, TestUser" })
    ).toBeInTheDocument();

    await waitFor(() => expect(mockedApi.analytics.summary).toHaveBeenCalled());
  });

  it("shows loading state initially", async () => {
    const summaryDeferred = createDeferred<{ summary: null }>();
    const draftsDeferred = createDeferred<{ drafts: [] }>();

    mockedApi.analytics.summary.mockImplementationOnce(() => summaryDeferred.promise);
    mockedApi.drafts.list.mockImplementationOnce(() => draftsDeferred.promise);

    const { container } = render(<DashboardPage />);

    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
    expect(screen.queryByText("Drafts this week")).not.toBeInTheDocument();

    summaryDeferred.resolve({ summary: null });
    draftsDeferred.resolve({ drafts: [] });

    await waitFor(() =>
      expect(screen.getByText("Drafts this week")).toBeInTheDocument()
    );
  });

  it("displays stats cards after data loads", async () => {
    render(<DashboardPage />);

    expect(await screen.findByText("Drafts this week")).toBeInTheDocument();
    expect(screen.getByText("Posts")).toBeInTheDocument();
    expect(screen.getByText("Feedback given")).toBeInTheDocument();
    expect(screen.getByText("Reports ingested")).toBeInTheDocument();
  });

  it("falls back gracefully and shows a dismissible warning when an API call fails", async () => {
    mockedApi.analytics.summary.mockRejectedValueOnce(new Error("Summary request failed"));

    render(<DashboardPage />);

    expect(await screen.findByText("Drafts this week")).toBeInTheDocument();
    expect(
      screen.getByText("Some dashboard data is temporarily unavailable.")
    ).toBeInTheDocument();
    expect(screen.queryByText("Summary request failed")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "✕" }));

    expect(
      screen.queryByText("Some dashboard data is temporarily unavailable.")
    ).not.toBeInTheDocument();
  });
});

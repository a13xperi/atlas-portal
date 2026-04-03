import "@testing-library/jest-dom";
import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";

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
  usePathname: () => "/search",
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("@/lib/api", () => ({
  api: mockApi,
}));

const { api } = require("@/lib/api");
const SearchPage = require("@/app/search/page").default;

const mockedApi = api as typeof mockApi;

describe("SearchPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { handle: "TestUser" },
    });
  });

  it("renders search input", async () => {
    render(<SearchPage />);

    expect(
      screen.getByPlaceholderText(
        "Search drafts, alerts, or enter a research topic..."
      )
    ).toBeInTheDocument();

    await waitFor(() => expect(mockedApi.trending.topics).toHaveBeenCalled());
  });

  it("renders the search page container", async () => {
    const { container } = render(<SearchPage />);

    expect(container.querySelector("div.max-w-3xl.mx-auto.py-8")).toBeInTheDocument();

    await waitFor(() => expect(mockedApi.trending.topics).toHaveBeenCalled());
  });
});

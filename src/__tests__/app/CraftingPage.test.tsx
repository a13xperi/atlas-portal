import "@testing-library/jest-dom";
import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ToastProvider } from "@/components/ui/Toast";

let mockSearchParams = new URLSearchParams();
const mockSearchParamListeners = new Set<() => void>();
const mockRouterReplace = jest.fn((href: string) => {
  const query = href.split("?")[1] ?? "";
  mockSearchParams = new URLSearchParams(query);
  mockSearchParamListeners.forEach((listener) => listener());
});

const mockUseAuth = jest.fn();

jest.mock("@/lib/auth", () => ({
  useAuth: () => mockUseAuth(),
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

jest.mock("next/navigation", () => {
  const React = require("react");

  return {
    useSearchParams: () =>
      React.useSyncExternalStore(
        (listener: () => void) => {
          mockSearchParamListeners.add(listener);

          return () => {
            mockSearchParamListeners.delete(listener);
          };
        },
        () => mockSearchParams,
        () => mockSearchParams
      ),
    useRouter: () => ({
      push: jest.fn(),
      replace: mockRouterReplace,
      back: jest.fn(),
    }),
    usePathname: () => "/crafting",
  };
});

jest.mock("@/lib/api", () => ({
  api: {
    auth: {
      x: {
        status: jest.fn(),
        authorize: jest.fn(),
      },
    },
    drafts: {
      list: jest.fn(),
      generate: jest.fn(),
      update: jest.fn(),
      regenerate: jest.fn(),
      delete: jest.fn(),
      refine: jest.fn(),
      schedule: jest.fn(),
      postToX: jest.fn(),
      enqueue: jest.fn(),
    },
    analytics: {
      summary: jest.fn(),
    },
    voice: {
      getBlends: jest.fn(),
    },
    trending: {
      topics: jest.fn(),
    },
    images: {
      generateForDraft: jest.fn(),
    },
  },
}));

const { api } = require("@/lib/api");
const CraftingPage = require("@/app/crafting/page").default;

const mockedApi = api as unknown as {
  auth: {
    x: {
      status: jest.Mock;
      authorize: jest.Mock;
    };
  };
  drafts: {
    list: jest.Mock;
    generate: jest.Mock;
    update: jest.Mock;
    regenerate: jest.Mock;
    delete: jest.Mock;
    refine: jest.Mock;
    schedule: jest.Mock;
    postToX: jest.Mock;
    enqueue: jest.Mock;
  };
  analytics: {
    summary: jest.Mock;
  };
  voice: {
    getBlends: jest.Mock;
  };
  trending: {
    topics: jest.Mock;
  };
  images: {
    generateForDraft: jest.Mock;
  };
};

function createDraft(overrides: Record<string, unknown> = {}) {
  return {
    id: "draft-1",
    content: "Fresh draft copy",
    version: 1,
    status: "DRAFT",
    createdAt: "2026-04-03T10:00:00.000Z",
    ...overrides,
  };
}

function renderWithToast(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe("CraftingPage", () => {
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error> | undefined;

  beforeEach(() => {
    consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    mockSearchParams = new URLSearchParams();
    mockRouterReplace.mockClear();

    mockUseAuth.mockReturnValue({
      user: { handle: "AtlasAnalyst", onboardingTrack: "TRACK_B", voiceProfile: { tweetsAnalyzed: 20 } },
    });

    mockedApi.drafts.list.mockReset();
    mockedApi.drafts.generate.mockReset();
    mockedApi.drafts.update.mockReset();
    mockedApi.drafts.regenerate.mockReset();
    mockedApi.drafts.delete.mockReset();
    mockedApi.drafts.refine.mockReset();
    mockedApi.drafts.schedule.mockReset();
    mockedApi.drafts.postToX.mockReset();
    mockedApi.drafts.enqueue.mockReset();
    mockedApi.auth.x.status.mockReset();
    mockedApi.auth.x.authorize.mockReset();
    mockedApi.analytics.summary.mockReset();
    mockedApi.voice.getBlends.mockReset();
    mockedApi.trending.topics.mockReset();
    mockedApi.images.generateForDraft.mockReset();

    mockedApi.drafts.list.mockResolvedValue({ drafts: [] });
    mockedApi.auth.x.status.mockRejectedValue(new Error("X unavailable"));
    mockedApi.auth.x.authorize.mockResolvedValue({ url: "https://example.com/auth" });
    mockedApi.analytics.summary.mockResolvedValue({ summary: null });
    mockedApi.voice.getBlends.mockResolvedValue({ blends: [] });
    mockedApi.trending.topics.mockResolvedValue({ topics: [] });
    mockedApi.images.generateForDraft.mockResolvedValue({ image: null });
  });

  afterEach(() => {
    consoleErrorSpy?.mockRestore();
    consoleErrorSpy = undefined;
  });

  it("shows inline errors when trying to submit empty content", async () => {
    renderWithToast(<CraftingPage />);

    fireEvent.keyDown(screen.getByPlaceholderText("Paste a tweet idea or link…"), {
      key: "Enter",
      code: "Enter",
      charCode: 13,
    });

    expect(await screen.findByText("Content is required.")).toBeInTheDocument();
    expect(
      screen.getByText("Select at least one source before generating.")
    ).toBeInTheDocument();
    expect(mockedApi.drafts.generate).not.toHaveBeenCalled();
  });

  it("shows the keyboard shortcut hint and generates on cmd-enter", async () => {
    const generatedDraft = createDraft();

    mockedApi.drafts.generate.mockResolvedValue({ draft: generatedDraft });

    renderWithToast(<CraftingPage />);

    fireEvent.change(screen.getByPlaceholderText("Paste a tweet idea or link…"), {
      target: { value: "Fresh BTC momentum read" },
    });
    fireEvent.keyDown(document, { key: "Enter", metaKey: true });

    await waitFor(() =>
      expect(mockedApi.drafts.generate).toHaveBeenCalledWith({
        sourceContent: "Fresh BTC momentum read",
        sourceType: "MANUAL",
        blendWith: undefined,
        replyAngle: undefined,
      })
    );

    expect(screen.getByText("⌘↩ to generate")).toBeInTheDocument();
  });

  it("compares two voice variants side by side and lets the user pick the winner", async () => {
    const currentDraft = createDraft({
      id: "draft-current",
      content: "BTC looks ready to reclaim range highs with steady bid support.",
    });
    const variantDraft = createDraft({
      id: "draft-variant",
      content: "BTC looks ready to rip back through range highs if this bid keeps showing up.",
    });

    mockedApi.drafts.generate
      .mockResolvedValueOnce({ draft: currentDraft })
      .mockResolvedValueOnce({ draft: variantDraft });

    renderWithToast(<CraftingPage />);

    fireEvent.change(screen.getByPlaceholderText("Paste a tweet idea or link…"), {
      target: { value: "Fresh BTC momentum read" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Compare Voices" }));

    await waitFor(() => expect(mockedApi.drafts.generate).toHaveBeenCalledTimes(2));

    expect(mockedApi.drafts.generate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        sourceContent: "Fresh BTC momentum read",
        sourceType: "MANUAL",
        blendWith: undefined,
        replyAngle: undefined,
      })
    );
    expect(mockedApi.drafts.generate.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        sourceContent: "Fresh BTC momentum read",
        sourceType: "MANUAL",
        angleInstruction: expect.stringContaining(
          "straightforward, generic tweet"
        ),
      })
    );

    expect(await screen.findByText("Your voice")).toBeInTheDocument();
    expect(screen.getByText("Generic")).toBeInTheDocument();
    expect(screen.getAllByText(currentDraft.content).length).toBeGreaterThan(0);
    expect(screen.getAllByText(variantDraft.content).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Use generic" }));

    await waitFor(() =>
      expect(
        screen.getByRole("textbox", { name: "Generated draft" })
      ).toHaveValue(variantDraft.content)
    );
  });

  it("blocks submissions over 100000 characters", async () => {
    renderWithToast(<CraftingPage />);

    const input = screen.getByPlaceholderText(
      "Paste a tweet idea or link…"
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { value: "a".repeat(100001) } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter", charCode: 13 });

    expect(
      await screen.findByText("Content must be under 100,000 characters.")
    ).toBeInTheDocument();
    expect(mockedApi.drafts.generate).not.toHaveBeenCalled();
  });

  it("renders drafts in the sidebar and switches the active draft when one is selected", async () => {
    const firstDraft = createDraft({
      id: "draft-1",
      content: "First draft copy focuses on Bitcoin reclaiming resistance cleanly.",
    });
    const secondDraft = createDraft({
      id: "draft-2",
      content: "Second draft copy frames ETH strength as the cleaner momentum trade.",
      createdAt: "2026-04-03T10:05:00.000Z",
    });

    mockedApi.drafts.list.mockResolvedValue({ drafts: [firstDraft, secondDraft] });

    renderWithToast(<CraftingPage />);

    const generatedDraft = await screen.findByRole("textbox", {
      name: "Generated draft",
    });

    expect(generatedDraft).toHaveValue(firstDraft.content);
    expect(
      screen.queryByText("No drafts yet. Generate your first tweet above.")
    ).not.toBeInTheDocument();

    const draftButtons = await screen.findAllByRole("button", {
      name: /Second draft copy frames ETH strength as the cleaner momentum trade/i,
    });
    fireEvent.click(draftButtons[0]);

    await waitFor(() => expect(generatedDraft).toHaveValue(secondDraft.content));
  });

  it("shows and dismisses the URL preview card in news mode", async () => {
    renderWithToast(<CraftingPage />);

    fireEvent.click(screen.getByRole("tab", { name: "News to Post" }));
    fireEvent.change(screen.getByLabelText("Paste an article URL"), {
      target: { value: "https://example.com/articles/preview-card" },
    });

    expect(await screen.findByText("News Article")).toBeInTheDocument();
    expect(
      screen.getByText("https://example.com/articles/preview-card")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Dismiss URL preview" }));

    await waitFor(() =>
      expect(screen.queryByText("News Article")).not.toBeInTheDocument()
    );
  });

  it("generates a news draft with the source URL appended and keeps it during refinement", async () => {
    const articleUrl = "https://example.com/articles/eth-etf";
    const initialDraftText = "ETH ETF flows are accelerating again.";
    const refinedDraftText = "ETH ETF flows are accelerating again with stronger momentum.";

    mockedApi.drafts.generate.mockResolvedValue({
      draft: createDraft({
        id: "draft-1",
        content: initialDraftText,
        sourceType: "ARTICLE",
        sourceContent: articleUrl,
      }),
    });
    mockedApi.drafts.refine.mockResolvedValue({
      draft: createDraft({
        id: "draft-1",
        content: refinedDraftText,
        version: 2,
        sourceType: "ARTICLE",
        sourceContent: articleUrl,
      }),
    });

    renderWithToast(<CraftingPage />);

    fireEvent.click(screen.getByRole("tab", { name: "News to Post" }));
    fireEvent.change(screen.getByLabelText("Paste an article URL"), {
      target: { value: articleUrl },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate Post" }));

    await waitFor(() =>
      expect(mockedApi.drafts.generate).toHaveBeenCalledWith({
        sourceContent: articleUrl,
        sourceType: "ARTICLE",
        blendWith: undefined,
      })
    );

    const generatedDraft = `${initialDraftText}\n\nsource: ${articleUrl}`;
    const generatedDraftBox = await screen.findByRole("textbox", {
      name: "Generated draft",
    });

    expect(generatedDraftBox).toHaveValue(generatedDraft);
    expect(screen.getByText(`${280 - generatedDraft.length}`)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Shorter" }));

    await waitFor(() =>
      expect(mockedApi.drafts.refine).toHaveBeenCalledWith(
        "draft-1",
        "Make this tweet shorter and more concise — cut the fat"
      )
    );

    await waitFor(() =>
      expect(generatedDraftBox).toHaveValue(
        `${refinedDraftText}\n\nsource: ${articleUrl}`
      )
    );
  });

  it("shows the fallback textarea when article fetching fails and can generate from pasted text", async () => {
    const articleUrl = "https://example.com/articles/solana-update";
    const fallbackText = "Solana activity is climbing and validators are seeing higher demand.";
    const fallbackDraftText = "Solana demand is climbing again and the validator story is getting stronger.";

    mockedApi.drafts.generate
      .mockRejectedValueOnce(new Error("Fetch failed"))
      .mockResolvedValueOnce({
        draft: createDraft({
          id: "draft-2",
          content: fallbackDraftText,
          sourceType: "MANUAL",
          sourceContent: fallbackText,
        }),
      });

    renderWithToast(<CraftingPage />);

    fireEvent.click(screen.getByRole("tab", { name: "News to Post" }));
    fireEvent.change(screen.getByLabelText("Paste an article URL"), {
      target: { value: articleUrl },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate Post" }));

    expect(
      await screen.findByText("Could not fetch article. Paste the article text or key points.")
    ).toBeInTheDocument();

    const fallbackInput = await screen.findByLabelText("Article text or key points");
    fireEvent.change(fallbackInput, { target: { value: fallbackText } });
    fireEvent.click(screen.getByRole("button", { name: "Generate Post" }));

    await waitFor(() =>
      expect(mockedApi.drafts.generate).toHaveBeenLastCalledWith({
        sourceContent: fallbackText,
        sourceType: "MANUAL",
        blendWith: undefined,
      })
    );

    await waitFor(() =>
      expect(
        screen.getByRole("textbox", { name: "Generated draft" })
      ).toHaveValue(`${fallbackDraftText}\n\nsource: ${articleUrl}`)
    );
  });

  it("shows the X compose button only for approved drafts and opens the intent URL", async () => {
    const approvedDraft = createDraft({
      status: "APPROVED",
      content: "BTC looks constructive above range highs.",
    });
    const openSpy = jest
      .spyOn(window, "open")
      .mockImplementation(() => null);

    mockedApi.drafts.list.mockResolvedValue({ drafts: [approvedDraft] });

    renderWithToast(<CraftingPage />);

    const postToXButton = await screen.findByRole("button", {
      name: "Post to X",
    });

    expect(postToXButton).toBeInTheDocument();
    fireEvent.click(postToXButton);

    await waitFor(() =>
      expect(openSpy).toHaveBeenCalledWith(
        "https://twitter.com/intent/tweet?text=BTC+looks+constructive+above+range+highs.",
        "_blank",
        "width=550,height=420"
      )
    );

    openSpy.mockRestore();
  });

  it("does not show the X compose button for non-approved drafts", async () => {
    mockedApi.drafts.list.mockResolvedValue({
      drafts: [createDraft({ status: "ARCHIVED" })],
    });

    renderWithToast(<CraftingPage />);

    await screen.findByRole("textbox", { name: "Generated draft" });

    expect(
      screen.queryByRole("button", { name: "Post to X" })
    ).not.toBeInTheDocument();
  });

  it("shows the Schedule button for draft and approved statuses", async () => {
    mockedApi.drafts.list.mockResolvedValue({
      drafts: [createDraft({ status: "DRAFT" })],
    });

    renderWithToast(<CraftingPage />);

    await screen.findByRole("textbox", { name: "Generated draft" });

    expect(screen.getByRole("button", { name: "Schedule" })).toBeInTheDocument();
  });

  it("opens the schedule popover and schedules the draft", async () => {
    const draft = createDraft({ status: "APPROVED" });
    const scheduledDraft = createDraft({ status: "SCHEDULED", scheduledAt: "2026-04-15T12:00:00.000Z" });

    mockedApi.drafts.list.mockResolvedValue({ drafts: [draft] });
    mockedApi.drafts.schedule.mockResolvedValue({ draft: scheduledDraft });

    renderWithToast(<CraftingPage />);

    await screen.findByRole("textbox", { name: "Generated draft" });

    fireEvent.click(screen.getByRole("button", { name: "Schedule" }));

    const dateInput = await screen.findByLabelText("Schedule date and time");
    expect(dateInput).toBeInTheDocument();

    fireEvent.change(dateInput, { target: { value: "2026-04-15T12:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() =>
      expect(mockedApi.drafts.schedule).toHaveBeenCalledWith(
        "draft-1",
        expect.stringMatching(/^2026-04-15T\d{2}:00:00\.000Z$/)
      )
    );
  });

  it("does not show the Schedule button for archived drafts", async () => {
    mockedApi.drafts.list.mockResolvedValue({
      drafts: [createDraft({ status: "ARCHIVED" })],
    });

    renderWithToast(<CraftingPage />);

    await screen.findByRole("textbox", { name: "Generated draft" });

    expect(screen.queryByRole("button", { name: "Schedule" })).not.toBeInTheDocument();
  });

  it("shows multi-angle button after pasting substantial text and opens panel on click", async () => {
    renderWithToast(<CraftingPage />);

    fireEvent.change(screen.getByPlaceholderText("Paste a tweet idea or link…"), {
      target: { value: "a".repeat(600) },
    });

    const multiAngleButton = await screen.findByRole("button", {
      name: "Generate Multi-Angle Tweets",
    });
    expect(multiAngleButton).toBeInTheDocument();

    mockedApi.drafts.generate.mockResolvedValue({ draft: createDraft() });

    fireEvent.click(multiAngleButton);

    await waitFor(() =>
      expect(screen.getByText("Multi-Angle Tweets")).toBeInTheDocument()
    );
  });

  it("batch approves multi-angle drafts and refreshes the sidebar", async () => {
    renderWithToast(<CraftingPage />);

    fireEvent.change(screen.getByPlaceholderText("Paste a tweet idea or link…"), {
      target: { value: "a".repeat(600) },
    });

    const multiAngleButton = await screen.findByRole("button", {
      name: "Generate Multi-Angle Tweets",
    });

    mockedApi.drafts.generate.mockResolvedValue({
      draft: createDraft({ id: "draft-angle-1", content: "Angle draft content" }),
    });
    mockedApi.drafts.update.mockResolvedValue({
      draft: createDraft({ id: "draft-angle-1", status: "APPROVED" }),
    });
    mockedApi.drafts.enqueue.mockResolvedValue({
      draft: createDraft({ id: "draft-angle-1", status: "APPROVED" }),
    });

    fireEvent.click(multiAngleButton);

    await waitFor(() =>
      expect(screen.getAllByText("Angle draft content").length).toBeGreaterThan(0)
    );

    const batchApproveButton = screen.getByRole("button", {
      name: "Approve 5 to Queue",
    });
    fireEvent.click(batchApproveButton);

    await waitFor(() =>
      expect(mockedApi.drafts.update).toHaveBeenCalledWith(
        "draft-angle-1",
        expect.objectContaining({ status: "APPROVED" })
      )
    );
    await waitFor(() =>
      expect(mockedApi.drafts.enqueue).toHaveBeenCalledWith("draft-angle-1")
    );
  });
});

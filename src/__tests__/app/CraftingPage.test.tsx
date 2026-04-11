import "@testing-library/jest-dom";
import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  usePathname: () => "/crafting",
  useSearchParams: () => new URLSearchParams(),
}));

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

jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/crafting",
}));

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

describe("CraftingPage", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: { handle: "AtlasAnalyst", voiceProfile: { tweetsAnalyzed: 12 } },
    });

    mockedApi.drafts.list.mockReset();
    mockedApi.drafts.generate.mockReset();
    mockedApi.drafts.update.mockReset();
    mockedApi.drafts.regenerate.mockReset();
    mockedApi.drafts.delete.mockReset();
    mockedApi.drafts.refine.mockReset();
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

  it("shows inline errors when trying to submit empty content", async () => {
    render(<CraftingPage />);

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

    render(<CraftingPage />);

    fireEvent.change(screen.getByPlaceholderText("Paste a tweet idea or link…"), {
      target: { value: "Fresh BTC momentum read" },
    });
    fireEvent.keyDown(document, { key: "Enter", metaKey: true });

    await waitFor(() =>
      expect(mockedApi.drafts.generate).toHaveBeenCalledWith({
        sourceContent: "Fresh BTC momentum read",
        sourceType: "MANUAL",
        blendId: undefined,
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

    render(<CraftingPage />);

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
        blendId: undefined,
        replyAngle: undefined,
      })
    );
    expect(mockedApi.drafts.generate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        sourceContent: "Fresh BTC momentum read",
        sourceType: "MANUAL",
        blendId: undefined,
        replyAngle: undefined,
        angleInstruction: expect.stringContaining("Increase humor"),
      })
    );

    expect(await screen.findByText("Current profile")).toBeInTheDocument();
    expect(screen.getByText("Variation")).toBeInTheDocument();
    expect(screen.getAllByText(currentDraft.content).length).toBeGreaterThan(0);
    expect(screen.getAllByText(variantDraft.content).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Pick funnier variation" }));

    await waitFor(() =>
      expect(
        screen.getByRole("textbox", { name: "Generated draft" })
      ).toHaveValue(variantDraft.content)
    );
  });

  it("blocks submissions over 100000 characters", async () => {
    render(<CraftingPage />);

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

    render(<CraftingPage />);

    const generatedDraft = await screen.findByRole("textbox", {
      name: "Generated draft",
    });

    expect(generatedDraft).toHaveValue(firstDraft.content);
    expect(
      screen.queryByText("No drafts yet. Generate your first tweet above.")
    ).not.toBeInTheDocument();

    fireEvent.click(
      await screen.findByRole("button", {
        name: /Second draft copy frames ETH strength as the cleaner momentum trade/i,
      })
    );

    await waitFor(() => expect(generatedDraft).toHaveValue(secondDraft.content));
  });

  it("shows and dismisses the URL preview card in news mode", async () => {
    render(<CraftingPage />);

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

    render(<CraftingPage />);

    fireEvent.click(screen.getByRole("tab", { name: "News to Post" }));
    fireEvent.change(screen.getByLabelText("Paste an article URL"), {
      target: { value: articleUrl },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate Post" }));

    await waitFor(() =>
      expect(mockedApi.drafts.generate).toHaveBeenCalledWith({
        sourceContent: articleUrl,
        sourceType: "ARTICLE",
        blendId: undefined,
      })
    );

    const generatedDraft = `${initialDraftText}\n\nsource: ${articleUrl}`;
    const generatedDraftBox = await screen.findByRole("textbox", {
      name: "Generated draft",
    });

    expect(generatedDraftBox).toHaveValue(generatedDraft);
    expect(screen.getByText(`${generatedDraft.length}/280`)).toBeInTheDocument();

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

    render(<CraftingPage />);

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
        blendId: undefined,
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

    render(<CraftingPage />);

    const postToXButton = await screen.findByRole("button", {
      name: "Post to X",
    });

    expect(postToXButton).toBeInTheDocument();
    fireEvent.click(postToXButton);

    await waitFor(() =>
      expect(openSpy).toHaveBeenCalledWith(
        "https://twitter.com/intent/tweet?text=BTC%20looks%20constructive%20above%20range%20highs.",
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

    render(<CraftingPage />);

    await screen.findByRole("textbox", { name: "Generated draft" });

    expect(
      screen.queryByRole("button", { name: "Post to X" })
    ).not.toBeInTheDocument();
  });
});

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import InlineDraftCard from "@/components/alerts/InlineDraftCard";
import type { Alert, TweetDraft } from "@/lib/api";
import { api } from "@/lib/api";

jest.mock("@/lib/api", () => {
  const actual = jest.requireActual("@/lib/api");

  return {
    ...actual,
    api: {
      ...actual.api,
      drafts: {
        ...actual.api.drafts,
        generate: jest.fn(),
        regenerate: jest.fn(),
      },
    },
  };
});

const mockedDraftsApi = api.drafts as unknown as {
  generate: jest.Mock;
  regenerate: jest.Mock;
};

const alert: Alert = {
  id: "alert-1",
  type: "WHALE_ACTIVITY",
  title: "Large ETH wallet moved funds to a major exchange",
  context: "Volume spiked across exchange wallets during the last 10 minutes.",
  createdAt: "2026-04-03T10:00:00.000Z",
};

function createDraft(overrides: Partial<TweetDraft> = {}): TweetDraft {
  return {
    id: "draft-1",
    content: "Fresh draft copy for the alert.",
    version: 1,
    status: "DRAFT",
    createdAt: "2026-04-03T10:01:00.000Z",
    ...overrides,
  };
}

describe("InlineDraftCard", () => {
  beforeEach(() => {
    mockedDraftsApi.generate.mockReset();
    mockedDraftsApi.regenerate.mockReset();
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
      configurable: true,
    });
  });

  it("expands and generates a draft inline from the alert context", async () => {
    mockedDraftsApi.generate.mockResolvedValue({
      draft: createDraft({
        content: "ETH exchange inflows just jumped. Worth watching for near-term pressure.",
      }),
    });

    render(<InlineDraftCard alert={alert} />);

    fireEvent.click(screen.getByRole("button", { name: "Draft Post" }));

    expect(mockedDraftsApi.generate).toHaveBeenCalledWith(
      expect.stringContaining(alert.title),
      expect.stringMatching(/MANUAL|ALERT/)
    );

    const textarea = await screen.findByRole("textbox", {
      name: "Draft post text",
    });

    expect(textarea).toHaveValue(
      "ETH exchange inflows just jumped. Worth watching for near-term pressure."
    );
    expect(screen.getByText("Draft created")).toBeInTheDocument();
    expect(screen.getByText(/characters$/)).toHaveTextContent(
      "72/280 characters"
    );
  });

  it("copies the editable draft text and can regenerate it", async () => {
    mockedDraftsApi.generate.mockResolvedValue({
      draft: createDraft({ content: "Initial alert take." }),
    });
    mockedDraftsApi.regenerate.mockResolvedValue({
      draft: createDraft({
        id: "draft-2",
        content: "Sharper regenerated post for the same alert.",
        version: 2,
      }),
    });

    render(<InlineDraftCard alert={alert} />);

    fireEvent.click(screen.getByRole("button", { name: "Draft Post" }));

    const textarea = await screen.findByRole("textbox", {
      name: "Draft post text",
    });

    fireEvent.change(textarea, {
      target: { value: "Edited alert draft ready to copy." },
    });

    fireEvent.click(screen.getByRole("button", { name: "Copy" }));

    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "Edited alert draft ready to copy."
      )
    );

    fireEvent.click(screen.getByRole("button", { name: "Regenerate" }));

    await waitFor(() =>
      expect(mockedDraftsApi.regenerate).toHaveBeenCalledWith("draft-1")
    );

    await waitFor(() =>
      expect(textarea).toHaveValue("Sharper regenerated post for the same alert.")
    );
  });

  it("shows an existing draft reply without generating a new one", async () => {
    render(
      <InlineDraftCard
        alert={{
          ...alert,
          draftReply: "Pre-generated reply shipped from the API.",
        }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Draft Post" }));

    expect(mockedDraftsApi.generate).not.toHaveBeenCalled();
    expect(
      await screen.findByRole("textbox", { name: "Draft post text" })
    ).toHaveValue("Pre-generated reply shipped from the API.");
  });
});

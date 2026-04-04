import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import DraftHistorySidebar, {
  DraftHistoryItem,
} from "@/components/crafting/DraftHistorySidebar";

const draftHistoryItems: DraftHistoryItem[] = [
  {
    draft: {
      id: "draft-1",
      content:
        "Bitcoin just reclaimed a key resistance level and the follow-through matters more than the breakout headline.",
      version: 1,
      status: "DRAFT",
      createdAt: "2026-04-03T12:00:00.000Z",
    },
    copiedToClipboard: true,
    generatedAt: "2026-04-03T12:00:00.000Z",
  },
  {
    draft: {
      id: "draft-2",
      content: "ETH order flow still looks cleaner than most of the majors right now.",
      version: 1,
      status: "DRAFT",
      createdAt: "2026-04-03T12:05:00.000Z",
    },
    copiedToClipboard: false,
    generatedAt: "2026-04-03T12:05:00.000Z",
  },
];

describe("DraftHistorySidebar", () => {
  it("renders the empty state when there are no drafts", () => {
    render(
      <DraftHistorySidebar
        drafts={[]}
        activeDraftId={null}
        onSelectDraft={jest.fn()}
      />
    );

    expect(screen.getByText("Drafts")).toBeInTheDocument();
    expect(
      screen.getByText("No drafts yet. Generate your first tweet above.")
    ).toBeInTheDocument();
  });

  it("renders draft metadata and copied badge", () => {
    render(
      <DraftHistorySidebar
        drafts={draftHistoryItems}
        activeDraftId="draft-1"
        onSelectDraft={jest.fn()}
      />
    );

    expect(screen.getByText(/Bitcoin just reclaimed a key resistance level/i)).toBeInTheDocument();
    expect(screen.getByText("109 chars")).toBeInTheDocument();
    expect(screen.getByText("Draft created")).toBeInTheDocument();
  });

  it("loads a draft when a history card is clicked", () => {
    const handleSelectDraft = jest.fn();

    render(
      <DraftHistorySidebar
        drafts={draftHistoryItems}
        activeDraftId={null}
        onSelectDraft={handleSelectDraft}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /ETH order flow/i }));

    expect(handleSelectDraft).toHaveBeenCalledWith(draftHistoryItems[1].draft);
  });
});

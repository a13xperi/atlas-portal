import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import DraftHistorySidebar, {
  DraftHistoryItem,
} from "@/components/crafting/DraftHistorySidebar";

const firstDraft = {
  id: "draft-1",
  content:
    "Bitcoin keeps absorbing sell pressure while spot ETF flows stay firm and funding remains balanced across majors.",
  version: 1,
  status: "DRAFT" as const,
  createdAt: "2026-04-03T08:30:00.000Z",
};

const secondDraft = {
  id: "draft-2",
  content:
    "Ethereum is setting up for a catch-up move if BTC stays range-bound and on-chain activity keeps improving through the weekend.",
  version: 2,
  status: "DRAFT" as const,
  createdAt: "2026-04-03T09:15:00.000Z",
};

describe("DraftHistorySidebar", () => {
  it("shows the desktop sidebar shell and empty state copy", () => {
    render(
      <DraftHistorySidebar drafts={[]} activeDraftId={null} onSelect={jest.fn()} />
    );

    expect(screen.getByText("Draft History")).toBeInTheDocument();
    expect(
      screen.getByText("No drafts yet. Generate your first tweet above.")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Draft history")).toHaveClass(
      "hidden",
      "lg:flex",
      "w-64"
    );
  });

  it("renders draft cards with preview, badge, and character count", () => {
    const drafts: DraftHistoryItem[] = [
      { draft: firstDraft, isCopied: true },
      { draft: secondDraft, isCopied: false },
    ];

    render(
      <DraftHistorySidebar
        drafts={drafts}
        activeDraftId={firstDraft.id}
        onSelect={jest.fn()}
      />
    );

    expect(
      screen.getByText(
        "Bitcoin keeps absorbing sell pressure while spot ETF flows stay firm and funding…"
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Draft created")).toBeInTheDocument();
    expect(screen.getByText(`${firstDraft.content.length} chars`)).toBeInTheDocument();
    expect(screen.getByText(`${secondDraft.content.length} chars`)).toBeInTheDocument();
  });

  it("loads a selected draft back into the main workspace callback", () => {
    const handleSelect = jest.fn();

    render(
      <DraftHistorySidebar
        drafts={[{ draft: secondDraft, isCopied: false }]}
        activeDraftId={null}
        onSelect={handleSelect}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Ethereum is setting up/i }));

    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith(secondDraft);
  });
});

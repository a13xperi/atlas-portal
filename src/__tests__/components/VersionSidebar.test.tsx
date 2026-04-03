import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import VersionSidebar from "@/components/ui/VersionSidebar";
import { TweetDraft } from "@/lib/api";

const makeDraft = (overrides: Partial<TweetDraft>): TweetDraft => ({
  id: "draft-1",
  content: "BTC held support and the bounce matters more than the headline.",
  version: 1,
  status: "DRAFT",
  createdAt: "2026-04-03T12:00:00.000Z",
  sourceContent: "Macro setup",
  ...overrides,
});

describe("VersionSidebar", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the available draft versions with metadata", () => {
    jest.spyOn(Date, "now").mockReturnValue(
      new Date("2026-04-03T12:30:00.000Z").getTime()
    );

    const drafts = [
      makeDraft({
        id: "draft-1",
        version: 1,
        createdAt: "2026-04-03T12:00:00.000Z",
      }),
      makeDraft({
        id: "draft-2",
        version: 2,
        content: "BTC held support, and now the bounce looks increasingly real.",
        createdAt: "2026-04-03T12:15:00.000Z",
        feedback: "Punch up the conviction",
      }),
    ];

    render(
      <VersionSidebar
        drafts={drafts}
        activeDraft={drafts[0]}
        onSelect={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText("Version History")).toBeInTheDocument();
    expect(screen.getByText("v1")).toBeInTheDocument();
    expect(screen.getByText("v2")).toBeInTheDocument();
    expect(screen.getByText("30m ago")).toBeInTheDocument();
    expect(screen.getByText("15m ago")).toBeInTheDocument();
  });

  it("calls onSelect when a version is clicked", () => {
    const drafts = [
      makeDraft({
        id: "draft-1",
        version: 1,
      }),
      makeDraft({
        id: "draft-2",
        version: 2,
        content: "ETH still has the cleanest structure among majors right now.",
        createdAt: "2026-04-03T12:05:00.000Z",
      }),
    ];
    const handleSelect = jest.fn();

    render(
      <VersionSidebar
        drafts={drafts}
        activeDraft={drafts[0]}
        onSelect={handleSelect}
        onClose={jest.fn()}
      />
    );

    fireEvent.click(screen.getByText("v2").closest("button") as HTMLButtonElement);

    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith(drafts[1]);
  });

  it("highlights the selected version", () => {
    const drafts = [
      makeDraft({
        id: "draft-1",
        version: 1,
      }),
      makeDraft({
        id: "draft-2",
        version: 2,
        content: "ETH still has the cleanest structure among majors right now.",
        createdAt: "2026-04-03T12:05:00.000Z",
      }),
    ];

    render(
      <VersionSidebar
        drafts={drafts}
        activeDraft={drafts[1]}
        onSelect={jest.fn()}
        onClose={jest.fn()}
      />
    );

    const activeVersion = screen.getByText("v2").closest("button");

    expect(activeVersion).toHaveClass("border-atlas-teal");
    expect(activeVersion).toHaveClass("bg-atlas-teal/5");
  });

  it("shows the empty state when no versions exist", () => {
    render(
      <VersionSidebar
        drafts={[]}
        activeDraft={makeDraft({
          id: "draft-0",
        })}
        onSelect={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(
      screen.getByText(
        /No other versions yet\. Use “Try again” or provide feedback to generate new versions\./i
      )
    ).toBeInTheDocument();
  });
});

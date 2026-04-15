import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MultiAnglePanel } from "@/components/crafting/MultiAnglePanel";

jest.mock("@/lib/api", () => ({
  api: {
    drafts: {
      generate: jest.fn(),
      update: jest.fn(),
      enqueue: jest.fn(),
    },
  },
}));

const { api } = require("@/lib/api");
const mockedApi = api as unknown as {
  drafts: {
    generate: jest.Mock;
    update: jest.Mock;
    enqueue: jest.Mock;
  };
};

function createDraft(overrides: Record<string, unknown> = {}) {
  return {
    id: `draft-${Math.random().toString(36).slice(2)}`,
    content: "Generated draft content",
    version: 1,
    status: "DRAFT",
    createdAt: "2026-04-03T10:00:00.000Z",
    ...overrides,
  };
}

describe("MultiAnglePanel", () => {
  beforeEach(() => {
    mockedApi.drafts.generate.mockReset();
    mockedApi.drafts.update.mockReset();
    mockedApi.drafts.enqueue.mockReset();
  });

  it("generates 5 angles on mount and renders them in a grid", async () => {
    mockedApi.drafts.generate.mockResolvedValue({
      draft: createDraft(),
    });

    render(
      <MultiAnglePanel
        sourceContent="Some report content that is long enough"
        sourceType="REPORT"
      />
    );

    await waitFor(() =>
      expect(screen.getByText("Contrarian")).toBeInTheDocument()
    );
    expect(screen.getByText("Bullish")).toBeInTheDocument();
    expect(screen.getByText("Educational")).toBeInTheDocument();
    expect(screen.getByText("Data-led")).toBeInTheDocument();
    expect(screen.getByText("Narrative")).toBeInTheDocument();
  });

  it("allows editing draft content", async () => {
    mockedApi.drafts.generate.mockResolvedValue({
      draft: createDraft({ content: "Original angle content" }),
    });

    render(
      <MultiAnglePanel
        sourceContent="Report text"
        sourceType="REPORT"
      />
    );

    await waitFor(() =>
      expect(screen.getAllByDisplayValue("Original angle content").length).toBeGreaterThan(0)
    );

    const textarea = screen.getAllByDisplayValue("Original angle content")[0];
    fireEvent.change(textarea, { target: { value: "Edited angle content" } });
    fireEvent.blur(textarea);

    expect(textarea).toHaveValue("Edited angle content");
  });

  it("batch approves selected drafts and calls update + enqueue", async () => {
    mockedApi.drafts.generate.mockResolvedValue({
      draft: createDraft({ id: "draft-1", content: "Angle one" }),
    });
    mockedApi.drafts.update.mockResolvedValue({
      draft: createDraft({ id: "draft-1", status: "APPROVED" }),
    });
    mockedApi.drafts.enqueue.mockResolvedValue({
      draft: createDraft({ id: "draft-1", status: "APPROVED" }),
    });

    const onDraftsCreated = jest.fn();
    render(
      <MultiAnglePanel
        sourceContent="Report text"
        sourceType="REPORT"
        onDraftsCreated={onDraftsCreated}
      />
    );

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Approve 5 to Queue" })).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: "Approve 5 to Queue" }));

    await waitFor(() =>
      expect(mockedApi.drafts.update).toHaveBeenCalledTimes(5)
    );
    await waitFor(() =>
      expect(mockedApi.drafts.enqueue).toHaveBeenCalledTimes(5)
    );

    expect(onDraftsCreated).toHaveBeenCalled();
  });

  it("allows discarding a draft and removes it from selection", async () => {
    mockedApi.drafts.generate.mockResolvedValue({
      draft: createDraft({ id: "draft-1", content: "Angle one" }),
    });

    render(
      <MultiAnglePanel
        sourceContent="Report text"
        sourceType="REPORT"
      />
    );

    await waitFor(() =>
      expect(screen.getAllByLabelText("Discard draft").length).toBeGreaterThan(0)
    );

    const discardButtons = screen.getAllByLabelText("Discard draft");
    fireEvent.click(discardButtons[0]);

    await waitFor(() =>
      expect(screen.getByText(/4 angles ready/i)).toBeInTheDocument()
    );
  });

  it("calls onError when generation fails", async () => {
    mockedApi.drafts.generate.mockRejectedValue(new Error("Generation failed"));

    const onError = jest.fn();
    render(
      <MultiAnglePanel
        sourceContent="Report text"
        sourceType="REPORT"
        onError={onError}
      />
    );

    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith("Generation failed")
    );
  });
});

import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import RefinementChips from "@/components/ui/RefinementChips";

// DM-325: Inline per-tweet refinement chips use the following labels.
// Keep these in sync with src/components/ui/RefinementChips.tsx.
describe("RefinementChips", () => {
  it("renders the refinement chip buttons", () => {
    render(
      <RefinementChips
        onRefine={jest.fn().mockResolvedValue(undefined)}
        disabled={false}
        loading={null}
      />
    );

    expect(screen.getByRole("button", { name: "Make it funnier" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "More serious" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add evidence" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Shorter" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bolder take" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Simpler" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thread it" })).toBeInTheDocument();
  });

  it("calls onRefine with the matching chip when clicked", () => {
    const handleRefine = jest.fn().mockResolvedValue(undefined);

    render(
      <RefinementChips
        onRefine={handleRefine}
        disabled={false}
        loading={null}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Bolder take" }));

    expect(handleRefine).toHaveBeenCalledTimes(1);
    expect(handleRefine).toHaveBeenCalledWith({
      label: "Bolder take",
      instruction: "Make this a bolder, more provocative take — don't hedge",
    });
  });

  it("disables every chip when the disabled prop is true", () => {
    render(
      <RefinementChips
        onRefine={jest.fn().mockResolvedValue(undefined)}
        disabled
        loading={null}
      />
    );

    expect(screen.getByRole("button", { name: "Make it funnier" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "More serious" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Add evidence" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Shorter" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Bolder take" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Simpler" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Thread it" })).toBeDisabled();
  });

  it("highlights the active loading chip", () => {
    render(
      <RefinementChips
        onRefine={jest.fn().mockResolvedValue(undefined)}
        disabled={false}
        loading="Bolder take"
      />
    );

    const activeChip = screen.getByText("Refining...").closest("button");

    expect(activeChip).toHaveAttribute("aria-pressed", "true");
    expect(activeChip).toHaveClass("border-atlas-teal");
    expect(activeChip).toHaveClass("bg-atlas-teal/10");
    expect(activeChip).toHaveClass("text-atlas-teal");
  });
});

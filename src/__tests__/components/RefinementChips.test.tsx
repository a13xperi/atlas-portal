import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import RefinementChips from "@/components/ui/RefinementChips";

describe("RefinementChips", () => {
  it("renders the refinement chip buttons", () => {
    render(
      <RefinementChips
        onRefine={jest.fn().mockResolvedValue(undefined)}
        disabled={false}
        loading={null}
      />
    );

    expect(screen.getByRole("button", { name: "Shorter" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Snarkier" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hook" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Thread/i })).toBeInTheDocument();
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

    fireEvent.click(screen.getByRole("button", { name: "Hook" }));

    expect(handleRefine).toHaveBeenCalledTimes(1);
    expect(handleRefine).toHaveBeenCalledWith({
      label: "Hook",
      instruction: "Add a stronger hook at the beginning",
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

    expect(screen.getByRole("button", { name: "Shorter" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Snarkier" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Hook" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Thread/i })).toBeDisabled();
  });

  it("highlights the active loading chip", () => {
    render(
      <RefinementChips
        onRefine={jest.fn().mockResolvedValue(undefined)}
        disabled={false}
        loading="Hook"
      />
    );

    const activeChip = screen.getByText("Refining...").closest("button");

    expect(activeChip).toHaveAttribute("aria-pressed", "true");
    expect(activeChip).toHaveClass("border-atlas-teal");
    expect(activeChip).toHaveClass("bg-atlas-teal/10");
    expect(activeChip).toHaveClass("text-atlas-teal");
  });
});

import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { AngleCard } from "@/components/crafting/AngleCard";
import { CraftingAngle } from "@/hooks/useCraftingAdvisor";

const baseAngle: CraftingAngle = {
  id: "angle-1",
  title: "Hot Take",
  description: "A bold, opinion-driven angle",
  sampleOpener: "Everyone is wrong about this...",
  tone: "Provocative",
  structure: "tweet",
  angleInstruction: "Be direct and contrarian",
};

describe("AngleCard", () => {
  it("renders title, tone badge, and description", () => {
    render(
      <AngleCard
        angle={baseAngle}
        selected={false}
        disabled={false}
        onToggle={jest.fn()}
      />
    );

    expect(screen.getByText("Hot Take")).toBeInTheDocument();
    expect(screen.getByText("Provocative")).toBeInTheDocument();
    expect(
      screen.getByText("A bold, opinion-driven angle")
    ).toBeInTheDocument();
  });

  it("renders sample opener when present", () => {
    render(
      <AngleCard
        angle={baseAngle}
        selected={false}
        disabled={false}
        onToggle={jest.fn()}
      />
    );

    expect(
      screen.getByText(/Everyone is wrong about this/)
    ).toBeInTheDocument();
  });

  it("does not render sample opener when absent", () => {
    const noOpener: CraftingAngle = { ...baseAngle, sampleOpener: "" };

    render(
      <AngleCard
        angle={noOpener}
        selected={false}
        disabled={false}
        onToggle={jest.fn()}
      />
    );

    expect(
      screen.queryByText(/Everyone is wrong about this/)
    ).not.toBeInTheDocument();
  });

  it("shows thread indicator for thread structure", () => {
    const threadAngle: CraftingAngle = {
      ...baseAngle,
      structure: "thread",
    };

    render(
      <AngleCard
        angle={threadAngle}
        selected={false}
        disabled={false}
        onToggle={jest.fn()}
      />
    );

    expect(screen.getByText(/thread/)).toBeInTheDocument();
  });

  it("shows single indicator for tweet structure", () => {
    render(
      <AngleCard
        angle={baseAngle}
        selected={false}
        disabled={false}
        onToggle={jest.fn()}
      />
    );

    expect(screen.getByText(/single/)).toBeInTheDocument();
  });

  it("calls onToggle with angle id when clicked", () => {
    const handleToggle = jest.fn();

    render(
      <AngleCard
        angle={baseAngle}
        selected={false}
        disabled={false}
        onToggle={handleToggle}
      />
    );

    fireEvent.click(screen.getByRole("button"));

    expect(handleToggle).toHaveBeenCalledTimes(1);
    expect(handleToggle).toHaveBeenCalledWith("angle-1");
  });

  it("applies selected styling when selected", () => {
    render(
      <AngleCard
        angle={baseAngle}
        selected={true}
        disabled={false}
        onToggle={jest.fn()}
      />
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-delphi-teal/10");
    expect(button).not.toBeDisabled();
  });

  it("renders checkmark svg when selected", () => {
    const { container } = render(
      <AngleCard
        angle={baseAngle}
        selected={true}
        disabled={false}
        onToggle={jest.fn()}
      />
    );

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("does not render checkmark svg when unselected", () => {
    const { container } = render(
      <AngleCard
        angle={baseAngle}
        selected={false}
        disabled={false}
        onToggle={jest.fn()}
      />
    );

    const svg = container.querySelector("svg");
    expect(svg).not.toBeInTheDocument();
  });

  it("disables button when disabled and not selected", () => {
    render(
      <AngleCard
        angle={baseAngle}
        selected={false}
        disabled={true}
        onToggle={jest.fn()}
      />
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveClass("opacity-40");
    expect(button).toHaveClass("cursor-not-allowed");
  });

  it("does not disable button when disabled but selected", () => {
    const handleToggle = jest.fn();

    render(
      <AngleCard
        angle={baseAngle}
        selected={true}
        disabled={true}
        onToggle={handleToggle}
      />
    );

    const button = screen.getByRole("button");
    expect(button).not.toBeDisabled();

    fireEvent.click(button);
    expect(handleToggle).toHaveBeenCalledWith("angle-1");
  });

  it("does not fire onToggle when disabled and not selected", () => {
    const handleToggle = jest.fn();

    render(
      <AngleCard
        angle={baseAngle}
        selected={false}
        disabled={true}
        onToggle={handleToggle}
      />
    );

    fireEvent.click(screen.getByRole("button"));
    expect(handleToggle).not.toHaveBeenCalled();
  });

  it("applies correct tone style for known tone", () => {
    render(
      <AngleCard
        angle={baseAngle}
        selected={false}
        disabled={false}
        onToggle={jest.fn()}
      />
    );

    const badge = screen.getByText("Provocative");
    expect(badge).toHaveClass("bg-red-500/15");
    expect(badge).toHaveClass("text-red-300");
  });

  it("falls back to Analytical style for unknown tone", () => {
    const unknownTone: CraftingAngle = {
      ...baseAngle,
      tone: "Mysterious",
    };

    render(
      <AngleCard
        angle={unknownTone}
        selected={false}
        disabled={false}
        onToggle={jest.fn()}
      />
    );

    const badge = screen.getByText("Mysterious");
    expect(badge).toHaveClass("bg-blue-500/15");
    expect(badge).toHaveClass("text-blue-300");
  });

  it("applies each known tone style correctly", () => {
    const tones: Record<string, string> = {
      Analytical: "bg-blue-500/15",
      Educational: "bg-violet-500/15",
      Contrarian: "bg-orange-500/15",
      Conversational: "bg-green-500/15",
    };

    for (const [tone, expectedClass] of Object.entries(tones)) {
      const angle: CraftingAngle = { ...baseAngle, tone };
      const { unmount } = render(
        <AngleCard
          angle={angle}
          selected={false}
          disabled={false}
          onToggle={jest.fn()}
        />
      );

      expect(screen.getByText(tone)).toHaveClass(expectedClass);
      unmount();
    }
  });
});

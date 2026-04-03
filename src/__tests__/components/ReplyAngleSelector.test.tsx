import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import ReplyAngleSelector from "@/components/ui/ReplyAngleSelector";

describe("ReplyAngleSelector", () => {
  it("renders all reply angle tabs", () => {
    render(
      <ReplyAngleSelector
        selectedAngle="Direct"
        onAngleChange={jest.fn()}
      />
    );

    expect(screen.getByRole("tab", { name: "Direct" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Curious" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Concise" })).toBeInTheDocument();
  });

  it("highlights the selected angle", () => {
    render(
      <ReplyAngleSelector
        selectedAngle="Direct"
        onAngleChange={jest.fn()}
      />
    );

    expect(screen.getByRole("tab", { name: "Direct" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByRole("tab", { name: "Direct" })).toHaveClass(
      "bg-gradient-to-r"
    );
    expect(screen.getByRole("tab", { name: "Curious" })).toHaveClass(
      "text-atlas-text-secondary"
    );
  });

  it("calls onAngleChange with the selected angle", () => {
    const handleAngleChange = jest.fn();

    render(
      <ReplyAngleSelector
        selectedAngle="Direct"
        onAngleChange={handleAngleChange}
      />
    );

    fireEvent.click(screen.getByRole("tab", { name: "Concise" }));

    expect(handleAngleChange).toHaveBeenCalledWith("Concise");
  });
});

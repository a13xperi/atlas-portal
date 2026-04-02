import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import GradientButton from "@/components/ui/GradientButton";

describe("GradientButton", () => {
  it("renders button text", () => {
    render(<GradientButton>Generate</GradientButton>);

    expect(screen.getByRole("button", { name: "Generate" })).toBeInTheDocument();
  });

  it("calls the click handler when pressed", () => {
    const handleClick = jest.fn();

    render(<GradientButton onClick={handleClick}>Craft</GradientButton>);

    fireEvent.click(screen.getByRole("button", { name: "Craft" }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("applies the primary gradient class by default", () => {
    render(<GradientButton>Publish</GradientButton>);

    expect(screen.getByRole("button", { name: "Publish" })).toHaveClass("gradient-cta");
  });

  it("renders a disabled button state", () => {
    render(<GradientButton disabled>Disabled</GradientButton>);

    const button = screen.getByRole("button", { name: "Disabled" });

    expect(button).toBeDisabled();
    expect(button).toHaveClass("opacity-50");
    expect(button).toHaveClass("cursor-not-allowed");
  });
});

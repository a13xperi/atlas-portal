import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import DimensionBar from "@/components/ui/DimensionBar";

describe("DimensionBar", () => {
  it("renders the label and current percentage", () => {
    render(<DimensionBar label="Humor" percentage={64} />);

    expect(screen.getByText("Humor")).toBeInTheDocument();
    expect(screen.getByText("64%")).toBeInTheDocument();
  });

  it("calls onChange when the slider value changes", () => {
    const handleChange = jest.fn();

    render(
      <DimensionBar
        label="Formality"
        percentage={50}
        interactive
        onChange={handleChange}
      />
    );

    fireEvent.change(screen.getByRole("slider"), { target: { value: "72" } });

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(72);
  });

  it("updates the displayed value when the percentage prop changes", () => {
    const { rerender } = render(
      <DimensionBar label="Brevity" percentage={35} interactive />
    );

    expect(screen.getByText("35%")).toBeInTheDocument();

    rerender(<DimensionBar label="Brevity" percentage={80} interactive />);

    expect(screen.getByText("80%")).toBeInTheDocument();
  });
});

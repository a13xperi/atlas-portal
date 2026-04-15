import { render, screen } from "@testing-library/react";
import CharacterCounter from "@/components/crafting/CharacterCounter";

describe("CharacterCounter", () => {
  it("should render remaining characters at 0 of 280", () => {
    render(<CharacterCounter value={0} />);

    expect(screen.getByText("280")).toBeInTheDocument();
    expect(screen.getByLabelText("280 characters remaining")).toHaveClass("text-atlas-teal");
  });

  it("should render zero remaining at the 280 boundary", () => {
    render(<CharacterCounter value={280} />);

    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByLabelText("0 characters remaining")).toHaveClass("text-atlas-warning");
  });

  it("should show a negative remaining count in red when over the limit", () => {
    render(<CharacterCounter value={290} />);

    expect(screen.getByText("-10")).toBeInTheDocument();
    expect(screen.getByLabelText("-10 characters remaining")).toHaveClass("text-atlas-error");
  });

  it("should support a custom max prop", () => {
    render(<CharacterCounter value={240} max={250} />);

    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByLabelText("10 characters remaining")).toHaveClass("text-atlas-warning");
  });

  it("should format the aria-label from the remaining count", () => {
    render(<CharacterCounter value={42} />);

    expect(screen.getByLabelText("238 characters remaining")).toBeInTheDocument();
  });
});

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import StatusPill from "@/components/ui/StatusPill";

describe("StatusPill", () => {
  it("renders the label text", () => {
    render(<StatusPill label="Posted" variant="posted" />);
    expect(screen.getByText("Posted")).toBeInTheDocument();
  });

  it("renders as a status span element", () => {
    render(<StatusPill label="Draft" variant="draft" />);
    const pill = screen.getByRole("status");

    expect(pill.tagName).toBe("SPAN");
    expect(pill).toHaveTextContent("Draft");
  });

  it.each([
    ["posted", "bg-atlas-success/20 text-atlas-success"],
    ["draft", "bg-atlas-teal/20 text-atlas-teal"],
    ["feedback", "bg-atlas-warning/20 text-atlas-warning"],
    ["speed", "bg-atlas-warning/20 text-atlas-warning"],
  ] as const)("applies correct classes for variant=%s", (variant, expectedClasses) => {
    render(<StatusPill label="Test" variant={variant} />);
    const pill = screen.getByText("Test");
    for (const cls of expectedClasses.split(" ")) {
      expect(pill).toHaveClass(cls);
    }
  });
});

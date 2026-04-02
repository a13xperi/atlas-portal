import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import GlassCard from "@/components/ui/GlassCard";

describe("GlassCard", () => {
  it("renders children content", () => {
    render(
      <GlassCard>
        <p>Glass content</p>
      </GlassCard>
    );

    expect(screen.getByText("Glass content")).toBeInTheDocument();
  });

  it("applies the glass card styles", () => {
    render(
      <GlassCard>
        <p>Styled content</p>
      </GlassCard>
    );

    const card = screen.getByText("Styled content").parentElement;

    expect(card).toHaveClass("glass-card");
    expect(card).toHaveClass("px-6");
    expect(card).toHaveClass("py-8");
    expect(card).toHaveClass("w-full");
  });

  it("merges a custom className", () => {
    render(
      <GlassCard className="custom-shell">
        <p>Custom content</p>
      </GlassCard>
    );

    expect(screen.getByText("Custom content").parentElement).toHaveClass("custom-shell");
  });
});

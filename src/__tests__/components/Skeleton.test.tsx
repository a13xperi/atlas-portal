import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import { Skeleton } from "@/components/ui/Skeleton";

describe("Skeleton", () => {
  it("should render with the default classes", () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstElementChild;

    expect(skeleton).toHaveClass("bg-white/5");
    expect(skeleton).toHaveClass("rounded-lg");
    expect(skeleton).toHaveAttribute("aria-hidden", "true");
  });

  it("should accept a custom className", () => {
    const { container } = render(<Skeleton className="h-8 w-24 custom-class" />);
    const skeleton = container.firstElementChild;

    expect(skeleton).toHaveClass("h-8");
    expect(skeleton).toHaveClass("w-24");
    expect(skeleton).toHaveClass("custom-class");
  });

  it("should render with animate-pulse", () => {
    const { container } = render(<Skeleton />);

    expect(container.firstElementChild).toHaveClass("animate-pulse");
  });
});

import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import ProgressBar from "@/components/ui/ProgressBar";

function getSegments(container: HTMLElement) {
  const root = container.firstElementChild as HTMLDivElement | null;

  return root ? Array.from(root.children) as HTMLDivElement[] : [];
}

describe("ProgressBar", () => {
  it("should render the given percentage as active segments", () => {
    const { container } = render(<ProgressBar currentStep={45} totalSteps={100} />);
    const segments = getSegments(container);

    expect(segments).toHaveLength(100);
    expect(
      segments.filter((segment) => segment.className.includes("bg-atlas-teal"))
    ).toHaveLength(45);
    expect(
      segments.filter((segment) => segment.className.includes("bg-atlas-surface"))
    ).toHaveLength(55);
  });

  it("should clamp the rendered progress between 0 and 100 segments", () => {
    const { container, rerender } = render(
      <ProgressBar currentStep={-10} totalSteps={100} />
    );

    expect(
      getSegments(container).filter((segment) =>
        segment.className.includes("bg-atlas-teal")
      )
    ).toHaveLength(0);

    rerender(<ProgressBar currentStep={120} totalSteps={100} />);

    expect(
      getSegments(container).filter((segment) =>
        segment.className.includes("bg-atlas-teal")
      )
    ).toHaveLength(100);
  });

  it("should apply the correct full-width step styling", () => {
    const { container } = render(<ProgressBar currentStep={2} totalSteps={4} />);
    const root = container.firstElementChild as HTMLDivElement;
    const segments = getSegments(container);

    expect(root).toHaveClass("w-full");
    segments.forEach((segment) => {
      expect(segment).toHaveClass("flex-1");
      expect(segment).toHaveClass("h-1");
      expect(segment).toHaveClass("rounded-full");
    });
  });
});

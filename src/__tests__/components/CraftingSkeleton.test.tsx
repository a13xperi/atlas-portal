import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import CraftingSkeleton from "@/components/skeletons/CraftingSkeleton";

const getDivsByClasses = (container: HTMLElement, classes: string[]) =>
  Array.from(container.querySelectorAll("div")).filter((element) =>
    classes.every((className) => element.classList.contains(className))
  );

describe("CraftingSkeleton", () => {
  it("renders without crashing", () => {
    const { container } = render(<CraftingSkeleton />);

    expect(container.firstChild).toBeInTheDocument();
  });

  it("contains input placeholder area", () => {
    const { container } = render(<CraftingSkeleton />);

    const inputPlaceholders = getDivsByClasses(container, [
      "h-40",
      "rounded-2xl",
      "animate-pulse",
      "bg-atlas-surface/60",
    ]);

    expect(inputPlaceholders).toHaveLength(1);
  });

  it("has draft placeholder sections", () => {
    const { container } = render(<CraftingSkeleton />);

    const draftSections = Array.from(container.querySelectorAll("div")).filter(
      (element) => {
        const children = Array.from(element.children);

        return (
          element.classList.contains("space-y-2") &&
          children.length === 2 &&
          children[0] instanceof HTMLDivElement &&
          children[0].classList.contains("h-3") &&
          children[0].classList.contains("w-24") &&
          children[1] instanceof HTMLDivElement &&
          children[1].classList.contains("h-2") &&
          children[1].classList.contains("overflow-hidden")
        );
      }
    );

    expect(draftSections).toHaveLength(4);
  });
});

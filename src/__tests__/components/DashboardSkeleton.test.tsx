import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import DashboardSkeleton from "@/components/skeletons/DashboardSkeleton";

const getDivsByClasses = (container: HTMLElement, classes: string[]) =>
  Array.from(container.querySelectorAll("div")).filter((element) =>
    classes.every((className) => element.classList.contains(className))
  );

describe("DashboardSkeleton", () => {
  it("renders without crashing", () => {
    const { container } = render(<DashboardSkeleton />);

    expect(container.firstChild).toBeInTheDocument();
  });

  it("contains pulse animation elements", () => {
    const { container } = render(<DashboardSkeleton />);

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("has the correct number of placeholder cards", () => {
    const { container } = render(<DashboardSkeleton />);

    const placeholderCards = getDivsByClasses(container, [
      "bg-glass",
      "backdrop-blur-xl",
      "border",
      "border-glass-border",
      "rounded-2xl",
      "p-6",
      "space-y-4",
    ]);

    expect(placeholderCards).toHaveLength(4);
  });
});

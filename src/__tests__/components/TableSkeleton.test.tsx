import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import TableSkeleton from "@/components/skeletons/TableSkeleton";

const getDivsByClasses = (container: HTMLElement, classes: string[]) =>
  Array.from(container.querySelectorAll("div")).filter((element) =>
    classes.every((className) => element.classList.contains(className))
  );

describe("TableSkeleton", () => {
  it("renders without crashing", () => {
    const { container } = render(<TableSkeleton />);

    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders the correct number of skeleton rows", () => {
    const { container } = render(<TableSkeleton rows={3} showHeader={false} />);

    const skeletonRows = getDivsByClasses(container, [
      "grid",
      "gap-4",
      "px-4",
      "sm:px-6",
      "py-4",
    ]);

    expect(skeletonRows).toHaveLength(3);
  });

  it("has pulse animation classes", () => {
    const { container } = render(<TableSkeleton />);

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });
});

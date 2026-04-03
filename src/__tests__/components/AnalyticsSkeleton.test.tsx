import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import AnalyticsSkeleton from "@/components/skeletons/AnalyticsSkeleton";

const getDivsByClasses = (container: HTMLElement, classes: string[]) =>
  Array.from(container.querySelectorAll("div")).filter((element) =>
    classes.every((className) => element.classList.contains(className))
  );

describe("AnalyticsSkeleton", () => {
  it("renders without crashing", () => {
    const { container } = render(<AnalyticsSkeleton />);

    expect(container.firstChild).toBeInTheDocument();
  });

  it("contains chart placeholder areas", () => {
    const { container } = render(<AnalyticsSkeleton />);

    const sparklineAreas = getDivsByClasses(container, [
      "mt-8",
      "flex",
      "items-end",
      "gap-2",
      "h-10",
    ]);
    const groupedChartAreas = getDivsByClasses(container, [
      "flex",
      "items-end",
      "gap-3",
      "h-56",
      "pl-10",
    ]);

    expect(sparklineAreas).toHaveLength(1);
    expect(sparklineAreas[0].children).toHaveLength(18);
    expect(groupedChartAreas).toHaveLength(1);
    expect(groupedChartAreas[0].children).toHaveLength(7);
  });

  it("has pulse animation classes", () => {
    const { container } = render(<AnalyticsSkeleton />);

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });
});

import "@testing-library/jest-dom";
import { act, fireEvent, render, screen } from "@testing-library/react";
import TourSpotlight from "@/components/tour/TourSpotlight";
import type { TourStep } from "@/lib/tour";

// Stub RAF / scrollIntoView so the measure loop doesn't blow up in jsdom
beforeAll(() => {
  jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    cb(0);
    return 0;
  });
  jest.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  Element.prototype.scrollIntoView = jest.fn();
});

afterAll(() => {
  jest.restoreAllMocks();
});

/* ---------- helpers ---------- */

const baseStep: TourStep = {
  id: "test-step",
  targetSelector: "[data-tour='test-target']",
  oracleMessage: "Hello from Oracle",
  position: "bottom",
};

function advance(ms = 700) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

function renderWithTarget(
  overrides: Partial<
    Parameters<typeof TourSpotlight>[0] & { step?: Partial<TourStep> }
  > = {},
) {
  // Plant a target element for the spotlight to measure
  const target = document.createElement("div");
  target.setAttribute("data-tour", "test-target");
  target.getBoundingClientRect = () =>
    ({
      top: 100,
      left: 200,
      width: 150,
      height: 40,
      bottom: 140,
      right: 350,
      x: 200,
      y: 100,
      toJSON: () => {},
    }) as DOMRect;
  document.body.appendChild(target);

  const props = {
    step: { ...baseStep, ...(overrides.step ?? {}) },
    stepIndex: overrides.stepIndex ?? 0,
    totalSteps: overrides.totalSteps ?? 3,
    onNext: overrides.onNext ?? jest.fn(),
    onPrev: overrides.onPrev, // undefined by default (first step)
    onSkip: overrides.onSkip ?? jest.fn(),
  };

  const result = render(<TourSpotlight {...props} />);

  return { ...result, props, target };
}

afterEach(() => {
  // Clean up any target elements we injected
  document.querySelectorAll("[data-tour='test-target']").forEach((el) => el.remove());
  jest.clearAllTimers();
});

/* ---------- rendering ---------- */

describe("TourSpotlight", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("renders the Oracle message from the step", () => {
    renderWithTarget();
    advance();
    expect(screen.getByText("Hello from Oracle")).toBeInTheDocument();
  });

  it("renders The Oracle label", () => {
    renderWithTarget();
    advance();
    expect(screen.getByText("The Oracle")).toBeInTheDocument();
  });

  it("renders progress dots matching totalSteps", () => {
    const { container } = renderWithTarget({ totalSteps: 5, stepIndex: 2 });
    advance();
    // Each dot is a div inside the progress indicator area
    const dots = container.querySelectorAll(".h-1\\.5.rounded-full");
    expect(dots).toHaveLength(5);
  });

  it("highlights the active dot for the current step", () => {
    const { container } = renderWithTarget({ totalSteps: 4, stepIndex: 2 });
    advance();
    const dots = container.querySelectorAll(".h-1\\.5.rounded-full");
    // Active dot has w-4, others have w-1.5
    expect(dots[2]).toHaveClass("w-4");
    expect(dots[0]).toHaveClass("w-1.5");
    expect(dots[1]).toHaveClass("w-1.5");
    expect(dots[3]).toHaveClass("w-1.5");
  });

  it("shows 'Next' button when not on the last step", () => {
    renderWithTarget({ stepIndex: 0, totalSteps: 3 });
    advance();
    expect(screen.getByText("Next")).toBeInTheDocument();
  });

  it("shows 'Done' button on the last step", () => {
    renderWithTarget({ stepIndex: 2, totalSteps: 3 });
    advance();
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("renders a close (X) button with correct aria-label", () => {
    renderWithTarget();
    advance();
    expect(screen.getByRole("button", { name: "Close tour" })).toBeInTheDocument();
  });

  it("renders the Skip tour button", () => {
    renderWithTarget();
    advance();
    expect(screen.getByText("Skip tour")).toBeInTheDocument();
  });

  /* ---------- step progression ---------- */

  it("calls onNext when clicking the Next button", () => {
    const onNext = jest.fn();
    renderWithTarget({ onNext, stepIndex: 0, totalSteps: 3 });
    advance();
    fireEvent.click(screen.getByText("Next"));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("calls onNext when clicking Done on the last step", () => {
    const onNext = jest.fn();
    renderWithTarget({ onNext, stepIndex: 2, totalSteps: 3 });
    advance();
    fireEvent.click(screen.getByText("Done"));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("renders Previous button when onPrev is provided", () => {
    const onPrev = jest.fn();
    renderWithTarget({ onPrev, stepIndex: 1, totalSteps: 3 });
    advance();
    expect(
      screen.getByRole("button", { name: "Previous step" }),
    ).toBeInTheDocument();
  });

  it("calls onPrev when clicking Previous", () => {
    const onPrev = jest.fn();
    renderWithTarget({ onPrev, stepIndex: 1, totalSteps: 3 });
    advance();
    fireEvent.click(screen.getByRole("button", { name: "Previous step" }));
    expect(onPrev).toHaveBeenCalledTimes(1);
  });

  it("does not render Previous button when onPrev is undefined", () => {
    renderWithTarget({ onPrev: undefined, stepIndex: 0, totalSteps: 3 });
    advance();
    expect(
      screen.queryByRole("button", { name: "Previous step" }),
    ).not.toBeInTheDocument();
  });

  /* ---------- dismissal ---------- */

  it("calls onSkip when clicking Skip tour", () => {
    const onSkip = jest.fn();
    renderWithTarget({ onSkip });
    advance();
    fireEvent.click(screen.getByText("Skip tour"));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("calls onSkip when clicking the close X button", () => {
    const onSkip = jest.fn();
    renderWithTarget({ onSkip });
    advance();
    fireEvent.click(screen.getByRole("button", { name: "Close tour" }));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  /* ---------- spotlight measurement ---------- */

  it("scrolls target element into view", () => {
    const { target } = renderWithTarget();
    advance();
    expect(target.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
    });
  });

  it("renders the SVG overlay mask", () => {
    const { container } = renderWithTarget();
    advance();
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    const mask = container.querySelector("mask");
    expect(mask).toBeInTheDocument();
  });

  it("renders glow border when target is measured", () => {
    const { container } = renderWithTarget();
    advance();
    // The glow border is a positioned div with rounded-xl and shadow classes
    const glowDivs = container.querySelectorAll(".rounded-xl");
    // At least one glow div should exist after measurement
    const hasGlow = Array.from(glowDivs).some(
      (el) => el.classList.contains("border-2") && el.getAttribute("style"),
    );
    expect(hasGlow).toBe(true);
  });
});

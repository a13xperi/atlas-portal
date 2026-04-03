import "@testing-library/jest-dom";
import { act, fireEvent, render } from "@testing-library/react";
import RouteProgress from "@/components/ui/RouteProgress";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

import { usePathname } from "next/navigation";

const mockUsePathname = jest.mocked(usePathname);

describe("RouteProgress", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 0;
    });
    window.history.replaceState({}, "", "/dashboard");
    mockUsePathname.mockReturnValue("/dashboard");
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("renders nothing before a route transition starts", () => {
    const { container } = render(<RouteProgress />);

    expect(container.firstChild).toBeNull();
  });

  it("shows the loading bar during navigation and hides it after the pathname updates", () => {
    const { container, rerender } = render(
      <>
        <RouteProgress />
        <a href="/crafting">Go to crafting</a>
      </>
    );

    fireEvent.click(container.querySelector('a[href="/crafting"]') as HTMLAnchorElement);

    const activeBar = container.querySelector(".nprogress-bar") as HTMLDivElement | null;
    expect(activeBar).toBeInTheDocument();
    expect(activeBar).toHaveStyle({ opacity: "1", width: "72%" });

    mockUsePathname.mockReturnValue("/crafting");
    rerender(
      <>
        <RouteProgress />
        <a href="/crafting">Go to crafting</a>
      </>
    );

    const completingBar = container.querySelector(".nprogress-bar") as HTMLDivElement | null;
    expect(completingBar).toBeInTheDocument();
    expect(completingBar).toHaveStyle({ opacity: "1", width: "100%" });

    act(() => {
      jest.advanceTimersByTime(220);
    });

    expect(container.querySelector(".nprogress-bar")).not.toBeInTheDocument();
  });
});

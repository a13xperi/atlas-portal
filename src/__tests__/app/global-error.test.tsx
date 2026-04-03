import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import GlobalError from "@/app/global-error";

describe("GlobalError", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("shows the error message text and retry button", () => {
    const reset = jest.fn();

    render(<GlobalError error={new Error("Global boundary failed")} reset={reset} />);

    expect(screen.getByText("Global boundary failed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("calls reset when retry is clicked", () => {
    const reset = jest.fn();

    render(<GlobalError error={new Error("Retry me")} reset={reset} />);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("does not crash when the error message is undefined", () => {
    const reset = jest.fn();
    const error = { message: undefined } as unknown as Error & { digest?: string };

    expect(() => {
      render(<GlobalError error={error} reset={reset} />);
    }).not.toThrow();

    expect(screen.getByText("An unexpected error occurred.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});

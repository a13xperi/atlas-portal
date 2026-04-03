import "@testing-library/jest-dom";
import type { AnchorHTMLAttributes } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import RootError from "@/app/error";

jest.mock("next/link", () => {
  return function MockLink({
    children,
    href,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

describe("RootError", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("shows the error message text and retry button", () => {
    const reset = jest.fn();

    render(<RootError error={new Error("Root boundary failed")} reset={reset} />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Root boundary failed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("calls reset when retry is clicked", () => {
    const reset = jest.fn();

    render(<RootError error={new Error("Retry me")} reset={reset} />);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("does not crash when the error message is undefined", () => {
    const reset = jest.fn();
    const error = { message: undefined } as unknown as Error & { digest?: string };

    expect(() => {
      render(<RootError error={error} reset={reset} />);
    }).not.toThrow();

    expect(
      screen.getByText("An unexpected error occurred. Please try again.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});

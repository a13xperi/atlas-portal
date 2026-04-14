import React from "react";
import "@testing-library/jest-dom";
import { captureException } from "@sentry/nextjs";
import { render, screen } from "@testing-library/react";
import ErrorBoundary from "@/components/ErrorBoundary";

function ThrowError({ message = "Crafting exploded" }: { message?: string }): React.ReactNode {
  throw new Error(message);
}

describe("ErrorBoundary", () => {
  it("should render children when there is no error", () => {
    render(
      <ErrorBoundary>
        <p>Healthy child</p>
      </ErrorBoundary>
    );

    expect(screen.getByText("Healthy child")).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });

  it("should render fallback UI when a child throws", () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        extra: expect.objectContaining({
          componentStack: expect.any(String),
        }),
      }),
    );

    consoleErrorSpy.mockRestore();
  });

  it("should display the error message", () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError message="Unable to render analytics panel" />
      </ErrorBoundary>
    );

    expect(screen.getByText("Unable to render analytics panel")).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });
});

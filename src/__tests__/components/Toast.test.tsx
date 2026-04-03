import "@testing-library/jest-dom";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { ToastProvider, useToast } from "@/components/ui/Toast";

function ToastHarness() {
  const { toast } = useToast();

  return (
    <div>
      <button onClick={() => toast("Saved successfully")}>Show success</button>
      <button onClick={() => toast("Something failed", "error")}>Show error</button>
    </div>
  );
}

describe("Toast", () => {
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("renders a success toast from context", () => {
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Show success" }));

    const toast = screen.getByRole("status");
    expect(toast).toHaveTextContent("Saved successfully");
    expect(toast).toHaveClass("text-atlas-teal");
  });

  it("renders an error toast variant", () => {
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Show error" }));

    const toast = screen.getByRole("status");
    expect(toast).toHaveTextContent("Something failed");
    expect(toast).toHaveClass("text-atlas-error");
  });

  it("removes the toast after three seconds", () => {
    jest.useFakeTimers();

    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Show success" }));
    expect(screen.getByText("Saved successfully")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(screen.queryByText("Saved successfully")).not.toBeInTheDocument();
  });
});

import "@testing-library/jest-dom";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { useToast } from "@/hooks/useToast";

function ToastHarness() {
  const { dismiss, push } = useToast();

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          for (let index = 1; index <= 5; index += 1) {
            push({
              id: `toast-${index}`,
              title: `Toast ${index}`,
              kind: "info",
              description: `Description ${index}`,
            });
          }
        }}
      >
        Push five
      </button>
      <button
        type="button"
        onClick={() => {
          push({ id: "toast-1", title: "Toast 1", kind: "info", durationMs: 1000 });
          push({ id: "toast-2", title: "Toast 2", kind: "info", durationMs: 10000 });
          push({ id: "toast-3", title: "Toast 3", kind: "info", durationMs: 10000 });
          push({ id: "toast-4", title: "Toast 4", kind: "info", durationMs: 10000 });
          push({ id: "toast-5", title: "Toast 5", kind: "info", durationMs: 10000 });
        }}
      >
        Push expiring queue
      </button>
      <button
        type="button"
        onClick={() =>
          push({
            id: "default-toast",
            title: "Default duration toast",
            kind: "success",
          })
        }
      >
        Push default
      </button>
      <button type="button" onClick={() => dismiss("toast-2")}>
        Dismiss toast 2
      </button>
      <button type="button" onClick={() => dismiss("default-toast")}>
        Dismiss default
      </button>
    </div>
  );
}

describe("ToastProvider", () => {
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("shows only four visible toasts while keeping overflow queued", () => {
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Push five" }));

    expect(screen.getAllByRole("status")).toHaveLength(4);
    expect(screen.getByText("Toast 1")).toBeInTheDocument();
    expect(screen.getByText("Toast 4")).toBeInTheDocument();
    expect(screen.queryByText("Toast 5")).not.toBeInTheDocument();
  });

  it("reveals the next queued toast when one is dismissed by id", () => {
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Push five" }));
    fireEvent.click(screen.getByRole("button", { name: "Dismiss toast 2" }));

    expect(screen.queryByText("Toast 2")).not.toBeInTheDocument();
    expect(screen.getByText("Toast 5")).toBeInTheDocument();
    expect(screen.getAllByRole("status")).toHaveLength(4);
  });

  it("promotes queued toasts as visible ones expire", () => {
    jest.useFakeTimers();

    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Push expiring queue" }));

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.queryByText("Toast 1")).not.toBeInTheDocument();
    expect(screen.getByText("Toast 5")).toBeInTheDocument();
    expect(screen.getAllByRole("status")).toHaveLength(4);
  });

  it("uses a five second default timeout when duration is omitted", () => {
    jest.useFakeTimers();

    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Push default" }));

    act(() => {
      jest.advanceTimersByTime(4999);
    });

    expect(screen.getByText("Default duration toast")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(screen.queryByText("Default duration toast")).not.toBeInTheDocument();
  });
});

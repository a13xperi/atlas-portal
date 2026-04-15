import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { SchedulePopover } from "@/components/ui/SchedulePopover";

describe("SchedulePopover", () => {
  const baseTime = "2026-04-15T10:00:00.000Z";

  it("renders the datetime input and buttons", () => {
    render(
      <SchedulePopover
        initialAt={baseTime}
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
      />
    );

    expect(screen.getByLabelText("Schedule date and time")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
  });

  it("calls onCancel when Cancel is clicked", () => {
    const onCancel = jest.fn();
    render(
      <SchedulePopover
        initialAt={baseTime}
        onCancel={onCancel}
        onConfirm={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("calls onConfirm with ISO string when Confirm is clicked", () => {
    const onConfirm = jest.fn();
    render(
      <SchedulePopover
        initialAt={baseTime}
        onCancel={jest.fn()}
        onConfirm={onConfirm}
      />
    );

    fireEvent.change(screen.getByLabelText("Schedule date and time"), {
      target: { value: "2026-04-20T14:30" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    expect(onConfirm).toHaveBeenCalledWith(
      expect.stringMatching(/^2026-04-20T\d{2}:30:00\.000Z$/)
    );
  });

  it("calls onCancel when Escape is pressed", () => {
    const onCancel = jest.fn();
    render(
      <SchedulePopover
        initialAt={baseTime}
        onCancel={onCancel}
        onConfirm={jest.fn()}
      />
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onCancel).toHaveBeenCalled();
  });

  it("calls onCancel when clicking outside", () => {
    const onCancel = jest.fn();
    render(
      <div data-testid="outside">
        <SchedulePopover
          initialAt={baseTime}
          onCancel={onCancel}
          onConfirm={jest.fn()}
        />
      </div>
    );

    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(onCancel).toHaveBeenCalled();
  });

  it("shows loading state when busy", () => {
    render(
      <SchedulePopover
        initialAt={baseTime}
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
        busy
      />
    );

    expect(screen.getByRole("button", { name: "Saving..." })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
  });
});

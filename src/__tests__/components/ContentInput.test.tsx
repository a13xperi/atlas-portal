import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import ContentInput from "@/components/ui/ContentInput";

describe("ContentInput", () => {
  it("renders the input controls and quick actions", () => {
    render(<ContentInput />);

    expect(screen.getByText("Drop a report")).toBeInTheDocument();
    expect(screen.getByText("Paste a tweet idea")).toBeInTheDocument();
    expect(screen.getByText("Pick a trending alert")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Paste a tweet idea or link…")).toBeInTheDocument();
  });

  it("updates the text input and tracks the entered character count", () => {
    render(<ContentInput />);

    const input = screen.getByPlaceholderText(
      "Paste a tweet idea or link…"
    ) as HTMLTextAreaElement;
    const text = "BTC breaks resistance";

    fireEvent.change(input, { target: { value: text } });

    expect(input).toHaveValue(text);
    expect(input.value).toHaveLength(text.length);
    expect(input).toHaveAttribute("rows", "3");
  });

  it("supports a controlled value", () => {
    const handleTextChange = jest.fn();
    const { rerender } = render(
      <ContentInput value="Saved draft" onTextChange={handleTextChange} />
    );

    const input = screen.getByPlaceholderText(
      "Paste a tweet idea or link…"
    ) as HTMLTextAreaElement;

    expect(input).toHaveValue("Saved draft");

    fireEvent.change(input, { target: { value: "Updated draft" } });

    expect(handleTextChange).toHaveBeenCalledWith("Updated draft");

    rerender(
      <ContentInput value="Updated draft" onTextChange={handleTextChange} />
    );

    expect(input).toHaveValue("Updated draft");
  });

  it("submits the entered text on Enter and clears the input", () => {
    const handleTextSubmit = jest.fn();

    render(<ContentInput onTextSubmit={handleTextSubmit} />);

    const input = screen.getByPlaceholderText(
      "Paste a tweet idea or link…"
    ) as HTMLTextAreaElement;
    const text = "Macro tailwinds for ETH";

    fireEvent.change(input, { target: { value: text } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter", charCode: 13 });

    expect(handleTextSubmit).toHaveBeenCalledTimes(1);
    expect(handleTextSubmit).toHaveBeenCalledWith(text);
    expect(input).toHaveValue("");
  });

  it("keeps the entered text when submission returns false", () => {
    const handleTextSubmit = jest.fn(() => false);

    render(<ContentInput onTextSubmit={handleTextSubmit} />);

    const input = screen.getByPlaceholderText(
      "Paste a tweet idea or link…"
    ) as HTMLTextAreaElement;
    const text = "Keep this draft";

    fireEvent.change(input, { target: { value: text } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter", charCode: 13 });

    expect(handleTextSubmit).toHaveBeenCalledWith(text);
    expect(input).toHaveValue(text);
  });

  it("does not submit on Shift+Enter", () => {
    const handleTextSubmit = jest.fn();

    render(<ContentInput onTextSubmit={handleTextSubmit} />);

    const input = screen.getByPlaceholderText(
      "Paste a tweet idea or link…"
    ) as HTMLTextAreaElement;
    const text = "Keep writing";

    fireEvent.change(input, { target: { value: text } });
    fireEvent.keyDown(input, {
      key: "Enter",
      code: "Enter",
      charCode: 13,
      shiftKey: true,
    });

    expect(handleTextSubmit).not.toHaveBeenCalled();
    expect(input).toHaveValue(text);
  });
});

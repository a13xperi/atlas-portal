import "@testing-library/jest-dom";
import { act, fireEvent, render, screen } from "@testing-library/react";
import VoicePreviewPlayer from "@/components/voice-profiles/VoicePreviewPlayer";

describe("VoicePreviewPlayer", () => {
  let mockSpeak: jest.Mock;
  let mockCancel: jest.Mock;
  let mockPause: jest.Mock;
  let mockResume: jest.Mock;
  let mockGetVoices: jest.Mock;
  let mockAddEventListener: jest.Mock;
  let mockRemoveEventListener: jest.Mock;

  beforeEach(() => {
    mockSpeak = jest.fn();
    mockCancel = jest.fn();
    mockPause = jest.fn();
    mockResume = jest.fn();
    mockGetVoices = jest.fn().mockReturnValue([
      { lang: "en-US", name: "English" },
    ]);
    mockAddEventListener = jest.fn();
    mockRemoveEventListener = jest.fn();

    Object.defineProperty(window, "speechSynthesis", {
      writable: true,
      value: {
        speak: mockSpeak,
        cancel: mockCancel,
        pause: mockPause,
        resume: mockResume,
        getVoices: mockGetVoices,
        paused: false,
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
      },
    });

    window.SpeechSynthesisUtterance = jest
      .fn()
      .mockImplementation((text: string) => ({
        text,
        rate: 1,
        pitch: 1,
        voice: null,
        onstart: null,
        onend: null,
        onerror: null,
      })) as unknown as typeof SpeechSynthesisUtterance;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the play button when speech synthesis is supported", () => {
    render(<VoicePreviewPlayer text="Hello world" />);
    expect(
      screen.getByRole("button", { name: /play preview/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Listen")).toBeInTheDocument();
  });

  it("shows a disabled-looking state when speech synthesis is not supported", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).speechSynthesis = undefined;
    render(<VoicePreviewPlayer text="Hello world" />);
    expect(screen.getByText("Listen")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("starts speaking when the play button is clicked", async () => {
    render(<VoicePreviewPlayer text="Hello world" />);
    fireEvent.click(screen.getByRole("button", { name: /play preview/i }));

    expect(mockCancel).toHaveBeenCalled();
    expect(mockSpeak).toHaveBeenCalled();

    const utterance = mockSpeak.mock.calls[0][0];
    await act(async () => {
      utterance.onstart();
    });

    expect(
      screen.getByRole("button", { name: /pause preview/i })
    ).toBeInTheDocument();
  });

  it("pauses playback when clicked while playing", async () => {
    render(<VoicePreviewPlayer text="Hello world" />);
    fireEvent.click(screen.getByRole("button", { name: /play preview/i }));

    const utterance = mockSpeak.mock.calls[0][0];
    await act(async () => {
      utterance.onstart();
    });

    fireEvent.click(screen.getByRole("button", { name: /pause preview/i }));
    expect(mockPause).toHaveBeenCalled();
    expect(screen.getByText("Paused")).toBeInTheDocument();
  });

  it("resumes playback when clicked while paused", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.speechSynthesis as any).paused = true;

    render(<VoicePreviewPlayer text="Hello world" />);
    fireEvent.click(screen.getByRole("button", { name: /play preview/i }));

    const utterance = mockSpeak.mock.calls[0][0];
    await act(async () => {
      utterance.onstart();
    });

    fireEvent.click(screen.getByRole("button", { name: /pause preview/i }));
    expect(mockPause).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /play preview/i }));
    expect(mockResume).toHaveBeenCalled();
  });

  it("stops playback when the stop button is clicked", async () => {
    render(<VoicePreviewPlayer text="Hello world" />);
    fireEvent.click(screen.getByRole("button", { name: /play preview/i }));

    const utterance = mockSpeak.mock.calls[0][0];
    await act(async () => {
      utterance.onstart();
    });

    fireEvent.click(screen.getByRole("button", { name: /stop preview/i }));
    expect(mockCancel).toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: /play preview/i })
    ).toBeInTheDocument();
  });

  it("cancels speech when the text changes", () => {
    const { rerender } = render(<VoicePreviewPlayer text="Hello world" />);
    fireEvent.click(screen.getByRole("button", { name: /play preview/i }));

    rerender(<VoicePreviewPlayer text="Goodbye world" />);
    // cancel is called on play + when the text effect cleans up + initial strict-mode cleanup
    expect(mockCancel).toHaveBeenCalledTimes(3);
  });

  it("cancels speech on unmount", () => {
    const { unmount } = render(<VoicePreviewPlayer text="Hello world" />);
    fireEvent.click(screen.getByRole("button", { name: /play preview/i }));
    unmount();
    // cancel is called on play + unmount cleanup from both effects + strict-mode cleanup
    expect(mockCancel).toHaveBeenCalledTimes(3);
  });
});

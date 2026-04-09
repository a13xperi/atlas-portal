import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TourProvider, useTour } from "@/components/tour/TourProvider";

const mockSetDemoModeQuiet = jest.fn();

jest.mock("@/lib/demo-mode", () => ({
  useDemoMode: () => ({
    isDemoMode: false,
    setDemoModeQuiet: mockSetDemoModeQuiet,
  }),
}));

jest.mock("@/components/tour/TourSpotlight", () => ({
  __esModule: true,
  default: ({
    step,
    onSkip,
  }: {
    step: { id: string };
    onSkip: () => void;
  }) => (
    <div>
      <p>Spotlight: {step.id}</p>
      <button type="button" onClick={onSkip}>
        Skip tour
      </button>
    </div>
  ),
}));

function VoiceProfilesFixture() {
  const { active } = useTour("voice-profiles");

  return (
    <div>
      <div data-tour="voice-library">Voice library</div>
      <div data-tour="tweet-tinder">Tweet Tinder</div>
      <div data-tour="reference-voices">Reference voices</div>
      <p>{active ? "Tour active" : "Tour inactive"}</p>
    </div>
  );
}

describe("TourProvider", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("stores atlas_tour_<page> when the page tour is dismissed", async () => {
    render(
      <TourProvider>
        <VoiceProfilesFixture />
      </TourProvider>,
    );

    await act(async () => {
      jest.advanceTimersByTime(1200);
    });

    await waitFor(() => {
      expect(screen.getByText("Tour active")).toBeInTheDocument();
      expect(screen.getByText("Spotlight: voice-library")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Skip tour" }));

    await waitFor(() => {
      expect(localStorage.getItem("atlas_tour_voice-profiles")).toBe("true");
      expect(screen.getByText("Tour inactive")).toBeInTheDocument();
    });
  });

  it("does not auto-trigger a dismissed tour again", async () => {
    localStorage.setItem("atlas_tour_voice-profiles", "true");

    render(
      <TourProvider>
        <VoiceProfilesFixture />
      </TourProvider>,
    );

    await act(async () => {
      jest.advanceTimersByTime(4000);
    });

    expect(screen.getByText("Tour inactive")).toBeInTheDocument();
    expect(screen.queryByText("Spotlight: voice-library")).not.toBeInTheDocument();
  });
});

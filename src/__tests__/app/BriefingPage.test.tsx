import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockApi = {
  briefing: {
    getPreferences: jest.fn(),
    updatePreferences: jest.fn(),
  },
};

jest.mock("@/lib/api", () => ({
  api: mockApi,
}));

const BriefingPage = require("@/app/briefing/page").default;

describe("BriefingPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.briefing.getPreferences.mockResolvedValue({
      preference: {
        deliveryTime: "07:30",
        topics: ["Macro"],
        sources: ["Delphi Research"],
        channel: "Portal + Telegram",
      },
    });
    mockApi.briefing.updatePreferences.mockResolvedValue({
      preference: {
        deliveryTime: "07:30",
        topics: ["Macro", "AI & Crypto"],
        sources: ["Delphi Research", "X/Twitter"],
        channel: "Portal + Email",
      },
    });
  });

  it("loads saved preferences and persists updates", async () => {
    const user = userEvent.setup();

    render(<BriefingPage />);

    expect(
      screen.getByText("Configure Your Daily Digest")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Configure your daily morning briefing. We'll prepare a personalized crypto intelligence digest every morning."
      )
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByLabelText("Daily delivery time")).toHaveValue("07:30");
    });

    const initialTopicCheckbox = screen.getByRole("checkbox", {
      name: "Macro",
    });
    const topicCheckbox = screen.getByRole("checkbox", {
      name: "AI & Crypto",
    });
    const initialSourceCheckbox = screen.getByRole("checkbox", {
      name: "Delphi Research",
    });
    const sourceCheckbox = screen.getByRole("checkbox", {
      name: "X/Twitter",
    });
    const initialChannelRadio = screen.getByRole("radio", {
      name: "Portal + Telegram",
    });
    const channelRadio = screen.getByRole("radio", {
      name: "Portal + Email",
    });

    expect(initialTopicCheckbox).toBeChecked();
    expect(initialSourceCheckbox).toBeChecked();
    expect(initialChannelRadio).toBeChecked();

    await user.click(topicCheckbox);
    await user.click(sourceCheckbox);
    await user.click(channelRadio);
    await user.click(
      screen.getByRole("button", { name: "Save briefing preferences" })
    );

    expect(topicCheckbox).toBeChecked();
    expect(sourceCheckbox).toBeChecked();
    expect(channelRadio).toBeChecked();
    expect(mockApi.briefing.getPreferences).toHaveBeenCalledTimes(1);
    expect(mockApi.briefing.updatePreferences).toHaveBeenCalledWith({
      deliveryTime: "07:30",
      topics: ["Macro", "AI & Crypto"],
      sources: ["Delphi Research", "X/Twitter"],
      channel: "Portal + Email",
    });
    expect(
      await screen.findByText("Preferences saved locally for this session.")
    ).toBeInTheDocument();
  });
});

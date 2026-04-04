import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@/components/layout/AppShell", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

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

    const initialTopicChip = screen.getByRole("button", {
      name: "Macro",
    });
    const topicChip = screen.getByRole("button", {
      name: "AI & Crypto",
    });
    const initialSourceChip = screen.getByRole("button", {
      name: "Delphi Research",
    });
    const sourceChip = screen.getByRole("button", {
      name: "X/Twitter",
    });
    const initialChannelChip = screen.getByRole("radio", {
      name: "Portal + Telegram",
    });
    const channelChip = screen.getByRole("radio", {
      name: "Portal + Email",
    });

    expect(initialTopicChip).toHaveAttribute("aria-pressed", "true");
    expect(initialSourceChip).toHaveAttribute("aria-pressed", "true");
    expect(initialChannelChip).toHaveAttribute("aria-checked", "true");

    await user.click(topicChip);
    await user.click(sourceChip);
    await user.click(channelChip);
    await user.click(
      screen.getByRole("button", { name: "Save briefing preferences" })
    );

    expect(topicChip).toHaveAttribute("aria-pressed", "true");
    expect(sourceChip).toHaveAttribute("aria-pressed", "true");
    expect(channelChip).toHaveAttribute("aria-checked", "true");
    expect(mockApi.briefing.getPreferences).toHaveBeenCalledTimes(1);
    expect(mockApi.briefing.updatePreferences).toHaveBeenCalledWith({
      deliveryTime: "07:30",
      topics: ["Macro", "AI & Crypto"],
      sources: ["Delphi Research", "X/Twitter"],
      channel: "Portal + Email",
    });
    expect(
      await screen.findByText("Preferences saved.")
    ).toBeInTheDocument();
  });
});

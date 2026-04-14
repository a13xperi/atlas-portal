import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import TelegramSetupWizard from "@/components/telegram/TelegramSetupWizard";

const mockPush = jest.fn();
const clipboardWriteText = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });
Object.defineProperty(window.navigator, "clipboard", {
  value: {
    writeText: clipboardWriteText,
  },
  configurable: true,
});

describe("TelegramSetupWizard", () => {
  beforeEach(() => {
    mockPush.mockReset();
    clipboardWriteText.mockReset();
    localStorageMock.clear();
  });

  it("moves from the intro step to the connect step", () => {
    render(<TelegramSetupWizard handle="atlasalpha" isConnected={false} />);

    expect(
      screen.getByText(/atlas can send you briefings \+ alerts via telegram/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(
      screen.getByRole("heading", {
        name: /open the bot and pair your atlas handle/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/send \/start/i)).toBeInTheDocument();
  });

  it("copies the pairing code on the connect step", async () => {
    render(<TelegramSetupWizard handle="atlasalpha" isConnected={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: /copy code/i }));

    await waitFor(() =>
      expect(clipboardWriteText).toHaveBeenCalledWith("atlasalpha"),
    );
    expect(
      screen.getByRole("button", { name: /copied/i }),
    ).toBeInTheDocument();
  });

  it("hydrates saved preferences from localStorage", () => {
    window.localStorage.setItem(
      "atlas_telegram_prefs",
      JSON.stringify({
        daily_briefing: false,
        price_alerts: true,
        mention_alerts: true,
      }),
    );

    render(<TelegramSetupWizard handle="atlasalpha" isConnected={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(
      screen.getByRole("button", { name: /i've opened the bot/i }),
    );

    expect(
      screen.getByRole("switch", { name: /daily briefing/i }),
    ).toHaveAttribute("aria-checked", "false");
    expect(
      screen.getByRole("switch", { name: /mention alerts/i }),
    ).toHaveAttribute("aria-checked", "true");
  });

  it("persists preferences to localStorage and redirects on finish", async () => {
    render(
      <TelegramSetupWizard
        handle="atlasalpha"
        isConnected={false}
        completionHref="/dashboard"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(
      screen.getByRole("button", { name: /i've opened the bot/i }),
    );
    fireEvent.click(screen.getByRole("switch", { name: /mention alerts/i }));
    fireEvent.click(screen.getByRole("button", { name: /finish/i }));

    await waitFor(() =>
      expect(window.localStorage.getItem("atlas_telegram_prefs")).toBe(
        JSON.stringify({
          daily_briefing: true,
          price_alerts: true,
          mention_alerts: true,
        }),
      ),
    );
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });
});

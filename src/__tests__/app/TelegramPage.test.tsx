import "@testing-library/jest-dom";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import TelegramPage from "@/app/telegram/page";

jest.mock("@/components/layout/AppShell", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe("TelegramPage", () => {
  it("renders the telegram setup guide", () => {
    render(<TelegramPage />);

    expect(
      screen.getByRole("heading", { name: /telegram integration/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/get atlas alerts delivered to your telegram/i)
    ).toBeInTheDocument();
  });

  it("shows the setup steps", () => {
    render(<TelegramPage />);

    expect(screen.getByText("Open Telegram")).toBeInTheDocument();
    expect(screen.getByText("Find Our Bot")).toBeInTheDocument();
    expect(screen.getByText("Start the Connection")).toBeInTheDocument();
  });
});

import "@testing-library/jest-dom";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import TelegramPage from "@/app/telegram/page";

jest.mock("@/components/layout/AppShell", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/lib/auth", () => ({
  useAuth: () => ({ user: { handle: "demo-analyst", telegramChatId: null } }),
}));

jest.mock("@/components/ui/GlassCard", () => ({
  __esModule: true,
  default: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

jest.mock("@/components/ui/GradientButton", () => ({
  __esModule: true,
  default: ({ children, ...props }: { children: ReactNode; [key: string]: unknown }) => (
    <button {...props}>{children}</button>
  ),
}));

describe("TelegramPage", () => {
  it("renders the telegram setup guide", () => {
    render(<TelegramPage />);

    expect(
      screen.getByRole("heading", { name: /connect telegram/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/get atlas alerts delivered straight to telegram/i)
    ).toBeInTheDocument();
  });

  it("shows the setup steps when not linked", () => {
    render(<TelegramPage />);

    expect(screen.getByText("Open the bot")).toBeInTheDocument();
    expect(screen.getByText("Link your account")).toBeInTheDocument();
    expect(screen.getByText("Enable Telegram delivery")).toBeInTheDocument();
    expect(screen.getByText(/\/link demo-analyst/)).toBeInTheDocument();
  });
});

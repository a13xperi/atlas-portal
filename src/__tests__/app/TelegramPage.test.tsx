import "@testing-library/jest-dom";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import TelegramPage from "@/app/telegram/page";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock("@/components/ui/FeatureGate", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/components/layout/AppShell", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/lib/auth", () => ({
  useAuth: jest.fn(() => ({
    user: { handle: "atlasalpha", telegramChatId: null },
  })),
}));

describe("TelegramPage", () => {
  it("renders the telegram setup wizard", () => {
    render(<TelegramPage />);

    expect(
      screen.getByRole("heading", { name: /telegram integration/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/atlas can send you briefings \+ alerts via telegram/i)
    ).toBeInTheDocument();
  });

  it("starts on the intro step", () => {
    render(<TelegramPage />);

    expect(
      screen.getByRole("heading", {
        name: /telegram, with less setup friction/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
  });
});

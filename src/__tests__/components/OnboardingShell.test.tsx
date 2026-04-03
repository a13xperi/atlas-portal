import "@testing-library/jest-dom";
import type { AnchorHTMLAttributes } from "react";
import { render, screen } from "@testing-library/react";
import OnboardingShell from "@/components/layout/OnboardingShell";

const mockUsePathname = jest.fn();
const mockUseAuth = jest.fn();
const mockUseAlertSocket = jest.fn();
const mockUseCommandPalette = jest.fn();

jest.mock("next/link", () => {
  return function MockLink({
    children,
    href,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

jest.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

jest.mock("@/lib/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("@/lib/alertSocket", () => ({
  useAlertSocket: () => mockUseAlertSocket(),
}));

jest.mock("@/components/ui/CommandPalette", () => ({
  useCommandPalette: () => mockUseCommandPalette(),
}));

describe("OnboardingShell", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/dashboard");
    mockUseAuth.mockReturnValue({
      user: { id: "1", handle: "test", role: "ANALYST" },
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    });
    mockUseAlertSocket.mockReturnValue({
      connected: false,
      unreadCount: 0,
      latestAlert: null,
      clearUnread: jest.fn(),
      onNewAlert: jest.fn(() => jest.fn()),
    });
    mockUseCommandPalette.mockReturnValue({
      open: jest.fn(),
      close: jest.fn(),
    });
  });

  it("should render children inside the layout", () => {
    render(
      <OnboardingShell>
        <p>Choose your track</p>
      </OnboardingShell>
    );

    const content = screen.getByText("Choose your track");

    expect(content).toBeInTheDocument();
    expect(content.closest(".glass-card")).toBeInTheDocument();
  });

  it("should render the shell container", () => {
    const { container } = render(
      <OnboardingShell>
        <p>Choose your track</p>
      </OnboardingShell>
    );

    expect(container.firstElementChild).toHaveClass("min-h-screen");
    expect(container.firstElementChild).toHaveClass("bg-gradient-to-b");
    expect(screen.getByRole("main")).toBeInTheDocument();
  });
});

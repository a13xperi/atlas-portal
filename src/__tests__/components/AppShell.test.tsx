import "@testing-library/jest-dom";
import type { AnchorHTMLAttributes } from "react";
import { render, screen } from "@testing-library/react";
import AppShell from "@/components/layout/AppShell";

const mockReplace = jest.fn();
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
  useRouter: () => ({ replace: mockReplace }),
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

describe("AppShell", () => {
  beforeEach(() => {
    mockReplace.mockReset();
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

  it("should render children", () => {
    render(
      <AppShell>
        <p>Dashboard metrics</p>
      </AppShell>
    );

    expect(screen.getByText("Dashboard metrics")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("should include the NavBar component", () => {
    render(
      <AppShell>
        <p>Dashboard metrics</p>
      </AppShell>
    );

    expect(
      screen.getByRole("navigation", { name: "Main navigation" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
  });
});

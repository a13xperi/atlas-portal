import "@testing-library/jest-dom";
import type { AnchorHTMLAttributes } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import NavBar from "@/components/ui/NavBar";

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
  usePathname: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/lib/alertSocket", () => ({
  useAlertSocket: jest.fn(),
}));

jest.mock("@/components/ui/CommandPalette", () => ({
  useCommandPalette: jest.fn(),
}));

import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useAlertSocket } from "@/lib/alertSocket";
import { useCommandPalette } from "@/components/ui/CommandPalette";

const mockUsePathname = jest.mocked(usePathname);
const mockUseAuth = jest.mocked(useAuth);
const mockUseAlertSocket = jest.mocked(useAlertSocket);
const mockUseCommandPalette = jest.mocked(useCommandPalette);

describe("NavBar", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/crafting");
    mockUseAuth.mockReturnValue({
      user: {
        id: "user-1",
        handle: "atlas",
        role: "ANALYST",
      },
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    });
    mockUseAlertSocket.mockReturnValue({
      connected: true,
      unreadCount: 2,
      latestAlert: null,
      clearUnread: jest.fn(),
      onNewAlert: jest.fn(() => jest.fn()),
    });
    mockUseCommandPalette.mockReturnValue({
      open: jest.fn(),
      close: jest.fn(),
    });
  });

  it("announces the main navigation landmark and current page", () => {
    render(<NavBar variant="app" />);

    expect(
      screen.getByRole("navigation", { name: "Main navigation" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Crafting" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute(
      "aria-current"
    );
  });

  it("toggles the mobile sidebar navigation from the hamburger button", () => {
    render(<NavBar variant="app" />);

    expect(
      screen.queryByRole("navigation", { name: "Mobile navigation" })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open sidebar" }));

    expect(
      screen.getByRole("navigation", { name: "Mobile navigation" })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close sidebar" }));

    expect(
      screen.queryByRole("navigation", { name: "Mobile navigation" })
    ).not.toBeInTheDocument();
  });
});

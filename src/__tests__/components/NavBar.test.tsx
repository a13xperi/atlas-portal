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
      unreadNotifications: 2,
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
    // Core 4 tabs: Crafting, Voices, Library, Arena
    expect(screen.getByRole("link", { name: "Voices" })).not.toHaveAttribute(
      "aria-current"
    );
    expect(screen.getByRole("link", { name: "Library" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Arena" })).toBeInTheDocument();
    // Hidden tabs should not appear in nav
    expect(screen.queryByRole("link", { name: "Dashboard" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Feed" })).not.toBeInTheDocument();
  });

  it("hides Analytics and Signals tabs for ANALYST role", () => {
    render(<NavBar variant="app" />);

    expect(screen.queryByRole("link", { name: "Analytics" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Signals" })).not.toBeInTheDocument();
    // Core tabs still visible
    expect(screen.getByRole("link", { name: "Crafting" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voices" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Library" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Arena" })).toBeInTheDocument();
  });

  it("shows Analytics and Signals tabs for MANAGER role", () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: "user-1",
        handle: "atlas",
        role: "MANAGER",
      },
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    });

    render(<NavBar variant="app" />);

    expect(screen.getByRole("link", { name: "Analytics" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Signals" })).toBeInTheDocument();
  });

  it("shows Analytics and Signals tabs for ADMIN role", () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: "user-1",
        handle: "atlas",
        role: "ADMIN",
      },
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    });

    render(<NavBar variant="app" />);

    expect(screen.getByRole("link", { name: "Analytics" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Signals" })).toBeInTheDocument();
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

  it("hides auth-only controls when no user is authenticated", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    });

    const { container } = render(<NavBar variant="onboarding" />);

    expect(screen.getByRole("link", { name: "Atlas" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Notifications" })).not.toBeInTheDocument();
    expect(container.querySelector('a[href="/profile"]')).not.toBeInTheDocument();
  });

  it("hides the mobile menu button when no user is authenticated", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    });

    render(<NavBar variant="app" />);

    expect(
      screen.queryByRole("button", { name: "Open sidebar" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "Mobile navigation" })
    ).not.toBeInTheDocument();
  });
});

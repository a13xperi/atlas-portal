"use client";

import { useEffect, useState } from "react";
import { Search, Bell, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useAlertSocket } from "@/lib/alertSocket";
import { useCommandPalette } from "@/components/ui/CommandPalette";

export interface NavBarProps {
  variant: "app" | "onboarding";
}

const navLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Crafting", href: "/crafting" },
  { label: "Voice", href: "/voice-profiles" },
  { label: "Analytics", href: "/analytics" },
  { label: "Library", href: "/team-library" },
  { label: "Team", href: "/management" },
];

function DelphiLogo() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      className="text-atlas-teal"
    >
      <circle
        cx="14"
        cy="14"
        r="12"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <ellipse
        cx="14"
        cy="14"
        rx="6"
        ry="12"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <line
        x1="2"
        y1="14"
        x2="26"
        y2="14"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export default function NavBar({ variant }: NavBarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { unreadCount } = useAlertSocket();
  const { open: openPalette } = useCommandPalette();
  const hasUser = Boolean(user);
  const initial = user?.handle?.[0]?.toUpperCase() || user?.displayName?.[0]?.toUpperCase() || "A";
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!hasUser) {
      setMobileOpen(false);
    }
  }, [hasUser]);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileOpen]);

  return (
    <nav aria-label="Main navigation" className="fixed top-0 left-0 right-0 z-50 bg-atlas-nav border-b border-glass-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <DelphiLogo />
            <span className="text-atlas-text font-semibold text-sm">Atlas</span>
          </Link>
          {variant === "app" && (
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={pathname === link.href ? "page" : undefined}
                  className={`text-xs transition-colors ${
                    pathname === link.href
                      ? "text-atlas-text font-medium"
                      : "text-atlas-text-secondary hover:text-atlas-text"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          {variant === "app" && (
            <button
              type="button"
              onClick={openPalette}
              aria-label="Open command palette (⌘K)"
              className="hidden sm:flex items-center gap-1.5 text-atlas-text-secondary hover:text-atlas-text transition-colors group"
            >
              <Search className="w-5 h-5" />
              <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded border border-glass-border text-[10px] font-mono text-atlas-text-muted group-hover:border-atlas-text-secondary transition-colors">
                ⌘K
              </kbd>
            </button>
          )}
          {user && (
            <>
              <Link
                href="/alerts"
                className={`relative transition-colors ${
                  pathname === "/alerts"
                    ? "text-atlas-teal"
                    : "text-atlas-text-secondary hover:text-atlas-text"
                }`}
                aria-label="Alerts"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex min-w-[16px] items-center justify-center rounded-full bg-atlas-error px-1 text-[10px] font-bold leading-none text-atlas-bg h-4">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
              <Link
                href="/profile"
                aria-label="Profile"
                className={`w-8 h-8 rounded-full bg-atlas-surface border flex items-center justify-center text-xs transition-colors ${
                  pathname === "/profile"
                    ? "border-atlas-teal text-atlas-teal"
                    : "border-glass-border text-atlas-text-secondary hover:border-atlas-text-secondary"
                }`}
              >
                {initial}
              </Link>
            </>
          )}
          {variant === "app" && user && (
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-atlas-text-secondary hover:text-atlas-text transition-colors p-1"
              aria-controls="mobile-sidebar"
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? "Close sidebar" : "Open sidebar"}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {variant === "app" && user ? (
        <div className={`md:hidden ${mobileOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
          <button
            type="button"
            aria-label="Close sidebar overlay"
            onClick={() => setMobileOpen(false)}
            className={`fixed inset-0 top-14 z-40 bg-atlas-bg/60 backdrop-blur-sm transition-opacity ${
              mobileOpen ? "opacity-100" : "opacity-0"
            }`}
          />
          <aside
            id="mobile-sidebar"
            role="navigation"
            aria-label="Mobile navigation"
            aria-hidden={!mobileOpen}
            className={`fixed inset-y-14 left-0 z-50 w-72 max-w-[calc(100vw-1rem)] overflow-y-auto border-r border-glass-border bg-atlas-nav px-4 py-4 transition-transform duration-200 ${
              mobileOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={pathname === link.href ? "page" : undefined}
                  className={`block rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    pathname === link.href
                      ? "bg-atlas-surface font-medium text-atlas-text"
                      : "text-atlas-text-secondary hover:bg-atlas-surface hover:text-atlas-text"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                openPalette();
              }}
              className="mt-3 block w-full rounded-lg px-3 py-2.5 text-left text-sm text-atlas-text-secondary transition-colors hover:bg-atlas-surface hover:text-atlas-text sm:hidden"
            >
              Search (⌘K)
            </button>
          </aside>
        </div>
      ) : null}
    </nav>
  );
}

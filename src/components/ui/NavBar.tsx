"use client";

import { useState } from "react";
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
  const initial = user?.handle?.[0]?.toUpperCase() || user?.displayName?.[0]?.toUpperCase() || "A";
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      aria-label="Main navigation"
      className="fixed top-0 left-0 right-0 z-50 bg-atlas-nav border-b border-glass-border"
    >
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
          <Link
            href="/alerts"
            className={`relative transition-colors ${
              pathname === "/alerts"
                ? "text-atlas-teal"
                : "text-atlas-text-secondary hover:text-atlas-text"
            }`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
          <Link
            href="/profile"
            className={`w-8 h-8 rounded-full bg-atlas-surface border flex items-center justify-center text-xs transition-colors ${
              pathname === "/profile"
                ? "border-atlas-teal text-atlas-teal"
                : "border-glass-border text-atlas-text-secondary hover:border-atlas-text-secondary"
            }`}
          >
            {initial}
          </Link>
          {variant === "app" && (
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-atlas-text-secondary hover:text-atlas-text transition-colors p-1"
              aria-label={mobileOpen ? "Close sidebar" : "Open sidebar"}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {variant === "app" && mobileOpen && (
        <div
          role="navigation"
          aria-label="Mobile navigation"
          className="md:hidden bg-atlas-nav border-t border-glass-border px-4 py-3 space-y-1"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              onClick={() => setMobileOpen(false)}
              className={`block py-2.5 px-3 rounded-lg text-sm transition-colors ${
                pathname === link.href
                  ? "text-atlas-text bg-atlas-surface font-medium"
                  : "text-atlas-text-secondary hover:text-atlas-text hover:bg-atlas-surface"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => { setMobileOpen(false); openPalette(); }}
            className="block w-full text-left py-2.5 px-3 rounded-lg text-sm text-atlas-text-secondary hover:text-atlas-text hover:bg-atlas-surface sm:hidden"
          >
            Search (⌘K)
          </button>
        </div>
      )}
    </nav>
  );
}

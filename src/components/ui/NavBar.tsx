"use client";

import { Search, Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavBarProps {
  variant: "app" | "onboarding";
}

const navLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Crafting", href: "/crafting" },
  { label: "Library", href: "/team-library" },
  { label: "Analytics", href: "/analytics" },
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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-atlas-nav border-b border-glass-border">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
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
            <Link
              href="/search"
              className={`hidden sm:block transition-colors ${
                pathname === "/search"
                  ? "text-atlas-teal"
                  : "text-atlas-text-secondary hover:text-atlas-text"
              }`}
            >
              <Search className="w-5 h-5" />
            </Link>
          )}
          <Link
            href="/alerts"
            className={`transition-colors ${
              pathname === "/alerts"
                ? "text-atlas-teal"
                : "text-atlas-text-secondary hover:text-atlas-text"
            }`}
          >
            <Bell className="w-5 h-5" />
          </Link>
          <Link
            href="/profile"
            className={`w-8 h-8 rounded-full bg-atlas-surface border flex items-center justify-center text-xs transition-colors ${
              pathname === "/profile"
                ? "border-atlas-teal text-atlas-teal"
                : "border-glass-border text-atlas-text-secondary hover:border-atlas-text-secondary"
            }`}
          >
            A
          </Link>
        </div>
      </div>
    </nav>
  );
}

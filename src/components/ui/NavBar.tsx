"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Bell,
  Menu,
  X,
  Settings,
  LayoutDashboard,
  PenTool,
  Mic2,
  BarChart3,
  Newspaper,
  Zap,
  BookOpen,
  Users,
  Trophy,
  CalendarClock,
  Rss,
  ListOrdered,
  User,
  LogOut,
  MessageSquare,
  Shield,
  Bug,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationDropdown from "@/components/ui/NotificationDropdown";

import DemoModeToggle from "@/components/ui/DemoModeToggle";
import TourToggle from "@/components/tour/TourToggle";
import { useAuth } from "@/lib/auth";
import { useAlertSocket } from "@/lib/alertSocket";
import { useCommandPalette } from "@/components/ui/CommandPalette";
import { getCachedTier } from "@/lib/arena-tier-cache";
import { useNavDiscovery } from "@/lib/discovery";
import NavDiscoveryDot from "@/components/tour/NavDiscoveryDot";
import { useRouteEnabled } from "@/lib/feature-flags";

export interface NavBarProps {
  variant: "app" | "onboarding";
}

export const navLinks = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Crafting", href: "/crafting", icon: PenTool },
  { label: "Voices", href: "/voice-profiles", icon: Mic2 },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Signals", href: "/alerts", icon: Zap },
  { label: "Library", href: "/team-library", icon: BookOpen },
  { label: "Arena", href: "/arena", icon: Trophy },
  { label: "Feed", href: "/feed", icon: Rss },
  { label: "Briefing", href: "/briefing", icon: Newspaper },
  { label: "Campaigns", href: "/campaigns", icon: CalendarClock },
  { label: "Queue", href: "/queue", icon: ListOrdered },
];

// Core tabs always visible in navigation (DM-322, updated for demo flow).
// Demo flow: Dashboard → Crafting → Voices → Analytics → Signals → Library → Arena → Queue
const CORE_NAV_HREFS = new Set(["/dashboard", "/crafting", "/voice-profiles", "/analytics", "/alerts", "/team-library", "/arena", "/queue"]);
const MANAGER_NAV_HREFS = new Set<string>();

export const coreNavLinks = navLinks.filter((link) => CORE_NAV_HREFS.has(link.href));

/** Returns the visible nav links for a given user role. Managers/admins see Analytics + Signals in addition to core tabs. */
export function getVisibleNavLinks(role?: string): typeof navLinks {
  const isAdmin = role === "ADMIN";
  const isManager = role === "MANAGER" || isAdmin;
  const links = navLinks.filter(
    (link) => CORE_NAV_HREFS.has(link.href) || (isManager && MANAGER_NAV_HREFS.has(link.href))
  );
  if (isAdmin) {
    links.push({ label: "Admin", href: "/admin", icon: Settings });
  }
  return links;
}

function DelphiLogo() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className="text-delphi-blue-400"
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
  const { unreadNotifications } = useAlertSocket();
  const { open: openPalette } = useCommandPalette();
  const hasUser = Boolean(user);
  const initial = user?.displayName?.[0]?.toUpperCase() || user?.handle?.[0]?.toUpperCase() || "A";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const isRouteEnabled = useRouteEnabled();
  const cachedTier = typeof window !== "undefined" ? getCachedTier() : null;
  const { shouldShowDot } = useNavDiscovery();
  const visibleLinks = getVisibleNavLinks(user?.role).filter((link) => isRouteEnabled(link.href));

  useEffect(() => {
    setMobileOpen(false);
    setNotifOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!hasUser) {
      setMobileOpen(false);
      setNotifOpen(false);
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
          <Link href="/feed" className="flex items-center gap-2">
            <DelphiLogo />
            <span className="text-atlas-text font-semibold text-sm">Atlas</span>
          </Link>
          {variant === "app" && (
            <div className="hidden md:flex items-center gap-6">
              {visibleLinks.map((link) => (
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
                  {shouldShowDot(link.href) && (
                    <NavDiscoveryDot className="ml-1" />
                  )}
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
              aria-haspopup="dialog"
              aria-controls="command-palette"
              className="hidden sm:flex items-center gap-1.5 text-atlas-text-secondary hover:text-atlas-text transition-colors group"
            >
              <Search className="w-5 h-5" aria-hidden="true" />
              <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded border border-glass-border text-[10px] font-mono text-atlas-text-muted group-hover:border-atlas-text-secondary transition-colors">
                ⌘K
              </kbd>
            </button>
          )}
          {variant === "app" && user && (
            <>
              {user.role === "ADMIN" ? (
                <>
                  <Link
                    href="/admin/bugs"
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-atlas-text-secondary hover:text-amber-400 hover:bg-atlas-surface transition-colors border border-glass-border"
                  >
                    <Shield className="w-3.5 h-3.5" aria-hidden="true" />
                    Admin
                  </Link>
                  <Link
                    href="/admin/bugs?action=report"
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-atlas-text-secondary hover:text-atlas-teal hover:bg-atlas-surface transition-colors border border-glass-border"
                  >
                    <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                    Feedback
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/admin/bugs?action=report"
                    className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-atlas-text-secondary hover:text-atlas-teal hover:bg-atlas-surface transition-colors border border-glass-border"
                  >
                    <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                    Feedback
                  </Link>
                  {user.role === "MANAGER" && (
                    <Link
                      href="/admin/bugs"
                      className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-atlas-text-secondary hover:text-amber-400 hover:bg-atlas-surface transition-colors border border-glass-border"
                    >
                      <Shield className="w-3.5 h-3.5" aria-hidden="true" />
                      Admin
                    </Link>
                  )}
                </>
              )}
              <TourToggle />
              <DemoModeToggle />
            </>
          )}
          {user && (
            <>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotifOpen(!notifOpen)}
                  aria-controls="notification-dropdown"
                  aria-expanded={notifOpen}
                  aria-haspopup="dialog"
                  aria-label={
                    unreadNotifications > 0
                      ? `Notifications, ${unreadNotifications} unread`
                      : "Notifications"
                  }
                  className={`relative p-1 transition-colors ${
                    notifOpen ? "text-atlas-teal" : "text-atlas-text-secondary hover:text-atlas-text"
                  }`}
                >
                  <Bell className="h-5 w-5" aria-hidden="true" />
                  {unreadNotifications > 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[16px] h-4 rounded-full bg-atlas-error px-1 text-[10px] font-bold text-white"
                    >
                      {unreadNotifications > 99 ? "99+" : unreadNotifications}
                    </span>
                  )}
                </button>
                <NotificationDropdown isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
              </div>
              <div className="relative z-10">
                <Link
                  href="/settings"
                  aria-label={cachedTier ? `${cachedTier.tier.name} (#${cachedTier.rank})` : "Signed in"}
                  className={`w-8 h-8 rounded-full bg-atlas-surface border-2 flex items-center justify-center text-xs font-medium cursor-pointer hover:ring-2 hover:ring-delphi-teal/40 transition-all ${
                    cachedTier
                      ? `${cachedTier.tier.borderColor} ${cachedTier.tier.color}`
                      : "border-glass-border text-atlas-text-secondary"
                  }`}
                  title={cachedTier ? `${cachedTier.tier.name} · #${cachedTier.rank} · ${cachedTier.score} pts` : undefined}
                >
                  {user.avatarUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={user.avatarUrl}
                      alt={`${user.displayName || user.handle} avatar`}
                      width={32}
                      height={32}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    initial
                  )}
                </Link>
              </div>
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
              {mobileOpen ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5" aria-hidden="true" />
              )}
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
            aria-label="Mobile navigation drawer"
            aria-hidden={!mobileOpen}
            className={`fixed inset-y-14 left-0 z-50 w-72 max-w-[calc(100vw-1rem)] overflow-y-auto border-r border-glass-border bg-atlas-nav px-4 py-4 transition-transform duration-200 ${
              mobileOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <nav aria-label="Mobile navigation">
              <div className="flex flex-col gap-1">
                {visibleLinks.map((link) => {
                  const Icon = link.icon;

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      aria-current={pathname === link.href ? "page" : undefined}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        pathname === link.href
                          ? "bg-atlas-surface font-medium text-atlas-text"
                          : "text-atlas-text-secondary hover:bg-atlas-surface hover:text-atlas-text"
                      }`}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {link.label}
                      {shouldShowDot(link.href) && (
                        <NavDiscoveryDot className="ml-auto" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </nav>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                openPalette();
              }}
              aria-haspopup="dialog"
              aria-controls="command-palette"
              className="mt-3 block w-full rounded-lg px-3 py-2.5 text-left text-sm text-atlas-text-secondary transition-colors hover:bg-atlas-surface hover:text-atlas-text sm:hidden"
            >
              Search (⌘K)
            </button>
            <div className="mt-6 border-t border-glass-border pt-4">
              <Link
                href="/settings"
                onClick={() => setMobileOpen(false)}
                aria-current={pathname === "/settings" ? "page" : undefined}
                className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  pathname === "/settings"
                    ? "bg-atlas-surface font-medium text-atlas-text"
                    : "text-atlas-text-secondary hover:bg-atlas-surface hover:text-atlas-text"
                }`}
              >
                <Settings className="h-4 w-4" aria-hidden="true" />
                Settings
              </Link>
            </div>
          </aside>
        </div>
      ) : null}
    </nav>
  );
}

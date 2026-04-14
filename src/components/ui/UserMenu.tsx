"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface UserMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserMenu({ isOpen, onClose }: UserMenuProps) {
  const { logout } = useAuth();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    // Focus first item for keyboard users
    firstItemRef.current?.focus();
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleLogout() {
    onClose();
    await logout();
    router.push("/");
  }

  return (
    <div
      ref={menuRef}
      id="user-menu-dropdown"
      role="menu"
      aria-label="User menu"
      className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-glass-border bg-atlas-surface shadow-lg z-50 overflow-hidden"
    >
      <Link
        ref={firstItemRef}
        href="/profile"
        role="menuitem"
        onClick={onClose}
        className="flex items-center gap-2 px-3 py-2.5 text-sm text-atlas-text-secondary hover:bg-atlas-nav hover:text-atlas-text transition-colors focus:outline-none focus:bg-atlas-nav focus:text-atlas-text"
      >
        <User className="h-4 w-4" aria-hidden="true" />
        Profile
      </Link>
      <button
        type="button"
        role="menuitem"
        onClick={handleLogout}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-atlas-text-secondary hover:bg-atlas-nav hover:text-atlas-text transition-colors focus:outline-none focus:bg-atlas-nav focus:text-atlas-text border-t border-glass-border"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        Log out
      </button>
    </div>
  );
}

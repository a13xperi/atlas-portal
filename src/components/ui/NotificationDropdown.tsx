"use client";

import { useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { Alert, api } from "@/lib/api";
import { useAlertSocket } from "@/lib/alertSocket";

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationDropdown({
  isOpen,
  onClose,
}: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { clearUnread } = useAlertSocket();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setLoading(true);
    api.alerts
      .feed()
      .then((res) => setNotifications(res.alerts ?? []))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));

    clearUnread();
  }, [clearUnread, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const formatTime = (dateStr: string) => {
    const diff = Math.max(0, Date.now() - new Date(dateStr).getTime());
    const mins = Math.floor(diff / 60000);

    if (mins < 60) {
      return `${mins}m ago`;
    }

    const hours = Math.floor(mins / 60);

    if (hours < 24) {
      return `${hours}h ago`;
    }

    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div
      ref={dropdownRef}
      id="notification-dropdown"
      role="dialog"
      aria-modal="false"
      aria-labelledby="notification-dropdown-title"
      className="absolute right-0 top-full z-50 mt-2 max-h-96 w-80 overflow-y-auto rounded-2xl border border-glass-border bg-atlas-nav backdrop-blur-xl shadow-lg"
    >
      <div className="flex items-center justify-between border-b border-glass-border px-4 py-3">
        <h3
          id="notification-dropdown-title"
          className="text-sm font-medium text-atlas-text"
        >
          Notifications
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notifications"
          className="text-atlas-text-muted transition-colors hover:text-atlas-text"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {loading ? (
        <div
          role="status"
          aria-live="polite"
          className="px-4 py-8 text-center text-sm text-atlas-text-muted"
        >
          Loading…
        </div>
      ) : null}

      {!loading && notifications.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <Check className="mx-auto mb-2 h-8 w-8 text-atlas-teal" aria-hidden="true" />
          <p className="text-sm text-atlas-text-secondary">All caught up</p>
        </div>
      ) : null}

      {!loading
        ? notifications.map((notification) => (
            <div
              key={notification.id}
              className="border-b border-glass-border/50 px-4 py-3 transition-colors hover:bg-atlas-surface/50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="mb-1 inline-block rounded bg-atlas-teal/20 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-atlas-teal">
                    {notification.type}
                  </span>
                  <p className="truncate text-sm text-atlas-text">
                    {notification.title}
                  </p>
                  {notification.context ? (
                    <p className="mt-0.5 line-clamp-2 text-xs text-atlas-text-secondary">
                      {notification.context}
                    </p>
                  ) : null}
                </div>
                <span className="mt-1 whitespace-nowrap text-[10px] text-atlas-text-muted">
                  {formatTime(notification.createdAt)}
                </span>
              </div>
            </div>
          ))
        : null}
    </div>
  );
}

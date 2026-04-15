"use client";

import { useState, useEffect, useRef } from "react";

function toLocalDateTimeInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export interface SchedulePopoverProps {
  initialAt: string;
  onCancel: () => void;
  onConfirm: (iso: string) => void;
  busy?: boolean;
}

export function SchedulePopover({ initialAt, onCancel, onConfirm, busy }: SchedulePopoverProps) {
  const [value, setValue] = useState(() => toLocalDateTimeInput(initialAt));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
      }
    }

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onCancel();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onCancel]);

  return (
    <div
      ref={containerRef}
      className="absolute right-0 top-full z-30 mt-2 w-64 rounded-xl border border-glass-border bg-atlas-nav p-3 shadow-xl backdrop-blur-xl"
      role="dialog"
      aria-label="Schedule draft"
    >
      <p className="mb-2 text-[11px] font-medium text-atlas-text-secondary">
        Pick a date and time
      </p>
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full rounded-lg border border-glass-border bg-atlas-surface px-2 py-1.5 text-xs text-atlas-text focus:border-atlas-teal focus:outline-none"
        aria-label="Schedule date and time"
      />
      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-glass-border px-2.5 py-1 text-[11px] text-atlas-text-muted hover:text-atlas-text"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={busy || !value}
          onClick={() => {
            const iso = new Date(value).toISOString();
            onConfirm(iso);
          }}
          className="rounded-lg bg-atlas-teal px-2.5 py-1 text-[11px] font-semibold text-atlas-bg transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Saving..." : "Confirm"}
        </button>
      </div>
    </div>
  );
}

"use client";

import Modal from "./Modal";
import { Command, CornerDownLeft, ArrowUp, ArrowDown } from "lucide-react";

interface ShortcutItem {
  keys: string[];
  description: string;
}

interface ShortcutGroup {
  title: string;
  items: ShortcutItem[];
}

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  navShortcuts?: { key: string; label: string }[];
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[1.5rem] items-center justify-center rounded border border-glass-border bg-atlas-bg px-1.5 py-0.5 text-[11px] font-medium text-atlas-text-secondary">
      {children}
    </kbd>
  );
}

export default function KeyboardShortcutsModal({
  isOpen,
  onClose,
  navShortcuts = [],
}: KeyboardShortcutsModalProps) {
  const groups: ShortcutGroup[] = [
    {
      title: "Navigation",
      items: [
        { keys: ["?"], description: "Show keyboard shortcuts" },
        { keys: ["Esc"], description: "Close modals / cancel actions" },
        ...(navShortcuts.length > 0
          ? navShortcuts.map((s) => ({
              keys: [s.key],
              description: `Go to ${s.label}`,
            }))
          : []),
      ],
    },
    {
      title: "Dashboard",
      items: [
        { keys: ["Q"], description: "Focus Quick Draft input" },
        { keys: ["Enter"], description: "Submit Quick Draft" },
      ],
    },
    {
      title: "Global",
      items: [
        { keys: ["⌘", "K"], description: "Open Command Palette" },
        { keys: ["/"], description: "Search from anywhere" },
      ],
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts"
      description="Speed up your workflow with these shortcuts"
    >
      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.title}>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-atlas-text-muted">
              {group.title}
            </h3>
            <ul className="space-y-2">
              {group.items.map((item, idx) => (
                <li
                  key={`${group.title}-${idx}`}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-atlas-text-secondary">
                    {item.description}
                  </span>
                  <span className="flex items-center gap-1">
                    {item.keys.map((key, kidx) => (
                      <Kbd key={kidx}>
                        {key === "Enter" ? (
                          <CornerDownLeft className="h-3 w-3" />
                        ) : key === "Esc" ? (
                          "Esc"
                        ) : key === "ArrowUp" ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : key === "ArrowDown" ? (
                          <ArrowDown className="h-3 w-3" />
                        ) : key === "⌘" ? (
                          <Command className="h-3 w-3" />
                        ) : (
                          key
                        )}
                      </Kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Modal>
  );
}

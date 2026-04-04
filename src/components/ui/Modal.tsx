"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  children: ReactNode;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export default function Modal({
  children,
  description,
  isOpen,
  onClose,
  title,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      aria-label={title}
      aria-modal="true"
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      role="dialog"
    >
      <button
        aria-label="Close modal"
        className="absolute inset-0 bg-atlas-bg/80 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />

      <div className="relative z-[111] w-full max-w-6xl">
        <div className="mb-3 flex items-start justify-between gap-4 px-2">
          <div>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-atlas-text">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-atlas-text-secondary">
                {description}
              </p>
            ) : null}
          </div>

          <button
            aria-label="Close"
            className="rounded-full border border-glass-border bg-atlas-surface/80 p-2 text-atlas-text-secondary transition-colors hover:border-atlas-teal hover:text-atlas-text"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

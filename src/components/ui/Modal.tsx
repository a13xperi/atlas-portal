"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

interface ModalProps {
  children: React.ReactNode;
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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const reactId = useId();
  const titleId = `${reactId}-title`;
  const descriptionId = `${reactId}-description`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose();
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 m-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0A1225] p-0 shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm open:flex open:flex-col"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b border-white/10 p-6">
        <div>
          <h2
            id={titleId}
            className="text-lg font-semibold text-white"
          >
            {title}
          </h2>
          {description && (
            <p
              id={descriptionId}
              className="mt-1 text-sm text-[#a0aec0]"
            >
              {description}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="ml-4 flex-shrink-0 rounded-lg p-1.5 text-[#718096] transition-colors hover:bg-white/10 hover:text-white"
        >
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">{children}</div>
    </dialog>
  );
}

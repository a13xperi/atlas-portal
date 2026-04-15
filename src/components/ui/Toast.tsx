"use client";

import { AlertTriangle, Check, Info, X, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { ToastKind, ToastRecord } from "@/components/ui/ToastProvider";

const icons: Record<ToastKind, LucideIcon> = {
  info: Info,
  success: Check,
  warning: AlertTriangle,
  error: X,
};

const toneClasses: Record<ToastKind, string> = {
  info: "border-glass-border bg-atlas-nav text-atlas-text",
  success: "border-atlas-teal/30 bg-atlas-teal/10 text-atlas-teal",
  warning: "border-atlas-warning/30 bg-atlas-warning/10 text-atlas-warning",
  error: "border-atlas-error/30 bg-atlas-error/10 text-atlas-error",
};

export interface ToastItemProps {
  toast: ToastRecord;
  onDismiss?: (id: string) => void;
}

export function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const Icon = icons[toast.kind];

  return (
    <div
      className={`pointer-events-auto rounded-2xl border shadow-lg backdrop-blur-xl ${toneClasses[toast.kind]}`}
      role="status"
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="font-body text-sm font-medium leading-5">{toast.title}</p>
          {toast.description ? (
            <p className="mt-1 text-sm leading-5 text-current/80">{toast.description}</p>
          ) : null}
          {toast.href ? (
            <a
              href={toast.href}
              className="mt-2 inline-flex text-xs font-medium underline underline-offset-2 transition-opacity hover:opacity-80"
            >
              Open alert
            </a>
          ) : null}
        </div>
        {onDismiss ? (
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            aria-label={`Dismiss ${toast.title}`}
            className="rounded-full p-1 text-current/70 transition-colors hover:bg-black/5 hover:text-current"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * @deprecated Import `ToastProvider` from `@/components/ui/ToastProvider`.
 */
export function ToastProvider(props: { children: ReactNode }) {
  const { ToastProvider: QueueToastProvider } =
    require("./ToastProvider") as typeof import("./ToastProvider");

  return <QueueToastProvider {...props} />;
}

/**
 * @deprecated Import `useToast` from `@/hooks/useToast`.
 */
export function useToast() {
  const { useToast: useToastQueue } =
    require("../../hooks/useToast") as typeof import("../../hooks/useToast");
  const { dismiss, push, toasts } = useToastQueue();

  return {
    dismiss,
    dismissToast: dismiss,
    push,
    pushToast: push,
    toast: (message: string, kind: ToastKind = "success") =>
      push({ title: message, kind, durationMs: 3000 }),
    toasts,
  };
}

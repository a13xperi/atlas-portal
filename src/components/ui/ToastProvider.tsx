"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ToastItem } from "@/components/ui/Toast";

export type ToastKind = "info" | "success" | "warning" | "error";

export interface ToastRecord {
  id: string;
  title: string;
  description?: string;
  kind: ToastKind;
  href?: string;
  durationMs?: number;
}

export type ToastInput = Omit<ToastRecord, "id"> & { id?: string };

export interface ToastContextValue {
  toasts: ToastRecord[];
  pushToast: (toast: ToastInput) => string;
  dismissToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION_MS = 5000;
const MAX_VISIBLE_TOASTS = 4;

function buildToastId() {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [pendingToasts, setPendingToasts] = useState<ToastRecord[]>([]);
  const timeoutIdsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismissToast = useCallback((id: string) => {
    const timeoutId = timeoutIdsRef.current[id];

    if (timeoutId) {
      clearTimeout(timeoutId);
      delete timeoutIdsRef.current[id];
    }

    setPendingToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((toast: ToastInput) => {
    const nextToast: ToastRecord = {
      ...toast,
      id: toast.id ?? buildToastId(),
      durationMs: toast.durationMs ?? DEFAULT_DURATION_MS,
    };

    setPendingToasts((current) => [...current, nextToast]);

    return nextToast.id;
  }, []);

  const toasts = pendingToasts.slice(0, MAX_VISIBLE_TOASTS);

  useEffect(() => {
    const visibleToastIds = new Set(toasts.map((toast) => toast.id));

    for (const toast of toasts) {
      if (timeoutIdsRef.current[toast.id]) {
        continue;
      }

      timeoutIdsRef.current[toast.id] = setTimeout(() => {
        dismissToast(toast.id);
      }, toast.durationMs ?? DEFAULT_DURATION_MS);
    }

    for (const [toastId, timeoutId] of Object.entries(timeoutIdsRef.current)) {
      if (visibleToastIds.has(toastId)) {
        continue;
      }

      clearTimeout(timeoutId);
      delete timeoutIdsRef.current[toastId];
    }
  }, [dismissToast, toasts]);

  useEffect(() => {
    return () => {
      for (const timeoutId of Object.values(timeoutIdsRef.current)) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, pushToast, dismissToast }}>
      {children}
      <div
        aria-atomic="true"
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-3 sm:bottom-6 sm:left-auto sm:right-6 sm:w-full sm:translate-x-0"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

"use client";

import { AlertTriangle, Check, Info, X, type LucideIcon } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => undefined });

const icons: Record<ToastType, LucideIcon> = {
  success: Check,
  error: X,
  warning: AlertTriangle,
  info: Info,
};

const colors: Record<ToastType, string> = {
  success: "border-atlas-teal/30 bg-atlas-teal/10 text-atlas-teal",
  error: "border-atlas-error/30 bg-atlas-error/10 text-atlas-error",
  warning: "border-atlas-warning/30 bg-atlas-warning/10 text-atlas-warning",
  info: "border-glass-border bg-atlas-nav text-atlas-text",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const removeToast = useCallback((id: string) => {
    const timeout = timeoutsRef.current[id];
    if (timeout) {
      clearTimeout(timeout);
      delete timeoutsRef.current[id];
    }

    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  useEffect(() => {
    const timeouts = timeoutsRef.current;

    return () => {
      for (const timeout of Object.values(timeouts)) {
        clearTimeout(timeout);
      }
    };
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      setToasts((prev) => [...prev, { id, message, type }]);
      timeoutsRef.current[id] = setTimeout(() => {
        removeToast(id);
      }, 3000);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div
        aria-atomic="true"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-6 z-50 flex flex-col gap-2 sm:left-auto sm:right-6 sm:max-w-sm"
      >
        {toasts.map((toast) => {
          const Icon = icons[toast.type];

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-2 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm transition-all duration-200 ${colors[toast.type]}`}
              role="status"
            >
              <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span className="font-body text-sm leading-5">{toast.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

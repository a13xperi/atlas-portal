"use client";

import { useContext } from "react";
import { ToastContext } from "@/components/ui/ToastProvider";

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return {
    toasts: context.toasts,
    push: context.pushToast,
    dismiss: context.dismissToast,
  };
}

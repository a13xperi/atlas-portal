"use client";

import { AuthProvider } from "@/lib/auth";
import { AlertSocketProvider } from "@/lib/alertSocket";
import ErrorBoundary from "@/components/ErrorBoundary";
import { CommandPaletteProvider } from "@/components/ui/CommandPalette";
import { ToastProvider } from "@/components/ui/Toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ErrorBoundary>
        <CommandPaletteProvider>
          <AuthProvider>
            <AlertSocketProvider>{children}</AlertSocketProvider>
          </AuthProvider>
        </CommandPaletteProvider>
      </ErrorBoundary>
    </ToastProvider>
  );
}

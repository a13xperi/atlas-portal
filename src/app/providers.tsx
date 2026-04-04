"use client";

import { AuthProvider } from "@/lib/auth";
import { AlertSocketProvider } from "@/lib/alertSocket";
import { DemoModeProvider } from "@/lib/demo-mode";
import ErrorBoundary from "@/components/ErrorBoundary";
import { CommandPaletteProvider } from "@/components/ui/CommandPalette";
import { ToastProvider } from "@/components/ui/Toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ErrorBoundary>
        <CommandPaletteProvider>
          <AuthProvider>
            <DemoModeProvider>
              <AlertSocketProvider>{children}</AlertSocketProvider>
            </DemoModeProvider>
          </AuthProvider>
        </CommandPaletteProvider>
      </ErrorBoundary>
    </ToastProvider>
  );
}

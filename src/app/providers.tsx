"use client";

import { AuthProvider } from "@/lib/auth";
import { AlertSocketProvider } from "@/lib/alertSocket";
import ErrorBoundary from "@/components/ErrorBoundary";
import { CommandPaletteProvider } from "@/components/ui/CommandPalette";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <CommandPaletteProvider>
        <AuthProvider>
          <AlertSocketProvider>{children}</AlertSocketProvider>
        </AuthProvider>
      </CommandPaletteProvider>
    </ErrorBoundary>
  );
}

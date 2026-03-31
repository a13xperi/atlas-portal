"use client";

import { AuthProvider } from "@/lib/auth";
import ErrorBoundary from "@/components/ErrorBoundary";
import { CommandPaletteProvider } from "@/components/ui/CommandPalette";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <CommandPaletteProvider>
        <AuthProvider>{children}</AuthProvider>
      </CommandPaletteProvider>
    </ErrorBoundary>
  );
}

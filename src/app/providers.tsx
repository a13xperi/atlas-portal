"use client";

import { AuthProvider } from "@/lib/auth";
import { AlertSocketProvider } from "@/lib/alertSocket";
import { DemoModeProvider } from "@/lib/demo-mode";
import ErrorBoundary from "@/components/ErrorBoundary";
import { CommandPaletteProvider } from "@/components/ui/CommandPalette";
import AlertToastBridge from "@/components/ui/AlertToastBridge";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { TourProvider } from "@/components/tour/TourProvider";
import { OracleAgentProvider } from "@/lib/oracle-agent";
import { FeatureFlagProvider } from "@/lib/feature-flags";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <DemoModeProvider>
        <CommandPaletteProvider>
          <AuthProvider>
            <FeatureFlagProvider>
              <OracleAgentProvider>
                <TourProvider>
                  <AlertSocketProvider>
                    <ToastProvider>
                      <AlertToastBridge />
                      {children}
                    </ToastProvider>
                  </AlertSocketProvider>
                </TourProvider>
              </OracleAgentProvider>
            </FeatureFlagProvider>
          </AuthProvider>
        </CommandPaletteProvider>
      </DemoModeProvider>
    </ErrorBoundary>
  );
}

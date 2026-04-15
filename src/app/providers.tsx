"use client";

import { useEffect } from "react";
import { AuthProvider } from "@/lib/auth";
import { AlertSocketProvider } from "@/lib/alertSocket";
import { DemoModeProvider } from "@/lib/demo-mode";
import ErrorBoundary from "@/components/ErrorBoundary";
import { CommandPaletteProvider } from "@/components/ui/CommandPalette";
import AlertToastBridge from "@/components/ui/AlertToastBridge";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { TourProvider } from "@/components/tour/TourProvider";
import { OracleAgentProvider } from "@/lib/oracle-agent";
import { OracleUIProvider } from "@/lib/oracle-ui";
import { FeatureFlagProvider } from "@/lib/feature-flags";
import { initBugReporter } from "@/lib/bug-reporter";

function BugReporterInit() {
  useEffect(() => {
    initBugReporter();
  }, []);
  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <BugReporterInit />
      <ErrorBoundary>
        <DemoModeProvider>
          <CommandPaletteProvider>
            <AuthProvider>
              <FeatureFlagProvider>
                <OracleAgentProvider>
                  <OracleUIProvider>
                    <TourProvider>
                      <AlertSocketProvider>{children}</AlertSocketProvider>
                    </TourProvider>
                  </OracleUIProvider>
                </OracleAgentProvider>
              </FeatureFlagProvider>
            </AuthProvider>
          </CommandPaletteProvider>
        </DemoModeProvider>
      </ErrorBoundary>
    </ToastProvider>
  );
}

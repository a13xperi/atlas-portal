"use client";

import { AuthProvider } from "@/lib/auth";
import { AlertSocketProvider } from "@/lib/alertSocket";
import { DemoModeProvider } from "@/lib/demo-mode";
import ErrorBoundary from "@/components/ErrorBoundary";
import WebVitalsReporter from "@/components/WebVitalsReporter";
import PostHogProvider from "@/components/analytics/PostHogProvider";
import PostHogUserIdentifier from "@/components/analytics/PostHogUserIdentifier";
import { CommandPaletteProvider } from "@/components/ui/CommandPalette";
import { ToastProvider } from "@/components/ui/Toast";
import { TourProvider } from "@/components/tour/TourProvider";
import { OracleAgentProvider } from "@/lib/oracle-agent";
import { FeatureFlagProvider } from "@/lib/feature-flags";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider>
      <WebVitalsReporter />
      <ToastProvider>
        <ErrorBoundary>
          <DemoModeProvider>
            <CommandPaletteProvider>
              <AuthProvider>
                <PostHogUserIdentifier />
                <FeatureFlagProvider>
                  <OracleAgentProvider>
                    <TourProvider>
                      <AlertSocketProvider>{children}</AlertSocketProvider>
                    </TourProvider>
                  </OracleAgentProvider>
                </FeatureFlagProvider>
              </AuthProvider>
            </CommandPaletteProvider>
          </DemoModeProvider>
        </ErrorBoundary>
      </ToastProvider>
    </PostHogProvider>
  );
}

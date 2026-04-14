"use client";

import AppShell from "@/components/layout/AppShell";
import TelegramSetupWizard from "@/components/telegram/TelegramSetupWizard";
import FeatureGate from "@/components/ui/FeatureGate";
import { useAuth } from "@/lib/auth";

export default function TelegramPage() {
  const { user } = useAuth();
  const isConnected = !!user?.telegramChatId;

  return (
    <FeatureGate flagKey="telegram_bot">
      <AppShell>
        <TelegramSetupWizard
          handle={user?.handle}
          isConnected={isConnected}
        />
      </AppShell>
    </FeatureGate>
  );
}

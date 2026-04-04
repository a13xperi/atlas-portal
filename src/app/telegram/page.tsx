"use client";

import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth";
import {
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  Search,
  Send,
} from "lucide-react";

const setupSteps = [
  {
    number: "1",
    title: "Open Telegram",
    description: "Download or open the Telegram app on your device",
    Icon: ExternalLink,
  },
  {
    number: "2",
    title: "Find Our Bot",
    description: "Search for @AtlasDelphiBot in Telegram",
    Icon: Search,
  },
  {
    number: "3",
    title: "Start the Connection",
    description: "Send /start, then /link your-handle to connect your account",
    Icon: Send,
  },
] as const;

export default function TelegramPage() {
  const { user } = useAuth();
  const isConnected = !!user?.telegramChatId;

  return (
    <AppShell>
      <div className="mx-auto flex max-w-2xl flex-col px-4 py-10 font-body sm:px-6">
        {isConnected ? (
          <span className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-green-500/20 px-4 py-1.5 text-sm font-medium text-green-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Connected
          </span>
        ) : (
          <span className="mb-6 inline-block rounded-full bg-atlas-teal/20 px-4 py-1.5 text-sm font-medium text-atlas-teal">
            Not Connected
          </span>
        )}

        <div className="mb-8 flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-atlas-teal/20 text-atlas-teal">
            <MessageCircle className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-heading font-extrabold tracking-tight text-3xl text-atlas-text">
              Connect Telegram
            </h1>
            <p className="mt-2 text-base text-atlas-text-secondary">
              Get Atlas alerts delivered to your Telegram
            </p>
          </div>
        </div>

        {isConnected && (
          <div className="mb-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-4">
            <p className="text-sm text-green-400">
              Your Telegram is linked to <span className="font-semibold">@{user?.handle}</span>.
              You&apos;ll receive alerts automatically. Use <code className="rounded bg-atlas-surface px-1.5 py-0.5 text-xs">/alerts</code> in the bot to view recent signals.
            </p>
          </div>
        )}

        <div>
          {setupSteps.map(({ number, title, description, Icon }) => (
            <div
              key={number}
              className="mb-4 rounded-2xl border border-glass-border bg-glass p-6 backdrop-blur-xl"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-atlas-teal/20 font-bold text-atlas-teal">
                  {number}
                </div>

                <div className="flex-1">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-atlas-teal/10 text-atlas-teal">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-atlas-text">
                    {title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-atlas-text-secondary">
                    {description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

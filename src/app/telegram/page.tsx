"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import { useAuth } from "@/lib/auth";
import {
  CheckCircle2,
  ExternalLink,
  LinkIcon,
  MessageCircle,
  Send,
  Unlink,
} from "lucide-react";

const BOT_USERNAME = "AtlasDelphiBot";

export default function TelegramPage() {
  const { user } = useAuth();
  const isLinked = !!user?.telegramChatId;
  const [copied, setCopied] = useState(false);

  const linkCommand = `/link ${user?.handle ?? "your-handle"}`;
  const botUrl = `https://t.me/${BOT_USERNAME}`;

  function handleCopyCommand() {
    navigator.clipboard.writeText(linkCommand);
    setCopied(true);
  }

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <AppShell>
      <div className="mx-auto flex max-w-2xl flex-col px-4 py-10 font-body sm:px-6">
        <div className="mb-8 flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-atlas-teal/20 text-atlas-teal">
            <MessageCircle className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-heading font-extrabold tracking-tight text-3xl text-atlas-text">
              Connect Telegram
            </h1>
            <p className="mt-2 text-base text-atlas-text-secondary">
              Get Atlas alerts delivered straight to Telegram
            </p>
          </div>
        </div>

        {isLinked ? (
          <GlassCard className="mb-6 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-atlas-success/20">
                <CheckCircle2 className="h-5 w-5 text-atlas-success" />
              </div>
              <div>
                <p className="font-semibold text-atlas-text">Connected</p>
                <p className="text-sm text-atlas-text-secondary">
                  Alerts with Telegram delivery will be sent to your linked account.
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs text-atlas-text-muted">
              To unlink, send <code className="rounded bg-atlas-surface px-1.5 py-0.5">/unlink</code> to{" "}
              <a
                href={botUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-atlas-teal hover:underline"
              >
                @{BOT_USERNAME}
              </a>
            </p>
          </GlassCard>
        ) : (
          <>
            <div className="mb-6 space-y-4">
              <GlassCard className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-atlas-teal/20 font-bold text-atlas-teal">
                    1
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-atlas-text">Open the bot</h2>
                    <p className="mt-1 text-sm text-atlas-text-secondary">
                      Open @{BOT_USERNAME} in Telegram and send{" "}
                      <code className="rounded bg-atlas-surface px-1.5 py-0.5">/start</code>
                    </p>
                    <a
                      href={botUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-atlas-teal hover:underline"
                    >
                      Open in Telegram <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-atlas-teal/20 font-bold text-atlas-teal">
                    2
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-atlas-text">Link your account</h2>
                    <p className="mt-1 text-sm text-atlas-text-secondary">
                      Send this command to the bot to connect your Atlas account:
                    </p>
                    <button
                      onClick={handleCopyCommand}
                      className="mt-3 flex items-center gap-2 rounded-xl border border-glass-border bg-atlas-surface px-4 py-2.5 text-sm font-mono text-atlas-text transition-colors hover:border-atlas-teal/50"
                    >
                      <LinkIcon className="h-4 w-4 text-atlas-teal" />
                      {linkCommand}
                      <span className="ml-2 text-xs text-atlas-text-muted">
                        {copied ? "Copied!" : "Click to copy"}
                      </span>
                    </button>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-atlas-teal/20 font-bold text-atlas-teal">
                    3
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-atlas-text">Enable Telegram delivery</h2>
                    <p className="mt-1 text-sm text-atlas-text-secondary">
                      Go to <a href="/alerts" className="text-atlas-teal hover:underline">Alerts</a> and
                      set your subscriptions to deliver via Telegram.
                    </p>
                  </div>
                </div>
              </GlassCard>
            </div>

            <GradientButton
              onClick={() => window.open(botUrl, "_blank")}
              fullWidth
            >
              <Send className="mr-2 h-4 w-4" />
              Open @{BOT_USERNAME}
            </GradientButton>
          </>
        )}
      </div>
    </AppShell>
  );
}

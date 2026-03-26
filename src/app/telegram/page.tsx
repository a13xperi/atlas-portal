"use client";

import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import GradientButton from "@/components/ui/GradientButton";
import { Check } from "lucide-react";

const capabilities = [
  "Send me a report to condense into a tweet",
  "Drop a tweet or creator link to clone a voice",
  "Add a voice to your style library",
  "Get real-time alerts when big accounts post",
  "Review and approve draft tweets on the go",
  "Send feedback — text or voice note — anytime",
  "Share styles with your team instantly",
  "Manage alert subscriptions on the fly",
];

const chatSnippets = [
  { from: "user", text: "/subscribe @VitalikButerin" },
  { from: "atlas", text: "Done — you'll get alerts when Vitalik posts. Synced to your Portal too." },
  { from: "user", text: "/alerts pause 2h" },
];

const telegramFor = [
  "Quick content drops on the go",
  "Voice note feedback",
  "Alert triage and fast replies",
  "Approving drafts from your phone",
  "Subscribing to new accounts",
];

const portalFor = [
  "Deep voice profile editing",
  "Blend creation and fine-tuning",
  "Analytics and engagement data",
  "Team style library browsing",
  "Management dashboards",
];

export default function TelegramPage() {
  const router = useRouter();

  return (
    <AppShell>
      <h1 className="font-heading text-2xl text-atlas-text">
        Connect Atlas on Telegram — One Bot, Everything.
      </h1>

      {/* Setup Steps */}
      <div className="mt-8 space-y-6">
        {[
          {
            step: 1,
            title: "Download Telegram",
            desc: "Get it from your app store if you don't have it yet.",
          },
          {
            step: 2,
            title: "Scan QR code or tap link",
            desc: "Connect your Atlas account to the Telegram bot.",
          },
          {
            step: 3,
            title: "Send a test message",
            desc: "Atlas will reply in your voice within seconds.",
          },
        ].map((item) => (
          <div key={item.step} className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-atlas-teal flex items-center justify-center text-sm font-semibold text-atlas-bg shrink-0">
              {item.step}
            </div>
            <div>
              <p className="text-atlas-text font-medium">{item.title}</p>
              <p className="text-atlas-text-secondary text-sm mt-1">
                {item.desc}
              </p>
              {item.step === 2 && (
                <div className="mt-3 flex items-center gap-4">
                  <div className="w-[140px] h-[140px] bg-atlas-surface border-2 border-atlas-teal rounded-xl flex items-center justify-center text-atlas-text-muted text-xs">
                    QR Code
                  </div>
                  <span className="text-atlas-teal text-sm hover:underline cursor-pointer">
                    or tap this link to connect
                  </span>
                </div>
              )}
              {item.step === 3 && (
                <div className="mt-3 bg-atlas-surface rounded-2xl p-4 max-w-sm">
                  <div className="bg-atlas-nav rounded-lg px-3 py-2 text-sm text-atlas-text mb-2 w-fit">
                    Hey Atlas, draft something about ETH staking yields
                  </div>
                  <div className="bg-atlas-teal/20 rounded-lg px-3 py-2 text-sm text-atlas-text ml-auto w-fit">
                    Here&apos;s a draft in your voice...
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-atlas-text-muted text-sm italic mt-4">
        Atlas will reply in your voice within seconds.
      </p>

      <hr className="border-glass-border my-8" />

      {/* Capabilities */}
      <div className="bg-atlas-surface border border-glass-border rounded-2xl p-8">
        <h3 className="font-heading text-lg text-atlas-text mb-4">
          Everything Atlas can do from Telegram.
        </h3>
        <div className="space-y-3">
          {capabilities.map((item) => (
            <div key={item} className="flex items-center gap-3">
              <Check className="w-4 h-4 text-atlas-teal shrink-0" />
              <span className="text-sm text-atlas-text">{item}</span>
            </div>
          ))}
        </div>
        <p className="text-atlas-text-muted text-sm italic mt-6">
          Portal and Telegram are two windows into one brain.
        </p>
      </div>

      {/* Subscription Management */}
      <div className="mt-8 bg-atlas-surface border border-glass-border rounded-2xl p-8">
        <p className="text-atlas-text-secondary text-sm mb-4">
          Manage your alert subscriptions from Telegram.
        </p>
        <div className="space-y-3 max-w-md">
          {chatSnippets.map((msg, i) => (
            <div
              key={i}
              className={`rounded-lg px-3 py-2 text-sm w-fit ${
                msg.from === "user"
                  ? "bg-atlas-nav text-atlas-text"
                  : "bg-atlas-teal/20 text-atlas-text ml-auto"
              }`}
            >
              {msg.text}
            </div>
          ))}
        </div>
        <p className="text-atlas-text-muted text-xs italic mt-4">
          All changes sync to Portal automatically.
        </p>
      </div>

      {/* Comparison */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-atlas-surface border border-glass-border rounded-2xl p-6">
          <h4 className="text-atlas-text font-medium mb-3">
            Telegram is for:
          </h4>
          <ul className="space-y-2">
            {telegramFor.map((item) => (
              <li
                key={item}
                className="text-sm text-atlas-text-secondary flex items-center gap-2"
              >
                <span className="w-1 h-1 rounded-full bg-atlas-teal" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-atlas-surface border border-glass-border rounded-2xl p-6">
          <h4 className="text-atlas-text font-medium mb-3">
            The Portal is for:
          </h4>
          <ul className="space-y-2">
            {portalFor.map((item) => (
              <li
                key={item}
                className="text-sm text-atlas-text-secondary flex items-center gap-2"
              >
                <span className="w-1 h-1 rounded-full bg-atlas-teal" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="text-center text-atlas-text-secondary text-sm mt-4">
        Use both. They share the same brain.
      </p>

      <div className="mt-8">
        <GradientButton fullWidth onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </GradientButton>
      </div>
    </AppShell>
  );
}

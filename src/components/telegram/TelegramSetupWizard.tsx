"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  MessageCircle,
  Search,
  Send,
} from "lucide-react";
import { api } from "@/lib/api";
import type { TelegramPrefs, WizardStep } from "@/types/telegram";

const BOT_USERNAME = "AtlasDelphiBot";
const BOT_URL = `https://t.me/${BOT_USERNAME}`;
const TELEGRAM_PREFS_STORAGE_KEY = "atlas_telegram_prefs";
const WIZARD_STEPS: WizardStep[] = ["intro", "connect", "preferences"];
const DEFAULT_PREFS: TelegramPrefs = {
  daily_briefing: true,
  price_alerts: true,
  mention_alerts: false,
};
const STEP_COPY: Record<
  WizardStep,
  {
    eyebrow: string;
    title: string;
    description: string;
  }
> = {
  intro: {
    eyebrow: "Step 1",
    title: "Telegram, with less setup friction",
    description:
      "Atlas can send you briefings + alerts via Telegram. Set up in 60s.",
  },
  connect: {
    eyebrow: "Step 2",
    title: "Open the bot and pair your Atlas handle",
    description:
      "Use the deep link below, then send the pairing command in Telegram to connect your account.",
  },
  preferences: {
    eyebrow: "Step 3",
    title: "Pick the alerts you actually want",
    description:
      "Choose what Atlas should deliver after you pair the bot. You can change these later.",
  },
};

interface TelegramSetupWizardProps {
  handle?: string | null;
  isConnected: boolean;
  completionHref?: "/dashboard" | "/feed";
}

type TelegramApiClient = typeof api & {
  telegram?: {
    updatePreferences?: (prefs: TelegramPrefs) => Promise<unknown>;
  };
};

function readStoredPrefs(): TelegramPrefs {
  if (typeof window === "undefined") {
    return DEFAULT_PREFS;
  }

  try {
    const raw = window.localStorage.getItem(TELEGRAM_PREFS_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_PREFS;
    }

    const parsed = JSON.parse(raw) as Partial<TelegramPrefs>;

    return {
      daily_briefing:
        typeof parsed.daily_briefing === "boolean"
          ? parsed.daily_briefing
          : DEFAULT_PREFS.daily_briefing,
      price_alerts:
        typeof parsed.price_alerts === "boolean"
          ? parsed.price_alerts
          : DEFAULT_PREFS.price_alerts,
      mention_alerts:
        typeof parsed.mention_alerts === "boolean"
          ? parsed.mention_alerts
          : DEFAULT_PREFS.mention_alerts,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export default function TelegramSetupWizard({
  handle,
  isConnected,
  completionHref = "/dashboard",
}: TelegramSetupWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>("intro");
  const [prefs, setPrefs] = useState<TelegramPrefs>(() => readStoredPrefs());
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const currentStepIndex = WIZARD_STEPS.indexOf(step);
  const pairingCode = handle?.trim() || "your-handle";
  const pairingCommand = `/link ${pairingCode}`;
  const connectDetails = [
    {
      title: "Open Telegram",
      description: "Tap the bot link or search for @AtlasDelphiBot in Telegram.",
      Icon: ExternalLink,
    },
    {
      title: "Start the bot",
      description: "Send /start so Telegram opens the conversation.",
      Icon: Search,
    },
    {
      title: "Paste your pairing command",
      description: `Send ${pairingCommand} to link Atlas with your chat.`,
      Icon: Send,
    },
  ] as const;

  async function handleCopyPairingCode() {
    if (!navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(pairingCode);
    setCopied(true);
  }

  function handleTogglePreference(key: keyof TelegramPrefs) {
    setPrefs((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  async function handleFinish() {
    setIsSaving(true);
    setSaveError(null);

    try {
      const telegramApi = api as TelegramApiClient;

      if (telegramApi.telegram?.updatePreferences) {
        await telegramApi.telegram.updatePreferences(prefs);
      } else if (typeof window !== "undefined") {
        window.localStorage.setItem(
          TELEGRAM_PREFS_STORAGE_KEY,
          JSON.stringify(prefs),
        );
      }
    } catch {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          TELEGRAM_PREFS_STORAGE_KEY,
          JSON.stringify(prefs),
        );
      } else {
        setSaveError("We couldn't save your Telegram preferences.");
        setIsSaving(false);
        return;
      }
    }

    router.push(completionHref);
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col px-4 py-10 font-body sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        {isConnected ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/20 px-4 py-1.5 text-sm font-medium text-green-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Connected
          </span>
        ) : (
          <span className="inline-block rounded-full bg-atlas-teal/20 px-4 py-1.5 text-sm font-medium text-atlas-teal">
            Not Connected
          </span>
        )}

        <span className="text-sm text-atlas-text-secondary">
          Step {currentStepIndex + 1} of {WIZARD_STEPS.length}
        </span>
      </div>

      <div className="mb-8 flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-atlas-teal/20 text-atlas-teal">
          <MessageCircle className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-atlas-text">
            Telegram Integration
          </h1>
          <p className="mt-2 max-w-2xl text-atlas-text-secondary">
            Connect your Telegram account to get Atlas alerts, briefings, and
            signal delivery without leaving chat.
          </p>
        </div>
      </div>

      <div className="mb-8 flex items-center gap-3" aria-label="Wizard progress">
        {WIZARD_STEPS.map((wizardStep, index) => {
          const isActive = wizardStep === step;
          const isComplete = index < currentStepIndex;

          return (
            <div
              key={wizardStep}
              className={`h-2 flex-1 rounded-full transition-colors ${
                isActive || isComplete
                  ? "bg-atlas-teal"
                  : "bg-atlas-text-muted/20"
              }`}
            />
          );
        })}
      </div>

      <div className="bg-glass rounded-3xl border border-glass-border p-6 backdrop-blur-xl sm:p-8">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-atlas-teal">
            {STEP_COPY[step].eyebrow}
          </p>
          <h2 className="mt-3 font-heading text-2xl font-bold text-atlas-text">
            {STEP_COPY[step].title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-atlas-text-secondary">
            {STEP_COPY[step].description}
          </p>
        </div>

        {isConnected ? (
          <div className="mb-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-4">
            <p className="text-sm text-green-400">
              Your Telegram is already linked to{" "}
              <span className="font-semibold">@{pairingCode}</span>. Review
              your delivery mix below or reopen the bot any time.
            </p>
          </div>
        ) : null}

        {step === "intro" ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-glass-border bg-atlas-surface/60 p-5">
                <p className="text-sm font-semibold text-atlas-text">
                  Daily briefing
                </p>
                <p className="mt-2 text-sm leading-6 text-atlas-text-secondary">
                  Get the market context Atlas already builds for you, pushed
                  straight into Telegram.
                </p>
              </div>

              <div className="rounded-2xl border border-glass-border bg-atlas-surface/60 p-5">
                <p className="text-sm font-semibold text-atlas-text">
                  Price alerts
                </p>
                <p className="mt-2 text-sm leading-6 text-atlas-text-secondary">
                  Keep critical levels and market moves visible when you're away
                  from the dashboard.
                </p>
              </div>

              <div className="rounded-2xl border border-glass-border bg-atlas-surface/60 p-5">
                <p className="text-sm font-semibold text-atlas-text">
                  Mention alerts
                </p>
                <p className="mt-2 text-sm leading-6 text-atlas-text-secondary">
                  Surface the messages that need a response without monitoring
                  Atlas all day.
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setStep("connect")}
                className="inline-flex items-center justify-center rounded-2xl bg-atlas-teal px-5 py-3 text-sm font-semibold text-atlas-bg transition-colors hover:bg-atlas-teal/90"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}

        {step === "connect" ? (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-4">
                {connectDetails.map(({ title, description, Icon }, index) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-glass-border bg-atlas-surface/60 p-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-atlas-teal/20 text-sm font-bold text-atlas-teal">
                        {index + 1}
                      </div>

                      <div className="flex-1">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-atlas-teal/10 text-atlas-teal">
                          <Icon className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-semibold text-atlas-text">
                          {title}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-atlas-text-secondary">
                          {description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-glass-border bg-atlas-surface/60 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-atlas-text-muted">
                    Deep link / bot entry
                  </p>
                  <a
                    href={BOT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-atlas-teal/30 bg-atlas-teal/10 px-4 py-3 text-sm font-semibold text-atlas-teal transition-colors hover:bg-atlas-teal/20"
                  >
                    Open @{BOT_USERNAME}
                    <ExternalLink className="h-4 w-4" />
                  </a>

                  <div className="mt-4 aspect-square rounded-2xl border border-dashed border-glass-border bg-glass p-4 backdrop-blur-xl">
                    <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-atlas-teal/20 bg-atlas-teal/5 p-4 text-center">
                      <MessageCircle className="h-10 w-10 text-atlas-teal" />
                      <p className="mt-3 text-sm font-semibold text-atlas-text">
                        @{BOT_USERNAME}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-atlas-text-secondary">
                        Open this bot on desktop with the link above, or search
                        for it in Telegram on mobile.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-glass-border bg-atlas-surface/60 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-atlas-text-muted">
                        Pairing code
                      </p>
                      <p className="mt-3 text-2xl font-semibold text-atlas-text">
                        {pairingCode}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-atlas-text-secondary">
                        Send{" "}
                        <code className="rounded bg-atlas-surface px-1.5 py-0.5 text-xs text-atlas-text">
                          {pairingCommand}
                        </code>{" "}
                        once the chat opens.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyPairingCode}
                      className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-glass-border bg-glass px-3 py-2 text-sm font-medium text-atlas-text transition-colors hover:border-atlas-teal/50 hover:text-atlas-teal"
                    >
                      <Copy className="h-4 w-4" />
                      {copied ? "Copied" : "Copy code"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep("intro")}
                className="inline-flex items-center justify-center rounded-2xl border border-glass-border bg-glass px-5 py-3 text-sm font-medium text-atlas-text transition-colors hover:border-atlas-teal/40 hover:text-atlas-teal"
              >
                Back
              </button>

              <button
                type="button"
                onClick={() => setStep("preferences")}
                className="inline-flex items-center justify-center rounded-2xl bg-atlas-teal px-5 py-3 text-sm font-semibold text-atlas-bg transition-colors hover:bg-atlas-teal/90"
              >
                I&apos;ve opened the bot
              </button>
            </div>
          </div>
        ) : null}

        {step === "preferences" ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-glass-border bg-atlas-surface/60 p-3">
              {(
                [
                  {
                    key: "daily_briefing",
                    label: "Daily briefing",
                    description:
                      "Morning Telegram brief with the latest market read and priority watchlist.",
                  },
                  {
                    key: "price_alerts",
                    label: "Price alerts",
                    description:
                      "Threshold alerts for the assets and moves that matter to your workflow.",
                  },
                  {
                    key: "mention_alerts",
                    label: "Mention alerts",
                    description:
                      "Telegram notifications when Atlas spots mentions worth responding to.",
                  },
                ] as const
              ).map(({ key, label, description }, index, items) => (
                <div
                  key={key}
                  className={`flex items-center justify-between gap-4 px-3 py-4 ${
                    index < items.length - 1 ? "border-b border-glass-border" : ""
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-atlas-text">
                      {label}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-atlas-text-secondary">
                      {description}
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-label={label}
                    aria-checked={prefs[key]}
                    onClick={() => handleTogglePreference(key)}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-atlas-teal focus:ring-offset-2 focus:ring-offset-atlas-surface ${
                      prefs[key] ? "bg-atlas-teal" : "bg-atlas-text-muted/40"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg transition-transform duration-200 ${
                        prefs[key] ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>

            {saveError ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {saveError}
              </div>
            ) : null}

            <div className="flex flex-wrap justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep("connect")}
                className="inline-flex items-center justify-center rounded-2xl border border-glass-border bg-glass px-5 py-3 text-sm font-medium text-atlas-text transition-colors hover:border-atlas-teal/40 hover:text-atlas-teal"
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleFinish}
                disabled={isSaving}
                className="inline-flex items-center justify-center rounded-2xl bg-atlas-teal px-5 py-3 text-sm font-semibold text-atlas-bg transition-colors hover:bg-atlas-teal/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Finish"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

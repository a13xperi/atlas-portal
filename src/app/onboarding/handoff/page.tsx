"use client";

import { useRouter } from "next/navigation";
import OnboardingShell from "@/components/layout/OnboardingShell";
import GradientButton from "@/components/ui/GradientButton";
import { Check } from "lucide-react";

const feedbackChannels = ["Text", "Voice note", "Loom video"];

const telegramCapabilities = [
  "Send me a report to condense into a tweet",
  "Drop a tweet or creator link to clone a voice",
  "Add a voice to your style library",
  "Get real-time alerts when big accounts post",
  "Review and approve draft tweets on the go",
  "Send feedback — text or voice note — anytime",
];

export default function HandoffPage() {
  const router = useRouter();

  return (
    <OnboardingShell maxWidth="640px">
      <div className="space-y-8">
        <p className="text-atlas-text text-lg">
          I won&apos;t be perfect the first time. Bear with me. Drop me a
          report, a tweet, or a voice note anytime.
        </p>

        {/* Feedback Channels */}
        <section>
          <label className="text-xs text-atlas-text-secondary uppercase tracking-wide">
            Set up your feedback channels.
          </label>
          <div className="mt-3 flex flex-wrap gap-3">
            {feedbackChannels.map((channel) => (
              <label
                key={channel}
                className="flex items-center gap-2 bg-atlas-surface border border-glass-border rounded-2xl px-4 py-3 cursor-pointer hover:border-atlas-teal transition-colors"
              >
                <input
                  type="checkbox"
                  defaultChecked
                  className="accent-atlas-teal"
                />
                <span className="text-sm text-atlas-text">{channel}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Telegram Panel */}
        <section className="bg-atlas-surface rounded-2xl p-8">
          <h3 className="font-heading text-lg text-atlas-text mb-4">
            Meet your Atlas bot on Telegram — one bot, everything.
          </h3>

          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <div className="w-[160px] h-[160px] sm:w-[200px] sm:h-[200px] bg-atlas-surface border-2 border-atlas-teal rounded-xl flex items-center justify-center text-atlas-text-muted text-sm shrink-0">
              QR Code
            </div>
            <span className="text-atlas-teal text-sm hover:underline cursor-pointer">
              or tap this link to connect
            </span>
          </div>

          <hr className="border-glass-border mb-6" />

          <label className="text-xs text-atlas-text-secondary uppercase tracking-wide">
            Here is everything I can do from Telegram:
          </label>
          <div className="mt-3 space-y-3">
            {telegramCapabilities.map((item) => (
              <div key={item} className="flex items-center gap-3">
                <Check className="w-4 h-4 text-atlas-teal shrink-0" />
                <span className="text-sm text-atlas-text">{item}</span>
              </div>
            ))}
          </div>

          <p className="text-atlas-text-secondary text-sm italic mt-6">
            This is the same Atlas — portal and Telegram are two windows into
            one brain.
          </p>
        </section>

        <GradientButton fullWidth onClick={() => router.push("/dashboard")}>
          Go to Dashboard
        </GradientButton>
      </div>
    </OnboardingShell>
  );
}

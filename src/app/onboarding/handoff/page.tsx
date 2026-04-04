"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
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

function HandoffContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const step = searchParams.get("step")
    ? Number(searchParams.get("step"))
    : undefined;
  const total = searchParams.get("total")
    ? Number(searchParams.get("total"))
    : undefined;

  return (
    <OnboardingShell maxWidth="640px" step={step} totalSteps={total}>
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
          <h3 className="font-heading font-semibold text-lg text-atlas-text mb-4">
            Meet your Atlas bot on Telegram — one bot, everything.
          </h3>

          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <div className="w-[160px] h-[160px] sm:w-[200px] sm:h-[200px] bg-atlas-surface border-2 border-atlas-teal rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
              <div className="text-center space-y-2">
                <div className="grid grid-cols-5 gap-1 mx-auto w-24 h-24">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div key={i} className={`rounded-sm ${[0,1,3,4,5,9,10,14,15,19,20,21,23,24].includes(i) ? 'bg-atlas-teal' : 'bg-atlas-surface'}`} />
                  ))}
                </div>
                <p className="text-xs text-atlas-text-muted">Scan to connect</p>
              </div>
            </div>
            <a href="https://t.me/AtlasDelphiBot" target="_blank" rel="noopener noreferrer" className="text-atlas-teal text-sm hover:underline cursor-pointer">
              or tap this link to connect →
            </a>
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

export default function HandoffPage() {
  return (
    <Suspense>
      <HandoffContent />
    </Suspense>
  );
}

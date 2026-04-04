"use client";

import { useRouter } from "next/navigation";
import OnboardingShell from "@/components/layout/OnboardingShell";
import { SlidersHorizontal } from "lucide-react";

export default function OnboardingForkPage() {
  const router = useRouter();

  return (
    <OnboardingShell maxWidth="640px">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-heading font-extrabold tracking-tight text-2xl text-atlas-text">
            How do you want to get started?
          </h1>
          <p className="text-sm text-atlas-text-secondary">
            Choose how Atlas learns your writing style.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Track A — Connect X */}
          <button
            onClick={() => router.push("/onboarding/track-a")}
            className="group text-left bg-glass border-2 border-atlas-teal/40 hover:border-atlas-teal rounded-2xl p-6 transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(78,205,196,0.15)]"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-atlas-teal/10 text-atlas-teal">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </div>
              <h2 className="font-heading font-bold text-lg text-atlas-text">
                Connect X
              </h2>
            </div>
            <p className="text-sm text-atlas-text-secondary leading-relaxed">
              I post on X — scan my tweets to build my voice automatically.
            </p>
            <div className="mt-4 inline-flex items-center text-xs font-semibold text-atlas-teal group-hover:translate-x-1 transition-transform">
              Fastest setup &rarr;
            </div>
          </button>

          {/* Track B — Manual */}
          <button
            onClick={() => router.push("/onboarding/track-b")}
            className="group text-left bg-glass border border-glass-border hover:border-atlas-text-muted rounded-2xl p-6 transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-atlas-surface text-atlas-text-secondary">
                <SlidersHorizontal className="h-5 w-5" />
              </div>
              <h2 className="font-heading font-bold text-lg text-atlas-text">
                Set up manually
              </h2>
            </div>
            <p className="text-sm text-atlas-text-secondary leading-relaxed">
              I&apos;ll build my voice from scratch — no X account needed.
            </p>
            <div className="mt-4 inline-flex items-center text-xs font-semibold text-atlas-text-muted group-hover:translate-x-1 transition-transform">
              More control &rarr;
            </div>
          </button>
        </div>
      </div>
    </OnboardingShell>
  );
}

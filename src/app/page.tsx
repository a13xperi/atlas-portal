"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingShell from "@/components/layout/OnboardingShell";
import GradientButton from "@/components/ui/GradientButton";

export default function LoginPage() {
  const [handle, setHandle] = useState("");
  const router = useRouter();

  const handleGetStarted = () => {
    if (handle.trim()) {
      router.push("/onboarding/track-a");
    } else {
      router.push("/onboarding/track-b");
    }
  };

  return (
    <OnboardingShell maxWidth="480px">
      <div className="text-center">
        <h1 className="font-heading text-4xl font-bold tracking-widest text-atlas-text">
          ATLAS
        </h1>
        <p className="font-heading text-sm italic text-atlas-text-secondary mt-2">
          If you are here, you&apos;re already in the right place
        </p>

        <div className="h-8" />

        <div className="text-left">
          <label className="text-xs text-atlas-text-secondary uppercase tracking-wide">
            Your handle (agnostic, with no platform names)
          </label>
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="@yourhandle"
            className="mt-2 w-full bg-atlas-surface rounded-lg text-atlas-text placeholder-atlas-text-secondary px-4 py-3 border border-glass-border focus:outline-none focus:border-atlas-teal"
          />
        </div>

        <div className="h-4" />

        <GradientButton fullWidth onClick={handleGetStarted}>
          Get Started
        </GradientButton>

        <div className="h-3" />

        <button
          type="button"
          onClick={() => router.push("/onboarding/track-b")}
          className="text-atlas-teal text-sm hover:underline"
        >
          Don&apos;t have one? No problem →
        </button>

        <div className="h-6" />

        <p className="text-atlas-text-muted text-xs">Powered by Delphi</p>
      </div>
    </OnboardingShell>
  );
}

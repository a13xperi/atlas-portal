"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingShell from "@/components/layout/OnboardingShell";
import GradientButton from "@/components/ui/GradientButton";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const [handle, setHandle] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, register } = useAuth();

  const handleGetStarted = async () => {
    setError("");
    setLoading(true);
    try {
      if (handle.trim()) {
        // Try login first, fall back to register
        try {
          await login(handle.trim());
          router.push("/dashboard");
        } catch {
          await register(handle.trim(), "TRACK_A");
          router.push("/onboarding/track-a");
        }
      } else {
        router.push("/onboarding/track-b");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingShell maxWidth="480px">
      <div className="text-center">
        <h1 className="font-heading text-[48px] font-bold tracking-[-1.2px] text-atlas-text">
          ATLAS
        </h1>
        <p className="font-heading text-lg italic text-[#bcc9c7] mt-2">
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
            onKeyDown={(e) => e.key === "Enter" && handleGetStarted()}
          />
        </div>

        {error && (
          <p className="text-atlas-error text-sm mt-2 text-left">{error}</p>
        )}

        <div className="h-4" />

        <GradientButton fullWidth onClick={handleGetStarted} size="lg">
          {loading ? "Loading..." : "Get Started"}
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

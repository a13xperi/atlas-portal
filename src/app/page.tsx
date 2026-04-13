"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import OnboardingShell from "@/components/layout/OnboardingShell";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [authLoading, user, router]);

  if (authLoading) return null;

  const handleContinueWithX = () => {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ?? "";
    window.location.href = `${apiUrl}/api/auth/x/login`;
  };

  return (
    <OnboardingShell maxWidth="480px">
      <div className="text-center">
        <h1 className="font-heading text-[56px] font-bold tracking-[-1.5px] bg-gradient-to-r from-atlas-text via-delphi-blue-400 to-atlas-text bg-clip-text text-transparent">
          ATLAS
        </h1>
        <p className="font-heading font-medium text-lg italic text-[#bcc9c7] mt-2">
          If you are here, you&apos;re already in the right place
        </p>
        <div className="mx-auto mt-6 h-px w-16 bg-gradient-to-r from-transparent via-delphi-blue-400/50 to-transparent" />

        <div className="h-10" />

        <button
          type="button"
          onClick={handleContinueWithX}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-atlas-surface border border-glass-border rounded-lg text-atlas-text hover:border-atlas-teal hover:bg-atlas-surface/80 transition-all"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span className="font-medium">Continue with X</span>
        </button>

        <div className="h-4" />

        <p className="text-xs text-atlas-text-secondary leading-5">
          Atlas uses your X account to sign you in and tune your voice.
          No passwords, no separate profile.
        </p>

        <div className="h-6" />

        <p className="text-atlas-text-muted text-xs tracking-wider uppercase">Powered by Delphi Digital</p>
      </div>
    </OnboardingShell>
  );
}

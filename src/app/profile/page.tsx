"use client";

import AppShell from "@/components/layout/AppShell";
import GradientButton from "@/components/ui/GradientButton";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();

  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-full bg-atlas-surface border border-glass-border flex items-center justify-center text-2xl text-atlas-text-secondary mb-6">
          A
        </div>
        <h1 className="font-heading text-2xl text-atlas-text">
          Analyst Profile
        </h1>
        <p className="text-atlas-text-secondary mt-2 max-w-md">
          Your profile settings, voice preferences, and account management will
          live here.
        </p>
        <div className="mt-8 flex gap-4">
          <GradientButton onClick={() => router.push("/voice-profiles")}>
            Voice Profiles
          </GradientButton>
          <GradientButton
            variant="outline-teal"
            onClick={() => router.push("/dashboard")}
          >
            Back to Dashboard
          </GradientButton>
        </div>
      </div>
    </AppShell>
  );
}

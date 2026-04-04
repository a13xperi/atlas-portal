"use client";

import NavBar from "@/components/ui/NavBar";
import OracleChat from "@/components/onboarding/OracleChat";

export default function OnboardingPage() {
  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-atlas-bg via-atlas-nav to-atlas-bg">
      <NavBar variant="onboarding" />
      <main className="flex-1 min-h-0 pt-14 px-3 sm:px-4">
        <div className="mx-auto h-full max-w-2xl">
          <OracleChat />
        </div>
      </main>
    </div>
  );
}

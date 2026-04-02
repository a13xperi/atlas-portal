"use client";

import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import GradientButton from "@/components/ui/GradientButton";

export default function AlertsPage() {
  const router = useRouter();

  return (
    <AppShell>
      <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center">
        <section className="bg-glass w-full max-w-2xl rounded-2xl border border-glass-border p-10 text-center backdrop-blur-xl sm:p-12">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-atlas-teal">
            Alerts
          </p>
          <h1 className="mt-4 font-heading text-3xl text-atlas-text sm:text-4xl">
            No alerts yet
          </h1>
          <p className="mt-4 text-sm text-atlas-text-secondary sm:text-base">
            No alerts yet &mdash; configure your subscriptions to start receiving
            signals.
          </p>
          <div className="mt-8 flex justify-center">
            <GradientButton onClick={() => router.push("/telegram")}>
              Enable Subscriptions
            </GradientButton>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

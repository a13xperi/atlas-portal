"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/ui/NavBar";
import FloatingOracle from "@/components/oracle/FloatingOracle";
import { useAuth } from "@/lib/auth";
import { gradients } from "@/lib/tokens";

export interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: gradients.appBg }}
      >
        <div
          role="status"
          aria-live="polite"
          className="animate-pulse text-atlas-text-secondary text-sm"
        >
          Loading…
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: gradients.appBg }}>
      <a
        href="#main-content"
        className="sr-only absolute left-4 top-4 z-[60] rounded-lg bg-atlas-nav px-3 py-2 text-sm text-atlas-text focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-atlas-teal"
      >
        Skip to main content
      </a>
      <NavBar variant="app" />
      <main id="main-content" className="overflow-x-hidden pt-14">
        <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </div>
      </main>
      <FloatingOracle />
    </div>
  );
}

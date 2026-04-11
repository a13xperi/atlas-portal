"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import NavBar from "@/components/ui/NavBar";
import { useAuth } from "@/lib/auth";
import { gradients } from "@/lib/tokens";

// Perf P0: FloatingOracle is a 267-line client component with its own oracle
// agent + framer-motion deps. It's not above-the-fold, never needs SSR, and
// pulls a meaningful chunk into the initial app bundle when imported
// statically. Lazy-loading it via next/dynamic with ssr:false drops it out
// of the first paint and into a separate chunk fetched after hydration.
const FloatingOracle = dynamic(
  () => import("@/components/oracle/FloatingOracle"),
  { ssr: false },
);

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

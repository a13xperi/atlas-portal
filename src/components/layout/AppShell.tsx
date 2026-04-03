"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/ui/NavBar";
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
        <div className="animate-pulse text-atlas-text-secondary text-sm">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: gradients.appBg }}>
      <NavBar variant="app" />
      <main className="overflow-x-hidden pt-14">
        <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

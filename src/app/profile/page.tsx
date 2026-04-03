"use client";

import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth";
import { LogOut, Shield, User } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <AppShell>
        <div className="mx-auto flex min-h-[60vh] w-full max-w-lg items-center justify-center">
          <div
            className="h-10 w-10 animate-spin rounded-full border-2 border-glass-border border-t-atlas-teal"
            aria-label="Loading profile"
          />
        </div>
      </AppShell>
    );
  }

  const onboardingTrack = (user as typeof user & { onboardingTrack?: string }).onboardingTrack;
  const formattedTrack = onboardingTrack
    ? onboardingTrack
        .split(/[-_ ]+/)
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(" ")
    : null;

  const roleBadgeClasses = {
    ANALYST: "border-atlas-teal/30 bg-atlas-teal/10 text-atlas-teal",
    MANAGER: "border-purple-400/30 bg-purple-500/10 text-purple-200",
    ADMIN: "border-atlas-error/30 bg-atlas-error/10 text-atlas-error",
  } as const;

  const handleSignOut = async () => {
    await Promise.resolve(logout());
    router.push("/");
  };

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-lg justify-center py-8">
        <div className="w-full bg-glass backdrop-blur-xl border border-glass-border rounded-2xl p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 text-sm text-atlas-text-secondary">
                <User className="h-4 w-4 text-atlas-teal" />
                <span>Profile</span>
              </div>

              <h1 className="font-heading text-3xl text-atlas-text">@{user.handle}</h1>

              {user.displayName && (
                <p className="mt-2 text-sm text-atlas-text-secondary">{user.displayName}</p>
              )}
            </div>

            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${roleBadgeClasses[user.role]}`}
            >
              <Shield className="h-3.5 w-3.5" />
              {user.role}
            </span>
          </div>

          <div className="mt-8 space-y-4">
            <div className="rounded-xl border border-glass-border bg-atlas-surface/40 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-atlas-text-secondary">
                Role
              </p>
              <p className="mt-2 text-sm text-atlas-text">{user.role}</p>
            </div>

            {formattedTrack && (
              <div className="rounded-xl border border-glass-border bg-atlas-surface/40 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-atlas-text-secondary">
                  Onboarding Track
                </p>
                <p className="mt-2 text-sm text-atlas-text">{formattedTrack}</p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              void handleSignOut();
            }}
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-atlas-error/40 px-4 py-3 text-sm font-semibold text-atlas-error transition-colors hover:bg-atlas-error/10"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </AppShell>
  );
}

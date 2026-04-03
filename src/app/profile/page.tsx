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

  const profileUser = user as typeof user & {
    onboardingTrack?: string;
    avatarUrl?: string | null;
  };
  const onboardingTrack = profileUser.onboardingTrack;
  const formattedTrack = onboardingTrack
    ? onboardingTrack
        .split(/[-_ ]+/)
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(" ")
    : null;
  const avatarInitials = profileUser.displayName
    ? profileUser.displayName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((segment) => segment.charAt(0).toUpperCase())
        .join("")
    : profileUser.handle.charAt(0).toUpperCase() || "?";
  const profileTitle = profileUser.displayName || `@${profileUser.handle}`;

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
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 inline-flex items-center gap-2 text-sm text-atlas-text-secondary">
              <User className="h-4 w-4 text-atlas-teal" />
              <span>Profile</span>
            </div>

            <div className="mb-6 flex flex-col items-center">
              <div className="mb-3 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-atlas-teal to-atlas-steel text-3xl font-heading text-white shadow-lg shadow-atlas-teal/20">
                {profileUser.avatarUrl ? (
                  <img
                    src={profileUser.avatarUrl}
                    alt={`${profileTitle} avatar`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  avatarInitials
                )}
              </div>

              <h1 className="font-heading text-3xl text-atlas-text">{profileTitle}</h1>

              {profileUser.email && (
                <p className="mt-2 text-sm text-atlas-text-secondary">{profileUser.email}</p>
              )}

              {profileUser.displayName && (
                <p className="mt-1 text-sm text-atlas-text-secondary">@{profileUser.handle}</p>
              )}

              <span
                className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${roleBadgeClasses[profileUser.role]}`}
              >
                <Shield className="h-3.5 w-3.5" />
                {profileUser.role}
              </span>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div className="rounded-xl border border-glass-border bg-atlas-surface/40 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-atlas-text-secondary">
                Handle
              </p>
              <p className="mt-2 text-sm text-atlas-text">@{profileUser.handle}</p>
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

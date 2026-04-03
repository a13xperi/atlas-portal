"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AtSign,
  Loader2,
  LogOut,
  Mail,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import { useAuth } from "@/lib/auth";
import { api, type User } from "@/lib/api";

interface ProfileFormState {
  email: string;
  displayName: string;
  bio: string;
}

const roleBadgeClasses: Record<User["role"], string> = {
  ANALYST: "border-atlas-teal/30 bg-atlas-teal/10 text-atlas-teal",
  MANAGER: "border-atlas-warning/30 bg-atlas-warning/10 text-atlas-warning",
  ADMIN: "border-atlas-error/30 bg-atlas-error/10 text-atlas-error",
};

function createFormState(user: Pick<User, "email" | "displayName" | "bio"> | null): ProfileFormState {
  return {
    email: user?.email ?? "",
    displayName: user?.displayName ?? "",
    bio: user?.bio ?? "",
  };
}

function normalizeField(value?: string | null) {
  return (value ?? "").trim();
}

function getAvatarInitials(profile: Pick<User, "displayName" | "handle">) {
  const source = normalizeField(profile.displayName) || profile.handle;

  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment.charAt(0).toUpperCase())
    .join("");
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<User | null>(user ?? null);
  const [formState, setFormState] = useState<ProfileFormState>(() => createFormState(user));
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    setProfile((current) => current ?? user);
    setFormState((current) => {
      if (current.email || current.displayName || current.bio) {
        return current;
      }

      return createFormState(user);
    });
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      setLoadingProfile(true);
      setError(null);

      try {
        const response = await api.users.profile();
        if (cancelled) {
          return;
        }

        setProfile(response.user);
        setFormState(createFormState(response.user));
      } catch (loadError: unknown) {
        if (cancelled) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load your profile."
        );
      } finally {
        if (!cancelled) {
          setLoadingProfile(false);
        }
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const hasUnsavedChanges = useMemo(() => {
    if (!profile) {
      return false;
    }

    return (
      normalizeField(formState.email) !== normalizeField(profile.email) ||
      normalizeField(formState.displayName) !== normalizeField(profile.displayName) ||
      normalizeField(formState.bio) !== normalizeField(profile.bio)
    );
  }, [formState, profile]);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!profile || !hasUnsavedChanges) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await api.users.updateProfile({
        email: formState.email.trim(),
        displayName: formState.displayName.trim(),
        bio: formState.bio.trim(),
      });

      setProfile(response.user);
      setFormState(createFormState(response.user));
      setSuccessMessage("Profile updated.");
    } catch (saveError: unknown) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setError(null);
    setSuccessMessage(null);
    await Promise.resolve(logout());
    router.push("/");
  };

  if (!profile) {
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

  const displayName = normalizeField(profile.displayName) || profile.handle;
  const avatarInitials = getAvatarInitials(profile);

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-8 flex flex-col gap-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-atlas-teal">
            Profile
          </p>
          <h1 className="font-heading text-3xl text-atlas-text">
            Account settings
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-atlas-text-secondary">
            Update how your analyst identity appears across Atlas and keep your
            contact details current.
          </p>
        </div>

            <div className="mb-6 flex flex-col items-center">
              <div className="mb-3 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-atlas-teal to-atlas-steel text-3xl font-heading text-white shadow-lg shadow-atlas-teal/20">
                {profileUser.avatarUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={profileUser.avatarUrl}
                      alt={`${profileTitle} avatar`}
                      className="h-full w-full object-cover"
                    />
                  </>
                ) : (
                  avatarInitials
                )}
              </div>

              <h2 className="mt-5 font-heading text-3xl text-atlas-text">
                {displayName}
              </h2>
              <p className="mt-2 flex items-center gap-2 text-sm text-atlas-text-secondary">
                <AtSign className="h-4 w-4 text-atlas-teal" />
                <span>{profile.handle}</span>
              </p>

              <span
                className={`mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${roleBadgeClasses[profile.role]}`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {profile.role}
              </span>
            </div>

            <div className="mt-8 space-y-3">
              <div className="rounded-2xl border border-glass-border bg-atlas-surface p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-atlas-text-secondary">
                  Email
                </p>
                <p className="mt-2 break-all text-sm text-atlas-text">
                  {normalizeField(profile.email) || "Add an email address below"}
                </p>
              </div>

              <div className="rounded-2xl border border-glass-border bg-atlas-surface p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-atlas-text-secondary">
                  About
                </p>
                <p className="mt-2 text-sm leading-6 text-atlas-text">
                  {normalizeField(profile.bio) ||
                    "Add a short bio so your teammates understand your coverage and tone."}
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard
            aria-label="Profile details"
            maxWidth="full"
            className="bg-atlas-surface/40"
          >
            <form className="space-y-6" onSubmit={handleSave}>
              <div className="flex items-start gap-3 rounded-2xl border border-glass-border bg-atlas-surface p-4">
                <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-glass-border bg-atlas-surface/80">
                  <UserRound className="h-5 w-5 text-atlas-teal" />
                </div>
                <div>
                  <h2 className="font-heading text-xl text-atlas-text">
                    Public profile
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-atlas-text-secondary">
                    These details appear across your workspace and help position
                    your analyst voice.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-[0.18em] text-atlas-text-secondary">
                    Email address
                  </span>
                  <div className="relative mt-2">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-atlas-text-secondary" />
                    <input
                      id="profile-email"
                      type="email"
                      value={formState.email}
                      onChange={(event) => {
                        setFormState((current) => ({
                          ...current,
                          email: event.target.value,
                        }));
                        setSuccessMessage(null);
                      }}
                      placeholder="name@atlasportal.ai"
                      autoComplete="email"
                      className="w-full rounded-2xl border border-glass-border bg-atlas-surface px-4 py-3 pl-11 text-sm text-atlas-text placeholder-atlas-text-secondary transition-colors focus:border-atlas-teal focus:outline-none"
                      aria-label="Email address"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-[0.18em] text-atlas-text-secondary">
                    Display name
                  </span>
                  <div className="relative mt-2">
                    <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-atlas-text-secondary" />
                    <input
                      id="profile-display-name"
                      type="text"
                      value={formState.displayName}
                      onChange={(event) => {
                        setFormState((current) => ({
                          ...current,
                          displayName: event.target.value,
                        }));
                        setSuccessMessage(null);
                      }}
                      placeholder="How your name should appear"
                      autoComplete="name"
                      className="w-full rounded-2xl border border-glass-border bg-atlas-surface px-4 py-3 pl-11 text-sm text-atlas-text placeholder-atlas-text-secondary transition-colors focus:border-atlas-teal focus:outline-none"
                      aria-label="Display name"
                    />
                  </div>
                </label>
              </div>

              <div className="rounded-2xl border border-glass-border bg-atlas-surface p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <label
                      htmlFor="profile-bio"
                      className="text-xs font-medium uppercase tracking-[0.18em] text-atlas-text-secondary"
                    >
                      Bio / about
                    </label>
                    <p className="mt-2 text-sm text-atlas-text-secondary">
                      Summarize your focus areas, markets, or editorial style.
                    </p>
                  </div>
                  <span className="rounded-full border border-glass-border px-3 py-1 text-xs text-atlas-text-secondary">
                    @{profile.handle}
                  </span>
                </div>

                <textarea
                  id="profile-bio"
                  value={formState.bio}
                  onChange={(event) => {
                    setFormState((current) => ({
                      ...current,
                      bio: event.target.value,
                    }));
                    setSuccessMessage(null);
                  }}
                  placeholder="Example: Bitcoin and macro analyst focused on structure, liquidity, and catalysts."
                  rows={6}
                  className="mt-4 w-full resize-none rounded-2xl border border-glass-border bg-atlas-surface px-4 py-3 text-sm leading-6 text-atlas-text placeholder-atlas-text-secondary transition-colors focus:border-atlas-teal focus:outline-none"
                  aria-label="Bio / about"
                />
              </div>

              <div className="flex flex-col gap-3 border-t border-glass-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="w-full sm:w-auto">
                  <GradientButton
                    fullWidth
                    variant="outline"
                    onClick={() => {
                      void handleLogout();
                    }}
                    disabled={saving}
                    aria-label="Log out"
                  >
                    <span className="inline-flex items-center gap-2">
                      <LogOut className="h-4 w-4" />
                      Log out
                    </span>
                  </GradientButton>
                </div>

                <div className="w-full sm:w-auto">
                  <GradientButton
                    fullWidth
                    type="submit"
                    disabled={saving || !hasUnsavedChanges || loadingProfile}
                    aria-label={saving ? "Saving profile" : "Save profile"}
                  >
                    <span className="inline-flex items-center gap-2">
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {saving ? "Saving..." : "Save profile"}
                    </span>
                  </GradientButton>
                </div>
              </div>
            </form>
          </GlassCard>
        </div>
      </div>
    </AppShell>
  );
}

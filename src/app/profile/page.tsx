"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import StatusPill from "@/components/ui/StatusPill";
import { api, type User, type VoiceProfile } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { gradients } from "@/lib/tokens";
import {
  ArrowRight,
  AtSign,
  Loader2,
  LogOut,
  MessageCircle,
  Mic2,
  Shield,
  User as UserIcon,
} from "lucide-react";
import type { ProfileStats } from "@/types/profile-stats";

type ProfileUser = (User & { voiceProfile?: VoiceProfile | null }) & {
  twitterId?: string | null;
  xAvatarUrl?: string | null;
};

const ZERO_PROFILE_STATS: ProfileStats = {
  draftsCreated: 0,
  tweetsPublished: 0,
  voicesSaved: 0,
  campaignsActive: 0,
};

const ROLE_BADGE_CLASSES: Record<ProfileUser["role"], string> = {
  ANALYST: "border-atlas-teal/30 bg-atlas-teal/10 text-atlas-teal",
  MANAGER: "border-delphi-blue-400/30 bg-delphi-blue-400/10 text-delphi-blue-300",
  ADMIN: "border-atlas-error/30 bg-atlas-error/10 text-atlas-error",
};

const PROFILE_STAT_CARDS: Array<{
  key: keyof ProfileStats;
  label: string;
}> = [
  { key: "draftsCreated", label: "Drafts Created" },
  { key: "tweetsPublished", label: "Tweets Published" },
  { key: "voicesSaved", label: "Voices Saved" },
  { key: "campaignsActive", label: "Campaigns Active" },
];

function toProfileUser(user: (User & { voiceProfile?: VoiceProfile | null }) | null): ProfileUser | null {
  return user ? (user as ProfileUser) : null;
}

function readStatNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function normalizeProfileStats(payload: unknown): ProfileStats {
  if (!payload || typeof payload !== "object") {
    return ZERO_PROFILE_STATS;
  }

  const root = payload as Record<string, unknown>;
  const source =
    root.stats && typeof root.stats === "object"
      ? (root.stats as Record<string, unknown>)
      : root;

  return {
    draftsCreated: readStatNumber(source.draftsCreated ?? source.drafts_created),
    tweetsPublished: readStatNumber(
      source.tweetsPublished ?? source.tweets_published,
    ),
    voicesSaved: readStatNumber(source.voicesSaved ?? source.voices_saved),
    campaignsActive: readStatNumber(
      source.campaignsActive ?? source.campaigns_active,
    ),
  };
}

async function loadProfileStats(): Promise<ProfileStats> {
  const usersApi = api.users as typeof api.users & {
    getStats?: () => Promise<unknown>;
  };

  if (typeof usersApi.getStats === "function") {
    const response = await usersApi.getStats();
    return normalizeProfileStats(response);
  }

  // TODO(profile): Replace this fallback once api.users.getStats is added to the typed API client.
  return Promise.resolve(ZERO_PROFILE_STATS);
}

function formatMaturityLabel(maturity?: VoiceProfile["maturity"] | null): string {
  if (!maturity) {
    return "Uncalibrated";
  }

  return `${maturity.charAt(0)}${maturity.slice(1).toLowerCase()}`;
}

function getVoiceProfileName(profile: VoiceProfile & { name?: string | null }): string {
  const explicitName = profile.name?.trim();

  if (explicitName) {
    return explicitName;
  }

  return `${formatMaturityLabel(profile.maturity)} Voice`;
}

function getProfileInitials(user: Pick<ProfileUser, "displayName" | "handle">): string {
  const displayName = user.displayName?.trim();

  if (displayName) {
    return displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((segment) => segment.charAt(0).toUpperCase())
      .join("");
  }

  return user.handle?.trim().charAt(0).toUpperCase() || "A";
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const authUser = toProfileUser(user);
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(authUser);
  const [displayName, setDisplayName] = useState(authUser?.displayName ?? "");
  const [stats, setStats] = useState<ProfileStats>(ZERO_PROFILE_STATS);
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(
    authUser?.voiceProfile ?? null,
  );
  const [voiceLoading, setVoiceLoading] = useState(!authUser?.voiceProfile);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    const nextUser = toProfileUser(user);
    setProfileUser(nextUser);
    setDisplayName(nextUser?.displayName ?? "");
    setVoiceProfile(nextUser?.voiceProfile ?? null);
  }, [user]);

  useEffect(() => {
    if (saveState === "idle") {
      return;
    }

    const timeoutId = window.setTimeout(() => setSaveState("idle"), 2500);

    return () => window.clearTimeout(timeoutId);
  }, [saveState]);

  const currentUser = profileUser ?? authUser;
  const sourceAvatarUrl = currentUser?.xAvatarUrl ?? currentUser?.avatarUrl ?? null;

  useEffect(() => {
    setAvatarFailed(false);
  }, [sourceAvatarUrl]);

  useEffect(() => {
    if (!currentUser?.id) {
      return;
    }

    let cancelled = false;
    setVoiceLoading(!currentUser.voiceProfile);

    void Promise.all([
      loadProfileStats().catch(() => ZERO_PROFILE_STATS),
      api.voice.getProfile().then((response) => response.profile ?? null).catch(() => null),
    ]).then(([nextStats, nextVoiceProfile]) => {
      if (cancelled) {
        return;
      }

      setStats(nextStats);
      setVoiceProfile(nextVoiceProfile);
      setVoiceLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, currentUser?.voiceProfile]);

  if (!currentUser) {
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

  const avatarUrl = avatarFailed ? null : sourceAvatarUrl;
  const profileInitials = getProfileInitials(currentUser);
  const isXConnected = Boolean(currentUser.twitterId);
  const isTelegramConnected = Boolean(currentUser.telegramChatId);
  const normalizedDisplayName = displayName.trim();
  const savedDisplayName = (currentUser.displayName ?? "").trim();
  const isUnchanged = normalizedDisplayName === savedDisplayName;

  const handleSaveDisplayName = async () => {
    setSaving(true);
    setSaveState("idle");

    try {
      const response = await api.users.updateProfile({
        displayName: normalizedDisplayName || undefined,
      });
      const nextUser = {
        ...currentUser,
        ...toProfileUser(response.user),
      };

      setProfileUser(nextUser);
      setDisplayName(nextUser.displayName ?? "");
      setSaveState("success");
    } catch {
      setSaveState("error");
    } finally {
      setSaving(false);
    }
  };

  const connectionRows = [
    {
      key: "x",
      label: "X / Twitter",
      description: isXConnected
        ? `Linked as @${currentUser.handle}`
        : "Connect X to sync your identity, avatar, and calibration source.",
      href: "/onboarding",
      connected: isXConnected,
      Icon: AtSign,
    },
    {
      key: "telegram",
      label: "Telegram",
      description: isTelegramConnected
        ? "Linked for alerts, queue updates, and chat-based actions."
        : "Link Telegram to receive alerts and manage your queue from chat.",
      href: "/telegram",
      connected: isTelegramConnected,
      Icon: MessageCircle,
    },
  ] as const;

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 py-4">
        <GlassCard maxWidth="full" className="px-6 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-4">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={`${currentUser.displayName || currentUser.handle} avatar`}
                  className="h-20 w-20 rounded-full border border-glass-border object-cover"
                  onError={() => setAvatarFailed(true)}
                />
              ) : (
                <div
                  aria-label="Profile initials"
                  className="flex h-20 w-20 items-center justify-center rounded-full border border-glass-border font-heading text-xl font-bold text-atlas-text"
                  style={{ background: gradients.bridge }}
                >
                  {profileInitials}
                </div>
              )}

              <div>
                <div className="inline-flex items-center gap-2 text-sm text-atlas-text-secondary">
                  <UserIcon className="h-4 w-4 text-atlas-teal" />
                  <span>Profile</span>
                </div>
                <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight text-atlas-text">
                  {currentUser.displayName || currentUser.handle}
                </h1>
                <p className="mt-1 text-sm text-atlas-text-secondary">
                  @{currentUser.handle}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${ROLE_BADGE_CLASSES[currentUser.role]}`}
              >
                <Shield className="h-3.5 w-3.5" />
                {currentUser.role}
              </span>

              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-atlas-error/40 px-4 py-2 text-sm font-semibold text-atlas-error transition-colors hover:bg-atlas-error/10"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <label
                htmlFor="profile-display-name"
                className="text-xs uppercase tracking-[0.18em] text-atlas-text-secondary"
              >
                Display Name
              </label>
              <input
                id="profile-display-name"
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Your display name"
                className="mt-2 w-full rounded-xl border border-glass-border bg-atlas-surface/50 px-4 py-3 text-sm text-atlas-text placeholder:text-atlas-text-secondary"
              />
            </div>

            <div className="flex flex-col items-start gap-2 lg:items-end">
              <GradientButton
                onClick={() => {
                  void handleSaveDisplayName();
                }}
                disabled={saving || isUnchanged}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </GradientButton>
              <p
                aria-live="polite"
                className={`text-sm ${
                  saveState === "error" ? "text-atlas-error" : "text-atlas-success"
                }`}
              >
                {saveState === "success"
                  ? "Saved."
                  : saveState === "error"
                    ? "Could not save changes."
                    : ""}
              </p>
            </div>
          </div>
        </GlassCard>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {PROFILE_STAT_CARDS.map((stat) => (
            <GlassCard
              key={stat.key}
              maxWidth="full"
              className="px-5 py-5 sm:px-5 sm:py-5"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-atlas-text-secondary">
                {stat.label}
              </p>
              <p className="mt-3 font-heading text-3xl font-bold text-atlas-text">
                {stats[stat.key]}
              </p>
            </GlassCard>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <GlassCard
            aria-label="Voice profile section"
            maxWidth="full"
            className="px-6 py-6 sm:px-8 sm:py-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 text-sm text-atlas-text-secondary">
                  <Mic2 className="h-4 w-4 text-atlas-teal" />
                  <span>Voice Profile</span>
                </div>
                <h2 className="mt-3 font-heading text-2xl font-bold text-atlas-text">
                  Voice Lab
                </h2>
              </div>

              {voiceProfile ? (
                <Link
                  href="/voice-lab"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-atlas-teal transition-colors hover:text-atlas-text"
                >
                  Edit in Voice Lab
                </Link>
              ) : null}
            </div>

            {voiceLoading && !voiceProfile ? (
              <p className="mt-6 text-sm text-atlas-text-secondary">
                Loading your calibrated voice profile...
              </p>
            ) : voiceProfile ? (
              <div className="mt-6 rounded-2xl border border-glass-border bg-atlas-surface/40 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-atlas-text-secondary">
                  Current Voice
                </p>
                <p className="mt-3 font-heading text-2xl font-bold text-atlas-text">
                  {getVoiceProfileName(
                    voiceProfile as VoiceProfile & { name?: string | null },
                  )}
                </p>
                <p className="mt-2 text-sm text-atlas-text-secondary">
                  {formatMaturityLabel(voiceProfile.maturity)} maturity ·{" "}
                  {voiceProfile.tweetsAnalyzed} tweets analyzed.
                </p>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-glass-border bg-atlas-surface/40 p-5">
                <p className="text-sm text-atlas-text-secondary">
                  You have not calibrated a voice profile yet.
                </p>
                <Link
                  href="/onboarding"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-atlas-teal transition-colors hover:text-atlas-text"
                >
                  <span>Calibrate your voice</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </GlassCard>

          <GlassCard
            aria-label="Connections section"
            maxWidth="full"
            className="px-6 py-6 sm:px-8 sm:py-8"
          >
            <div className="inline-flex items-center gap-2 text-sm text-atlas-text-secondary">
              <AtSign className="h-4 w-4 text-atlas-teal" />
              <span>Connections</span>
            </div>
            <h2 className="mt-3 font-heading text-2xl font-bold text-atlas-text">
              Linked accounts
            </h2>

            <div className="mt-6 space-y-4">
              {connectionRows.map(({ key, label, description, href, connected, Icon }) => (
                <div
                  key={key}
                  className="flex flex-col gap-4 rounded-2xl border border-glass-border bg-atlas-surface/40 p-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-atlas-surface/70 text-atlas-teal">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-atlas-text">{label}</p>
                      <p className="mt-1 text-sm text-atlas-text-secondary">
                        {description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 sm:flex-col sm:items-end">
                    <StatusPill
                      label={connected ? "Connected" : "Not Connected"}
                      variant={connected ? "posted" : "error"}
                    />
                    <Link
                      href={href}
                      className="text-xs font-semibold uppercase tracking-[0.18em] text-atlas-teal transition-colors hover:text-atlas-text"
                    >
                      Manage
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </AppShell>
  );
}

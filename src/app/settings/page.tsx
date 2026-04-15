"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import Modal from "@/components/ui/Modal";
import StatusPill from "@/components/ui/StatusPill";
import useSettings from "@/hooks/useSettings";
import { api, type VoiceProfile } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  COMMON_TIMEZONES,
  type NotificationPrefs,
  type ThemePref,
} from "@/types/settings";

const THEME_OPTIONS: Array<{
  value: ThemePref;
  label: string;
  description: string;
}> = [
  {
    value: "light",
    label: "Light",
    description: "Pin Atlas to the bright workspace palette.",
  },
  {
    value: "dark",
    label: "Dark",
    description: "Keep the glass-heavy dark theme locked in.",
  },
  {
    value: "auto",
    label: "Auto",
    description: "Placeholder toggle for automatic system matching.",
  },
];

const NOTIFICATION_OPTIONS: Array<{
  key: keyof NotificationPrefs;
  label: string;
  description: string;
}> = [
  {
    key: "briefing_email",
    label: "Briefing email",
    description: "Morning macro and market summaries sent to your inbox.",
  },
  {
    key: "alert_push",
    label: "Alert push",
    description: "Priority signal alerts surfaced as soon as they trigger.",
  },
  {
    key: "draft_reminders",
    label: "Draft reminders",
    description: "Nudges when good drafts are sitting unpublished.",
  },
  {
    key: "weekly_digest",
    label: "Weekly digest",
    description: "A weekly performance recap for output and engagement.",
  },
];

type PreferencesApi = typeof api.users & {
  updatePreferences?: (prefs: NotificationPrefs) => Promise<unknown>;
};
type VoiceApi = typeof api.voice & {
  deleteProfile?: () => Promise<unknown>;
};
type VoiceProfileWithName = VoiceProfile & { name?: string | null };

const updatePreferencesAction = (api.users as PreferencesApi).updatePreferences;
const deleteVoiceProfileAction = (api.voice as VoiceApi).deleteProfile;

function ThemeButton({
  active,
  description,
  disabled,
  label,
  onSelect,
}: {
  active: boolean;
  description: string;
  disabled: boolean;
  label: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onSelect}
      className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
        active
          ? "border-atlas-teal bg-atlas-teal/10 text-atlas-text"
          : "border-glass-border bg-atlas-nav text-atlas-text-secondary hover:border-atlas-teal/40 hover:text-atlas-text"
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <div className="text-sm font-semibold text-inherit">{label}</div>
      <p className="mt-1 text-xs text-atlas-text-muted">{description}</p>
    </button>
  );
}

function NotificationToggle({
  checked,
  description,
  disabled,
  label,
  onToggle,
}: {
  checked: boolean;
  description: string;
  disabled: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-glass-border bg-atlas-nav px-4 py-4 text-left transition-colors hover:border-atlas-teal/40 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <div>
        <div className="text-sm font-semibold text-atlas-text">{label}</div>
        <p className="mt-1 text-xs text-atlas-text-muted">{description}</p>
      </div>
      <span
        aria-hidden="true"
        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
          checked ? "bg-atlas-teal" : "bg-atlas-surface"
        }`}
      >
        <span
          className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </span>
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const { prefs, setPrefs, loading } = useSettings();
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfileWithName | null>(null);
  const [voiceLoading, setVoiceLoading] = useState(true);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [notificationSaveState, setNotificationSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingVoiceProfile, setDeletingVoiceProfile] = useState(false);
  const hasMountedNotificationSync = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function loadVoiceProfile() {
      try {
        const response = await api.voice.getProfile();

        if (cancelled) {
          return;
        }

        setVoiceProfile(response.profile as VoiceProfileWithName);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setVoiceError(
          error instanceof Error ? error.message : "Unable to load voice profile",
        );
      } finally {
        if (!cancelled) {
          setVoiceLoading(false);
        }
      }
    }

    void loadVoiceProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!hasMountedNotificationSync.current) {
      hasMountedNotificationSync.current = true;
      return;
    }

    if (!updatePreferencesAction) {
      // TODO: Wire notification settings to the user preferences endpoint once
      // api.users.updatePreferences is exposed in src/lib/api.ts.
      return;
    }

    const syncPreferences = updatePreferencesAction;
    let cancelled = false;

    async function syncNotificationPrefs() {
      setNotificationSaveState("saving");

      try {
        await syncPreferences(prefs.notifications);

        if (!cancelled) {
          setNotificationSaveState("saved");
        }
      } catch {
        if (!cancelled) {
          setNotificationSaveState("error");
        }
      }
    }

    void syncNotificationPrefs();

    return () => {
      cancelled = true;
    };
  }, [loading, prefs.notifications]);

  const notificationStatus = useMemo(() => {
    if (!updatePreferencesAction) {
      return { label: "Local only", variant: "feedback" as const };
    }

    if (notificationSaveState === "saving") {
      return { label: "Syncing", variant: "draft" as const };
    }

    if (notificationSaveState === "saved") {
      return { label: "Synced", variant: "posted" as const };
    }

    if (notificationSaveState === "error") {
      return { label: "Retry failed", variant: "error" as const };
    }

    return { label: "Ready", variant: "draft" as const };
  }, [notificationSaveState]);

  const voiceName =
    voiceProfile?.name?.trim() ||
    (voiceProfile ? "Personal Voice" : "No voice profile");

  const voiceStatus = useMemo(() => {
    if (voiceError) {
      return { label: "Unavailable", variant: "error" as const };
    }

    if (voiceLoading) {
      return { label: "Loading", variant: "draft" as const };
    }

    if ((voiceProfile?.tweetsAnalyzed ?? 0) > 0) {
      return { label: "Active", variant: "posted" as const };
    }

    return { label: "Needs calibration", variant: "feedback" as const };
  }, [voiceError, voiceLoading, voiceProfile]);

  const handleThemeChange = (theme: ThemePref) => {
    setPrefs((currentPrefs) => ({
      ...currentPrefs,
      theme,
    }));
  };

  const handleTimezoneChange = (timezone: string) => {
    if (!COMMON_TIMEZONES.includes(timezone as (typeof COMMON_TIMEZONES)[number])) {
      return;
    }

    setPrefs((currentPrefs) => ({
      ...currentPrefs,
      timezone: timezone as (typeof COMMON_TIMEZONES)[number],
    }));
  };

  const handleNotificationToggle = (key: keyof NotificationPrefs) => {
    setNotificationSaveState("idle");
    setPrefs((currentPrefs) => ({
      ...currentPrefs,
      notifications: {
        ...currentPrefs.notifications,
        [key]: !currentPrefs.notifications[key],
      },
    }));
  };

  const handleDeleteVoiceProfile = async () => {
    if (!deleteVoiceProfileAction) {
      return;
    }

    setDeletingVoiceProfile(true);

    try {
      await deleteVoiceProfileAction();
      setDeleteModalOpen(false);
      setVoiceProfile(null);
      router.push("/voice-lab");
    } catch (error) {
      setVoiceError(
        error instanceof Error ? error.message : "Unable to delete voice profile",
      );
    } finally {
      setDeletingVoiceProfile(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-atlas-text-muted">
              Workspace controls
            </p>
            <h1 className="font-heading text-4xl text-atlas-text">Settings</h1>
            <p className="max-w-2xl text-sm text-atlas-text-secondary">
              Configure local preferences, alert delivery, and voice controls
              without touching your identity profile.
            </p>
          </div>
          <StatusPill
            label={loading ? "Loading local state" : "Local preferences ready"}
            variant={loading ? "draft" : "posted"}
          />
        </header>

        <GlassCard maxWidth="full" aria-label="General settings" className="space-y-6">
          <div className="flex flex-col gap-3 border-b border-glass-border pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-2xl text-atlas-text">General</h2>
              <p className="mt-1 text-sm text-atlas-text-secondary">
                Keep the workspace aligned with your preferred theme and time zone.
              </p>
            </div>
            <StatusPill label="Saved locally" variant="draft" />
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-atlas-text">Theme preference</h3>
              <p className="mt-1 text-xs text-atlas-text-muted">
                Stored under <code>atlas_theme_pref</code> until the global theme system is wired.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {THEME_OPTIONS.map((option) => (
                <ThemeButton
                  key={option.value}
                  active={prefs.theme === option.value}
                  description={option.description}
                  disabled={loading}
                  label={option.label}
                  onSelect={() => handleThemeChange(option.value)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label
                htmlFor="settings-timezone"
                className="text-sm font-semibold text-atlas-text"
              >
                Time zone
              </label>
              <p className="mt-1 text-xs text-atlas-text-muted">
                Stored under <code>atlas_tz</code> for scheduling and reminder defaults.
              </p>
            </div>
            <select
              id="settings-timezone"
              value={prefs.timezone}
              disabled={loading}
              onChange={(event) => handleTimezoneChange(event.target.value)}
              className="w-full rounded-xl border border-glass-border bg-atlas-nav px-4 py-3 text-sm text-atlas-text outline-none transition-colors focus:border-atlas-teal disabled:cursor-not-allowed disabled:opacity-60"
            >
              {COMMON_TIMEZONES.map((timezone) => (
                <option key={timezone} value={timezone}>
                  {timezone}
                </option>
              ))}
            </select>
          </div>
        </GlassCard>

        <GlassCard maxWidth="full" aria-label="Notification settings" className="space-y-6">
          <div className="flex flex-col gap-3 border-b border-glass-border pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-2xl text-atlas-text">Notifications</h2>
              <p className="mt-1 text-sm text-atlas-text-secondary">
                Toggle message delivery for the Atlas workflows that matter most.
              </p>
            </div>
            <StatusPill
              label={notificationStatus.label}
              variant={notificationStatus.variant}
            />
          </div>

          <div className="grid gap-3">
            {NOTIFICATION_OPTIONS.map((option) => (
              <NotificationToggle
                key={option.key}
                checked={prefs.notifications[option.key]}
                description={option.description}
                disabled={loading}
                label={option.label}
                onToggle={() => handleNotificationToggle(option.key)}
              />
            ))}
          </div>
        </GlassCard>

        <GlassCard maxWidth="full" aria-label="Voice profile settings" className="space-y-6">
          <div className="flex flex-col gap-3 border-b border-glass-border pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-2xl text-atlas-text">Voice profile</h2>
              <p className="mt-1 text-sm text-atlas-text-secondary">
                Review the active Atlas voice profile and jump back into calibration.
              </p>
            </div>
            <StatusPill label={voiceStatus.label} variant={voiceStatus.variant} />
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-glass-border bg-atlas-nav px-4 py-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-atlas-text-muted">
                Current voice
              </p>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-semibold text-atlas-text">{voiceName}</h3>
                {voiceLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-atlas-text-muted" />
                ) : null}
              </div>
              <p className="text-sm text-atlas-text-secondary">
                {voiceError
                  ? voiceError
                  : voiceProfile
                    ? `${voiceProfile.tweetsAnalyzed} tweets analyzed${
                        voiceProfile.maturity ? ` - ${voiceProfile.maturity}` : ""
                      }`
                    : "No calibrated voice profile found yet."}
              </p>
            </div>

            <Link
              href="/voice-lab"
              className="inline-flex items-center gap-2 rounded-xl border border-glass-border px-4 py-3 text-sm font-semibold text-atlas-teal transition-colors hover:border-atlas-teal hover:bg-atlas-teal/10"
            >
              Recalibrate voice
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </GlassCard>

        <GlassCard maxWidth="full" aria-label="Danger zone" className="space-y-6 border-red-500/20">
          <div className="flex flex-col gap-3 border-b border-glass-border pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-2xl text-atlas-text">Danger zone</h2>
              <p className="mt-1 text-sm text-atlas-text-secondary">
                High-impact account actions are separated here on purpose.
              </p>
            </div>
            <StatusPill label="Protected actions" variant="error" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-glass-border bg-atlas-nav px-4 py-5">
              <h3 className="text-sm font-semibold text-atlas-text">Sign out</h3>
              <p className="mt-2 text-sm text-atlas-text-secondary">
                End the current Atlas session on this device.
              </p>
              <div className="mt-4">
                <GradientButton onClick={logout} variant="outline-warning">
                  Sign out
                </GradientButton>
              </div>
            </div>

            <div className="rounded-2xl border border-red-500/20 bg-atlas-nav px-4 py-5">
              <h3 className="text-sm font-semibold text-atlas-text">Delete voice profile</h3>
              <p className="mt-2 text-sm text-atlas-text-secondary">
                Remove the calibrated Atlas voice and start again from Voice Lab.
              </p>
              <div className="mt-4">
                {deleteVoiceProfileAction ? (
                  <button
                    type="button"
                    onClick={() => setDeleteModalOpen(true)}
                    className="inline-flex items-center justify-center rounded-xl border border-red-500/40 px-4 py-3 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/10"
                  >
                    Delete voice profile
                  </button>
                ) : (
                  <span title="Coming soon" className="inline-flex">
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center justify-center rounded-xl border border-red-500/20 px-4 py-3 text-sm font-semibold text-red-300/60 opacity-70"
                    >
                      Delete voice profile
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      <Modal
        description="This permanently removes your calibrated Atlas voice profile."
        isOpen={deleteModalOpen}
        onClose={() => {
          if (!deletingVoiceProfile) {
            setDeleteModalOpen(false);
          }
        }}
        title="Delete voice profile"
      >
        <div className="space-y-6">
          <p className="text-sm text-atlas-text-secondary">
            You will need to recalibrate from <code>/voice-lab</code> before Atlas can
            generate voice-aware drafts again.
          </p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deletingVoiceProfile}
              className="rounded-xl border border-glass-border px-4 py-3 text-sm font-semibold text-atlas-text-secondary transition-colors hover:border-atlas-teal hover:text-atlas-text disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteVoiceProfile()}
              disabled={deletingVoiceProfile}
              className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deletingVoiceProfile ? "Deleting..." : "Delete profile"}
            </button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}

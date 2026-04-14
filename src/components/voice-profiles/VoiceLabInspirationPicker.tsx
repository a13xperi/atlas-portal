"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  RefreshCw,
  Sparkles,
  Star,
  Users2,
} from "lucide-react";
import GradientButton from "@/components/ui/GradientButton";
import {
  api,
  ApiError,
  type BlendedVoiceProfile,
  type TwitterFollow,
  type VoiceProfile,
} from "@/lib/api";

const MAX_VISIBLE_FOLLOWS = 12;
const MAX_ADDITIONAL_INSPIRATIONS = 3;

interface VoiceLabInspirationPickerProps {
  onProfileRefresh?: (profile: VoiceProfile) => void;
}

interface XLinkStatus {
  linked: boolean;
  tokenExpired?: boolean;
  xHandle?: string | null;
}

function isApiErrorWithStatus(error: unknown, statusCode: number) {
  return error instanceof ApiError && error.statusCode === statusCode;
}

function sameSelection(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

function buildVisibleFollows(
  follows: TwitterFollow[],
  selectedIds: string[]
) {
  const ordered = [...follows].sort((left, right) => {
    if (right.followerCount !== left.followerCount) {
      return right.followerCount - left.followerCount;
    }

    return left.handle.localeCompare(right.handle);
  });
  const followLookup = new Map(ordered.map((follow) => [follow.id, follow]));
  const pinned = selectedIds
    .map((id) => followLookup.get(id))
    .filter((follow): follow is TwitterFollow => Boolean(follow));
  const pinnedIds = new Set(pinned.map((follow) => follow.id));
  const remaining = ordered
    .filter((follow) => !pinnedIds.has(follow.id))
    .slice(0, Math.max(0, MAX_VISIBLE_FOLLOWS - pinned.length));

  return [...pinned, ...remaining];
}

function getHandleLabel(follow: TwitterFollow) {
  return follow.handle ? `@${follow.handle}` : "Unknown handle";
}

export default function VoiceLabInspirationPicker({
  onProfileRefresh,
}: VoiceLabInspirationPickerProps) {
  const [xStatus, setXStatus] = useState<XLinkStatus | null>(null);
  const [savedProfile, setSavedProfile] = useState<BlendedVoiceProfile | null>(
    null
  );
  const [allFollows, setAllFollows] = useState<TwitterFollow[]>([]);
  const [primaryId, setPrimaryId] = useState("");
  const [additionalIds, setAdditionalIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFollows, setLoadingFollows] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showConnectedMessage, setShowConnectedMessage] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    setShowConnectedMessage(params.get("x_connected") === "true");
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadVoiceLab() {
      setLoading(true);
      setError(null);

      try {
        const [xStatusResponse, savedProfileResponse] = await Promise.all([
          api.auth.x.status(),
          api.voice.getBlendedProfile().catch((loadError: unknown) => {
            if (isApiErrorWithStatus(loadError, 404)) {
              return null;
            }

            throw loadError;
          }),
        ]);

        if (cancelled) {
          return;
        }

        setXStatus(xStatusResponse);

        if (savedProfileResponse?.profile) {
          setSavedProfile(savedProfileResponse.profile);
          setPrimaryId(savedProfileResponse.profile.primaryTwitterId);
          setAdditionalIds(savedProfileResponse.profile.additionalTwitterIds);
        }

        if (!xStatusResponse.linked) {
          return;
        }

        setLoadingFollows(true);

        const followsResponse = await api.twitter.follows();

        if (cancelled) {
          return;
        }

        setAllFollows(followsResponse.follows);
      } catch (loadError: unknown) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load Voice Lab inspirations."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingFollows(false);
        }
      }
    }

    void loadVoiceLab();

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleFollows = useMemo(
    () => buildVisibleFollows(allFollows, [primaryId, ...additionalIds].filter(Boolean)),
    [additionalIds, allFollows, primaryId]
  );

  const selectedCount = (primaryId ? 1 : 0) + additionalIds.length;
  const hasSavedSelection = Boolean(savedProfile?.primaryTwitterId);
  const hasUnsavedChanges =
    primaryId !== (savedProfile?.primaryTwitterId ?? "") ||
    !sameSelection(additionalIds, savedProfile?.additionalTwitterIds ?? []);

  const primaryFollow = visibleFollows.find((follow) => follow.id === primaryId);
  const savedPrimaryHandle = savedProfile?.primaryHandle
    ? `@${savedProfile.primaryHandle}`
    : null;

  const handleConnectX = async () => {
    setError(null);

    try {
      const { url } = await api.auth.x.authorize();
      localStorage.setItem("x_oauth_source", "voice-lab");
      window.location.href = url;
    } catch (authorizeError: unknown) {
      setError(
        authorizeError instanceof Error
          ? authorizeError.message
          : "Could not start X account linking."
      );
    }
  };

  const handleSetPrimary = (followId: string) => {
    setPrimaryId(followId);
    setAdditionalIds((current) => current.filter((id) => id !== followId));
    setSuccessMessage(null);
  };

  const handleToggleAdditional = (followId: string) => {
    if (primaryId === followId) {
      return;
    }

    setAdditionalIds((current) => {
      if (current.includes(followId)) {
        return current.filter((id) => id !== followId);
      }

      if (current.length >= MAX_ADDITIONAL_INSPIRATIONS) {
        return current;
      }

      return [...current, followId];
    });
    setSuccessMessage(null);
  };

  const handleSave = async () => {
    if (!primaryId || saving) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await api.voice.blend(primaryId, additionalIds);

      const [profileResponse, blendedProfileResponse] = await Promise.all([
        api.voice.getProfile().catch(() => null),
        api.voice.getBlendedProfile().catch(() => null),
      ]);

      if (profileResponse?.profile && onProfileRefresh) {
        onProfileRefresh(profileResponse.profile);
      }

      if (blendedProfileResponse?.profile) {
        setSavedProfile(blendedProfileResponse.profile);
        setPrimaryId(blendedProfileResponse.profile.primaryTwitterId);
        setAdditionalIds(blendedProfileResponse.profile.additionalTwitterIds);
      }

      setSuccessMessage("Voice inspirations saved to your profile.");
    } catch (saveError: unknown) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save Voice Lab inspirations."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-glass-border bg-atlas-surface/50 p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-atlas-teal" />
          <p className="text-sm text-atlas-text-secondary">
            Loading Voice Lab inspirations...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-glass-border bg-glass p-6 backdrop-blur-xl">
      <div className="flex flex-col gap-4 border-b border-glass-border pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-delphi-blue-400">
            Voice Lab
          </p>
          <h3 className="mt-2 font-heading text-2xl font-bold tracking-tight text-atlas-text">
            Choose inspiration voices from your X follows
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-atlas-text-secondary">
            Pick one primary account and up to {MAX_ADDITIONAL_INSPIRATIONS} additional inspirations.
            Atlas uses their recent tweets to shape your calibrated voice profile.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-atlas-teal/30 bg-atlas-teal/10 px-3 py-1 text-xs font-semibold text-atlas-teal">
            {selectedCount} selected
          </span>
          <span className="rounded-full border border-glass-border bg-atlas-surface/70 px-3 py-1 text-xs text-atlas-text-secondary">
            Slim list: {Math.min(visibleFollows.length, MAX_VISIBLE_FOLLOWS)} follows for now
          </span>
        </div>
      </div>

      {showConnectedMessage ? (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-atlas-success/30 bg-atlas-success/10 px-4 py-3 text-sm text-atlas-success">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>
            X account connected. Atlas pulled your follows so you can set your inspiration mix.
          </span>
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="mt-5 rounded-2xl border border-atlas-error/30 bg-atlas-error/10 px-4 py-3 text-sm text-atlas-error"
        >
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div
          role="status"
          className="mt-5 rounded-2xl border border-atlas-success/30 bg-atlas-success/10 px-4 py-3 text-sm text-atlas-success"
        >
          {successMessage}
        </div>
      ) : null}

      {!xStatus?.linked ? (
        <div className="mt-6 rounded-2xl border border-dashed border-glass-border bg-atlas-surface/40 px-6 py-10 text-center">
          <Sparkles className="mx-auto h-6 w-6 text-atlas-teal" />
          <h4 className="mt-3 font-heading text-xl font-semibold text-atlas-text">
            Connect X to unlock inspiration picking
          </h4>
          <p className="mt-2 text-sm leading-6 text-atlas-text-secondary">
            Voice Lab needs your authenticated X follows to suggest real inspiration accounts.
          </p>
          <div className="mt-5 flex justify-center">
            <GradientButton onClick={handleConnectX}>
              Connect X account
            </GradientButton>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 rounded-2xl border border-glass-border bg-atlas-surface/40 p-4 lg:grid-cols-[minmax(0,1.2fr)_320px]">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-atlas-text">
                <Users2 className="h-4 w-4 text-atlas-teal" />
                Inspiration snapshot
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <div className="rounded-2xl border border-glass-border bg-atlas-surface px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-atlas-text-secondary">
                    Primary
                  </p>
                  <p className="mt-2 text-sm font-semibold text-atlas-text">
                    {primaryFollow?.displayName ||
                      savedPrimaryHandle ||
                      "Not selected yet"}
                  </p>
                  <p className="mt-1 text-xs text-atlas-text-secondary">
                    {primaryFollow ? getHandleLabel(primaryFollow) : "Choose the main voice anchor"}
                  </p>
                </div>

                <div className="rounded-2xl border border-glass-border bg-atlas-surface px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-atlas-text-secondary">
                    Additional
                  </p>
                  <p className="mt-2 text-sm font-semibold text-atlas-text">
                    {additionalIds.length} of {MAX_ADDITIONAL_INSPIRATIONS} selected
                  </p>
                  <p className="mt-1 text-xs text-atlas-text-secondary">
                    Optional voices that add flavor around the primary
                  </p>
                </div>

                {hasSavedSelection && savedProfile ? (
                  <div className="rounded-2xl border border-glass-border bg-atlas-surface px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-atlas-text-secondary">
                      Last save
                    </p>
                    <p className="mt-2 text-sm font-semibold text-atlas-text">
                      {savedProfile.tweetsAnalyzed} tweets analyzed
                    </p>
                    <p className="mt-1 text-xs text-atlas-text-secondary">
                      {savedProfile.blendSummary || "Current inspiration mix is active"}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-glass-border bg-atlas-nav/80 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-atlas-text-secondary">
                Active X account
              </p>
              <p className="mt-2 text-sm font-semibold text-atlas-text">
                {xStatus.xHandle ? `@${xStatus.xHandle}` : "Connected"}
              </p>
              <p className="mt-2 text-sm leading-6 text-atlas-text-secondary">
                Atlas keeps this first release intentionally narrow so picking inspirations stays fast.
              </p>
              <div className="mt-4">
                <GradientButton
                  fullWidth
                  onClick={handleSave}
                  disabled={!primaryId || !hasUnsavedChanges || saving}
                >
                  <span className="inline-flex items-center gap-2">
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    {saving ? "Applying inspirations..." : "Apply inspirations"}
                  </span>
                </GradientButton>
              </div>
            </div>
          </div>

          {loadingFollows ? (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-glass-border bg-atlas-surface/40 px-4 py-6 text-sm text-atlas-text-secondary">
              <Loader2 className="h-5 w-5 animate-spin text-atlas-teal" />
              Fetching your X follows...
            </div>
          ) : visibleFollows.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-glass-border bg-atlas-surface/40 px-6 py-10 text-center">
              <Sparkles className="mx-auto h-6 w-6 text-atlas-teal" />
              <p className="mt-3 text-sm font-medium text-atlas-text">
                No follows available yet
              </p>
              <p className="mt-2 text-sm leading-6 text-atlas-text-secondary">
                Follow a few accounts on X, then come back and refresh Voice Lab.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {visibleFollows.map((follow) => {
                const isPrimary = primaryId === follow.id;
                const isAdditional = additionalIds.includes(follow.id);
                const additionalDisabled =
                  !isAdditional &&
                  !isPrimary &&
                  additionalIds.length >= MAX_ADDITIONAL_INSPIRATIONS;

                return (
                  <article
                    key={follow.id}
                    className={`rounded-2xl border p-4 transition-colors ${
                      isPrimary || isAdditional
                        ? "border-atlas-teal/60 bg-atlas-teal/10"
                        : "border-glass-border bg-atlas-surface/60"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {follow.avatarUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={follow.avatarUrl}
                          alt={`${follow.displayName} avatar`}
                          className="h-14 w-14 rounded-full border border-glass-border object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-atlas-teal/30 bg-atlas-teal/10 text-base font-semibold uppercase text-atlas-teal">
                          {(follow.displayName || follow.handle || "?").charAt(0)}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-atlas-text">
                            {follow.displayName}
                          </p>
                          {isPrimary ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-atlas-teal/30 bg-atlas-teal/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-atlas-teal">
                              <Star className="h-3 w-3" />
                              Primary
                            </span>
                          ) : null}
                          {!isPrimary && isAdditional ? (
                            <span className="rounded-full border border-glass-border bg-atlas-surface px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-atlas-text-secondary">
                              Additional
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-atlas-text-secondary">
                          {getHandleLabel(follow)}
                        </p>
                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-atlas-text-secondary">
                          {follow.bio || "No bio available for this follow yet."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-glass-border pt-4">
                      <p className="text-xs text-atlas-text-muted">
                        {follow.followerCount.toLocaleString()} followers
                      </p>
                      <div className="flex gap-2">
                        <GradientButton
                          size="sm"
                          variant={isPrimary ? "primary" : "outline-teal"}
                          onClick={() => handleSetPrimary(follow.id)}
                        >
                          {isPrimary ? "Primary selected" : "Set primary"}
                        </GradientButton>
                        <GradientButton
                          size="sm"
                          variant={isAdditional ? "primary" : "outline"}
                          onClick={() => handleToggleAdditional(follow.id)}
                          disabled={additionalDisabled}
                        >
                          {isAdditional ? "Remove additional" : "Add secondary"}
                        </GradientButton>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

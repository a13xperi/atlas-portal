"use client";

import { useAuth } from "./auth";

/**
 * Minimum number of analyzed tweets required before a user can generate
 * drafts. Calibration is "done enough" once the voice profile contains at
 * least this many samples — fewer than that and we don't trust the model
 * to write in the user's voice.
 *
 * Source of truth lives here so the Crafting page, the gate hook, and any
 * future surfaces (Reply mode, News mode, Campaigns) all reference the
 * same number.
 */
export const MIN_TWEETS_FOR_VOICE_CALIBRATION = 3;

export type VoiceGateReason = "no_profile" | "insufficient_tweets" | null;

export interface VoiceGateState {
  /**
   * True when tweet generation must be blocked. UI should hide or disable
   * generate buttons and show the empty state.
   */
  isBlocked: boolean;
  /**
   * Why the user is blocked, if at all. `null` means generation is allowed.
   * - "no_profile": user has no voiceProfile row at all (not onboarded)
   * - "insufficient_tweets": profile exists but tweetsAnalyzed is below the floor
   */
  reason: VoiceGateReason;
  /**
   * How many more tweets need to be analyzed before the gate lifts.
   * Always >= 0. Zero when generation is allowed.
   */
  tweetsRemaining: number;
  /**
   * Current tweetsAnalyzed value (0 if no profile yet). Useful for progress UI.
   */
  tweetsAnalyzed: number;
  /**
   * Where to send the user to fix the gate. Always points at the most
   * actionable next step:
   * - "no_profile" → /onboarding/track-b (X-first calibration flow)
   * - "insufficient_tweets" → /voice-profiles (Voice Lab where they add more)
   */
  ctaHref: string;
  /**
   * Human label for the CTA button. Short, action-oriented.
   */
  ctaLabel: string;
}

/**
 * Single source of truth for the "voice must be calibrated before tweet
 * generation" rule. Reads from the auth context and returns a snapshot
 * the caller can use to gate UI and route the user toward the fix.
 *
 * Used by: Crafting page, and any future surface that triggers
 * `api.drafts.generate`. Mirrors the backend guard at POST /api/drafts/generate
 * (HTTP 422 / VOICE_NOT_CALIBRATED), so the frontend can fail fast without
 * waiting on a round-trip.
 */
export function useVoiceGate(): VoiceGateState {
  const { user } = useAuth();

  const profile = user?.voiceProfile ?? null;
  const tweetsAnalyzed = profile?.tweetsAnalyzed ?? 0;

  let reason: VoiceGateReason = null;
  if (!profile) {
    reason = "no_profile";
  } else if (tweetsAnalyzed < MIN_TWEETS_FOR_VOICE_CALIBRATION) {
    reason = "insufficient_tweets";
  }

  const isBlocked = reason !== null;
  const tweetsRemaining = isBlocked
    ? Math.max(MIN_TWEETS_FOR_VOICE_CALIBRATION - tweetsAnalyzed, 0)
    : 0;

  const ctaHref = reason === "no_profile" ? "/onboarding/track-b" : "/voice-profiles";
  const ctaLabel =
    reason === "no_profile" ? "Calibrate voice" : "Open Voice Lab";

  return {
    isBlocked,
    reason,
    tweetsRemaining,
    tweetsAnalyzed,
    ctaHref,
    ctaLabel,
  };
}

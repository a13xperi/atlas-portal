import type { BlendVoice } from "@/lib/api";
import { getTwitterAvatarUrl } from "@/lib/public-urls";

export interface MinimalUser {
  handle?: string | null;
  avatarUrl?: string | null;
  displayName?: string | null;
}

/**
 * The backend's `withSafeReferenceVoice` creates a synthetic fallback
 * referenceVoice when the real one is missing. It uses the user's own
 * data (handle, avatarUrl) and sets an id like `self:${userId}`.
 * We detect this so we don't show the user's avatar for inspiration accounts.
 */
function isSyntheticSelfFallback(
  referenceVoice: { id?: string } | null | undefined
): boolean {
  return !!referenceVoice?.id?.startsWith("self:");
}

/**
 * True when this BlendVoice represents the authoring user themselves,
 * not an inspiration/reference account.
 *
 * Rules (in priority order):
 *   1. Explicit `isSelf` flag on the voice (future-proofing).
 *   2. No referenceVoiceId AND (no referenceVoice OR synthetic self fallback).
 *   3. Label matches "My voice" / "Me" / "You" (case-insensitive, trimmed) —
 *      defensive against backend rows that mistakenly attach a referenceVoice
 *      to the user's own slot.
 */
export function isSelfVoice(
  voice: Pick<BlendVoice, "label" | "referenceVoice" | "referenceVoiceId"> & { isSelf?: boolean }
): boolean {
  if (voice.isSelf === true) return true;
  const label = (voice.label ?? "").trim().toLowerCase();

  // Known self labels always indicate the user's own voice
  if (label === "my voice" || label === "me" || label === "you" || label === "your voice" || label === "own voice") {
    return true;
  }

  const realRef =
    voice.referenceVoice && !isSyntheticSelfFallback(voice.referenceVoice)
      ? voice.referenceVoice
      : null;

  // A real linked reference voice means it's an inspiration account
  if (voice.referenceVoiceId && realRef) return false;

  // No reference link at all: empty label defaults to self,
  // anything else is treated as an inspiration account with a missing DB link.
  if (!voice.referenceVoiceId && !realRef) {
    if (!label) return true;
    return false;
  }

  return false;
}

/**
 * Single source of truth for which avatar URL to render for a BlendVoice.
 * Returns empty string when no image source is available (caller shows initials).
 */
export function resolveVoiceAvatar(
  voice: Pick<BlendVoice, "label" | "referenceVoice" | "referenceVoiceId"> & { isSelf?: boolean },
  user?: MinimalUser | null
): string {
  if (isSelfVoice(voice)) {
    if (user?.avatarUrl) return user.avatarUrl;
    if (user?.handle) return getTwitterAvatarUrl(user.handle) ?? "";
    return "";
  }

  const realRef =
    voice.referenceVoice && !isSyntheticSelfFallback(voice.referenceVoice)
      ? voice.referenceVoice
      : null;

  if (realRef?.avatarUrl) return realRef.avatarUrl;
  if (realRef?.handle) {
    return getTwitterAvatarUrl(realRef.handle) ?? "";
  }

  // Fallback: if the backend didn't link a real reference voice but the label
  // looks like a handle (e.g. "cobie" or "@cobie"), derive the avatar from it.
  const labelHandle = voice.label?.replace(/^@/, "").trim();
  if (labelHandle) {
    return getTwitterAvatarUrl(labelHandle) ?? "";
  }

  return "";
}

export function voiceInitials(
  voice: Pick<BlendVoice, "label">,
  user?: MinimalUser | null
): string {
  if (isSelfVoice(voice as BlendVoice)) {
    const src = user?.displayName || user?.handle || voice.label || "?";
    return src.trim().charAt(0).toUpperCase();
  }
  return (voice.label || "?").trim().charAt(0).toUpperCase();
}

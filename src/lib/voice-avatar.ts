import type { BlendVoice } from "@/lib/api";
import { getTwitterAvatarUrl } from "@/lib/public-urls";

export interface MinimalUser {
  handle?: string | null;
  avatarUrl?: string | null;
  displayName?: string | null;
}

/**
 * True when this BlendVoice represents the authoring user themselves,
 * not an inspiration/reference account.
 *
 * Rules (in priority order):
 *   1. Explicit `isSelf` flag on the voice (future-proofing).
 *   2. No referenceVoiceId AND no referenceVoice object.
 *   3. Label matches "My voice" / "Me" / "You" (case-insensitive, trimmed) —
 *      defensive against backend rows that mistakenly attach a referenceVoice
 *      to the user's own slot.
 */
export function isSelfVoice(
  voice: Pick<BlendVoice, "label" | "referenceVoice" | "referenceVoiceId"> & { isSelf?: boolean }
): boolean {
  if (voice.isSelf === true) return true;
  if (!voice.referenceVoiceId && !voice.referenceVoice) return true;
  const label = (voice.label ?? "").trim().toLowerCase();
  if (label === "my voice" || label === "me" || label === "you") return true;
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
  if (voice.referenceVoice?.avatarUrl) return voice.referenceVoice.avatarUrl;
  if (voice.referenceVoice?.handle) {
    return getTwitterAvatarUrl(voice.referenceVoice.handle) ?? "";
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

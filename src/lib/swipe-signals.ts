import type { SwipeSignal } from "./oracle-types";
import type { VoiceDimensionField, VoiceDimensions } from "./voice-profile-dimensions";

export const SWIPE_REASON_OPTIONS = [
  { label: "Punchy", value: "punchy" },
  { label: "Contrarian", value: "contrarian" },
  { label: "Funny", value: "funny" },
  { label: "Data-driven", value: "data-driven" },
  { label: "Plain-spoken", value: "plain-spoken" },
  { label: "Snarky", value: "snarky" },
] as const;

type SwipeReasonValue = (typeof SWIPE_REASON_OPTIONS)[number]["value"];

const REASON_TO_DIMENSION_DELTAS: Record<
  SwipeReasonValue,
  Partial<Record<VoiceDimensionField, number>>
> = {
  punchy: { brevity: 10 },
  contrarian: { contrarianTone: 15 },
  funny: { humor: 10 },
  "data-driven": { evidenceOrientation: 15 },
  "plain-spoken": { technicalDepth: -10, formality: -5 },
  snarky: { directness: 10, humor: 5 },
};

const KNOWN_REASONS = new Set<string>(
  SWIPE_REASON_OPTIONS.map((option) => option.value)
);

function clampSwipeDelta(value: number) {
  return Math.max(-20, Math.min(20, Math.round(value)));
}

export function normalizeSwipeReason(reason: string) {
  return reason.trim().toLowerCase().replace(/[\s_]+/g, "-");
}

export function isKnownSwipeReason(reason: string) {
  return KNOWN_REASONS.has(normalizeSwipeReason(reason));
}

export function aggregateSwipeSignals(
  signals: SwipeSignal[]
): Partial<VoiceDimensions> {
  const totals: Partial<Record<VoiceDimensionField, number>> = {};

  for (const signal of signals) {
    if (signal.direction !== "like") {
      continue;
    }

    for (const reason of signal.reasons) {
      const normalizedReason = normalizeSwipeReason(reason) as SwipeReasonValue;
      const deltas = REASON_TO_DIMENSION_DELTAS[normalizedReason];

      if (!deltas) {
        continue;
      }

      for (const [field, delta] of Object.entries(deltas) as Array<
        [VoiceDimensionField, number]
      >) {
        totals[field] = (totals[field] ?? 0) + delta;
      }
    }
  }

  return Object.fromEntries(
    Object.entries(totals).map(([field, total]) => [
      field,
      clampSwipeDelta(total),
    ])
  ) as Partial<VoiceDimensions>;
}

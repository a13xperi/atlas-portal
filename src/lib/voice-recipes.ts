import type { BlendVoice, ReferenceAccount, SavedBlend } from "@/lib/api";
import {
  DEFAULT_VOICE_DIMENSIONS,
  pickVoiceDimensions,
  VOICE_DIMENSION_FIELDS,
  VOICE_DIMENSION_SECTIONS,
  type VoiceDimensionField,
  type VoiceDimensions,
} from "@/lib/voice-profile-dimensions";

const PERSONAL_SOURCE_KEYS = new Set(["personal", "personal voice", "my voice"]);

const DIMENSION_LABELS = new Map<VoiceDimensionField, string>(
  VOICE_DIMENSION_SECTIONS.flatMap((section) =>
    section.dimensions.map(({ field, label }) => [field, label] as const)
  )
);

const CATEGORY_DIMENSIONS: Record<string, Partial<VoiceDimensions>> = {
  "crypto/vc": {
    formality: 62,
    technicalDepth: 76,
    confidence: 72,
    evidenceOrientation: 74,
    solutionOrientation: 66,
    socialPosture: 46,
  },
  macro: {
    formality: 70,
    contrarianTone: 64,
    technicalDepth: 72,
    confidence: 74,
    evidenceOrientation: 84,
  },
  defi: {
    directness: 64,
    technicalDepth: 82,
    confidence: 68,
    evidenceOrientation: 76,
    solutionOrientation: 74,
  },
  content: {
    humor: 78,
    formality: 28,
    brevity: 76,
    warmth: 66,
    socialPosture: 80,
  },
  culture: {
    humor: 82,
    formality: 24,
    brevity: 68,
    warmth: 78,
    socialPosture: 84,
  },
  tech: {
    formality: 58,
    directness: 72,
    technicalDepth: 88,
    evidenceOrientation: 72,
    solutionOrientation: 84,
  },
  philosophy: {
    formality: 72,
    brevity: 34,
    contrarianTone: 68,
    warmth: 58,
    technicalDepth: 66,
  },
  researcher: {
    formality: 76,
    technicalDepth: 86,
    confidence: 66,
    evidenceOrientation: 90,
    solutionOrientation: 70,
  },
  trader: {
    brevity: 74,
    contrarianTone: 78,
    directness: 82,
    confidence: 86,
    evidenceOrientation: 62,
  },
  shitposter: {
    humor: 88,
    formality: 18,
    brevity: 80,
    contrarianTone: 70,
    warmth: 62,
    socialPosture: 84,
  },
};

const LABEL_DIMENSION_RULES: Array<{
  pattern: RegExp;
  presetKey: keyof typeof CATEGORY_DIMENSIONS;
}> = [
  { pattern: /research|analyst|thread/i, presetKey: "researcher" },
  { pattern: /trader|macro|gcr|pento|alpha/i, presetKey: "trader" },
  { pattern: /shitpost|shitposter|degen|cobie|meme/i, presetKey: "shitposter" },
  { pattern: /builder|tech|dev/i, presetKey: "tech" },
  { pattern: /philosophy|naval/i, presetKey: "philosophy" },
];

export interface VoiceDimensionSnapshot {
  deltaFromNeutral: number;
  field: VoiceDimensionField;
  label: string;
  value: number;
}

function normalizeVoiceKey(value?: string | null) {
  return value?.trim().toLowerCase().replace(/^@/, "") ?? "";
}

function isPersonalVoiceSource(label?: string | null) {
  return PERSONAL_SOURCE_KEYS.has(normalizeVoiceKey(label));
}

function buildReferenceLookup(accounts: ReferenceAccount[]) {
  const lookup = new Map<string, ReferenceAccount>();

  for (const account of accounts) {
    const keys = [
      account.id,
      account.handle,
      account.displayName,
      account.name,
    ];

    for (const key of keys) {
      const normalizedKey = normalizeVoiceKey(key);

      if (normalizedKey) {
        lookup.set(normalizedKey, account);
      }
    }
  }

  return lookup;
}

function resolveReferenceDimensions(
  blendVoice: SavedBlend["voices"][number],
  lookup: Map<string, ReferenceAccount>
) {
  const explicitReference = blendVoice.referenceVoice;
  const referenceAccount =
    lookup.get(normalizeVoiceKey(explicitReference?.id)) ||
    lookup.get(normalizeVoiceKey(explicitReference?.handle)) ||
    lookup.get(normalizeVoiceKey(explicitReference?.name)) ||
    lookup.get(normalizeVoiceKey(blendVoice.label));

  const categoryKey = normalizeVoiceKey(referenceAccount?.category);
  const categoryPreset = CATEGORY_DIMENSIONS[categoryKey];

  if (categoryPreset) {
    return pickVoiceDimensions(categoryPreset);
  }

  const matchingLabelRule = LABEL_DIMENSION_RULES.find(({ pattern }) =>
    pattern.test(blendVoice.label)
  );

  if (matchingLabelRule) {
    return pickVoiceDimensions(CATEGORY_DIMENSIONS[matchingLabelRule.presetKey]);
  }

  return DEFAULT_VOICE_DIMENSIONS;
}

export function buildBlendFingerprint(
  blend: SavedBlend,
  personalDimensions: VoiceDimensions,
  accounts: ReferenceAccount[]
) {
  const totalWeight =
    blend.voices.reduce(
      (sum, voice) => sum + Math.max(0, voice.percentage),
      0
    ) || 100;
  const referenceLookup = buildReferenceLookup(accounts);
  const totals = VOICE_DIMENSION_FIELDS.reduce<Record<VoiceDimensionField, number>>(
    (accumulator, field) => {
      accumulator[field] = 0;
      return accumulator;
    },
    {} as Record<VoiceDimensionField, number>
  );

  for (const voice of blend.voices) {
    const sourceDimensions = isPersonalVoiceSource(voice.label)
      ? personalDimensions
      : resolveReferenceDimensions(voice, referenceLookup);
    const weight = Math.max(0, voice.percentage) / totalWeight;

    for (const field of VOICE_DIMENSION_FIELDS) {
      totals[field] += sourceDimensions[field] * weight;
    }
  }

  return pickVoiceDimensions(totals);
}

export function getNotableVoiceDimensions(
  dimensions: VoiceDimensions,
  count = 5
): VoiceDimensionSnapshot[] {
  return VOICE_DIMENSION_FIELDS.map((field) => ({
    deltaFromNeutral: Math.abs(dimensions[field] - 50),
    field,
    label: DIMENSION_LABELS.get(field) ?? field,
    value: dimensions[field],
  }))
    .sort((left, right) => right.deltaFromNeutral - left.deltaFromNeutral)
    .slice(0, count);
}

export function getVoiceDimensionLabel(field: VoiceDimensionField) {
  return DIMENSION_LABELS.get(field) ?? field;
}

export function normalizeReferenceSelectionKey(value?: string | null) {
  return normalizeVoiceKey(value);
}

export function buildReferenceAccountLookup(accounts: ReferenceAccount[]) {
  return buildReferenceLookup(accounts);
}

/**
 * Resolve the ReferenceAccount that corresponds to a blend voice so we can
 * display avatars + Twitter profile links on recipe cards even when the
 * backend did not attach a full `referenceVoice` object to the blend voice.
 *
 * Returns `null` when the voice is the user's personal voice or cannot be
 * matched to any known account.
 */
export function resolveReferenceAccountForVoice(
  voice: Pick<BlendVoice, "label" | "referenceVoice">,
  lookup: Map<string, ReferenceAccount>
): ReferenceAccount | null {
  if (isPersonalVoiceSource(voice.label)) {
    return null;
  }

  const explicit = voice.referenceVoice;

  return (
    lookup.get(normalizeVoiceKey(explicit?.id)) ||
    lookup.get(normalizeVoiceKey(explicit?.handle)) ||
    lookup.get(normalizeVoiceKey(explicit?.name)) ||
    lookup.get(normalizeVoiceKey(voice.label)) ||
    null
  );
}

export function isPersonalVoiceLabel(label?: string | null) {
  return isPersonalVoiceSource(label);
}

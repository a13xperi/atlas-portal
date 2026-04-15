export const VOICE_DIMENSION_FIELDS = [
  "humor",
  "formality",
  "brevity",
  "contrarianTone",
  "directness",
  "warmth",
  "technicalDepth",
  "confidence",
  "evidenceOrientation",
  "solutionOrientation",
  "socialPosture",
  "selfPromotionalIntensity",
] as const;

export type VoiceDimensionField = (typeof VOICE_DIMENSION_FIELDS)[number];

export type VoiceDimensions = Record<VoiceDimensionField, number>;

export interface VoiceDimensionSection {
  title: string;
  description: string;
  dimensions: Array<{
    field: VoiceDimensionField;
    label: string;
    minLabel: string;
    maxLabel: string;
  }>;
}

export const DEFAULT_VOICE_DIMENSIONS: VoiceDimensions = {
  humor: 50,
  formality: 50,
  brevity: 50,
  contrarianTone: 50,
  directness: 50,
  warmth: 50,
  technicalDepth: 50,
  confidence: 50,
  evidenceOrientation: 50,
  solutionOrientation: 50,
  socialPosture: 50,
  selfPromotionalIntensity: 50,
};

export const TRACK_A_INITIAL_DIMENSIONS: VoiceDimensions = {
  ...DEFAULT_VOICE_DIMENSIONS,
  humor: 35,
  formality: 20,
  brevity: 60,
  contrarianTone: 45,
  directness: 62,
  warmth: 44,
  technicalDepth: 72,
  confidence: 64,
  evidenceOrientation: 68,
  solutionOrientation: 56,
  socialPosture: 48,
  selfPromotionalIntensity: 18,
};

export const VOICE_DIMENSION_SECTIONS: VoiceDimensionSection[] = [
  {
    title: "Core Voice",
    description: "The high-level signals that shape the overall tone of every post.",
    dimensions: [
      { field: "humor", label: "Humor", minLabel: "Serious", maxLabel: "Playful" },
      { field: "formality", label: "Formality", minLabel: "Casual", maxLabel: "Formal" },
      { field: "brevity", label: "Brevity", minLabel: "Wordy", maxLabel: "Punchy" },
      { field: "contrarianTone", label: "Contrarian tone", minLabel: "Consensus", maxLabel: "Contrarian" },
    ],
  },
  {
    title: "Communication Style",
    description: "How the voice sounds in delivery, confidence, and complexity.",
    dimensions: [
      { field: "directness", label: "Directness", minLabel: "Diplomatic", maxLabel: "Blunt" },
      { field: "warmth", label: "Warmth", minLabel: "Cool", maxLabel: "Warm" },
      { field: "technicalDepth", label: "Technical depth", minLabel: "Plain", maxLabel: "Technical" },
      { field: "confidence", label: "Confidence", minLabel: "Tentative", maxLabel: "Assertive" },
    ],
  },
  {
    title: "Content Approach",
    description: "What the writing optimizes for when it makes a point.",
    dimensions: [
      { field: "evidenceOrientation", label: "Evidence orientation", minLabel: "Intuitive", maxLabel: "Data-driven" },
      { field: "solutionOrientation", label: "Solution orientation", minLabel: "Problem-framing", maxLabel: "Solution-focused" },
      { field: "socialPosture", label: "Social posture", minLabel: "Reserved", maxLabel: "Outgoing" },
      { field: "selfPromotionalIntensity", label: "Self-promotional intensity", minLabel: "Humble", maxLabel: "Promotional" },
    ],
  },
];

function clampVoiceDimension(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function pickVoiceDimensions(
  values?: Partial<Record<VoiceDimensionField, number>> | null
): VoiceDimensions {
  return VOICE_DIMENSION_FIELDS.reduce<VoiceDimensions>((accumulator, field) => {
    const nextValue = values?.[field];
    accumulator[field] = clampVoiceDimension(
      typeof nextValue === "number" ? nextValue : DEFAULT_VOICE_DIMENSIONS[field]
    );
    return accumulator;
  }, { ...DEFAULT_VOICE_DIMENSIONS });
}

export function applyVoiceDimensionDelta(
  current: VoiceDimensions,
  delta: Partial<Record<VoiceDimensionField, number>>,
  multiplier = 1
): VoiceDimensions {
  return VOICE_DIMENSION_FIELDS.reduce<VoiceDimensions>((accumulator, field) => {
    const adjustment = (delta[field] ?? 0) * multiplier;
    accumulator[field] = clampVoiceDimension(current[field] + adjustment);
    return accumulator;
  }, { ...current });
}

export function hasAnyVoiceDimension(dimensions: VoiceDimensions) {
  return Object.values(dimensions).some((value) => value > 0);
}

export function hasCalibratedVoiceDimensions(
  profile: Partial<VoiceDimensions> & { tweetsAnalyzed?: number; maturity?: string | null } | null | undefined
): boolean {
  if (!profile) return false;
  const anyDimDifferent = VOICE_DIMENSION_FIELDS.some(
    (field) => (profile[field] ?? 50) !== 50
  );
  if (anyDimDifferent) return true;
  if ((profile.tweetsAnalyzed ?? 0) > 0) return true;
  if (profile.maturity !== null && profile.maturity !== undefined) return true;
  return false;
}

export function formatVoiceDimensionValue(value: number) {
  return `${Math.round(clampVoiceDimension(value) / 10)}/10`;
}

export function styleToDimensions(style: string | null): VoiceDimensions {
  switch (style) {
    case "Fun":
      return {
        humor: 80,
        formality: 20,
        brevity: 70,
        contrarianTone: 55,
        directness: 65,
        warmth: 78,
        technicalDepth: 45,
        confidence: 72,
        evidenceOrientation: 42,
        solutionOrientation: 58,
        socialPosture: 76,
        selfPromotionalIntensity: 38,
      };
    case "Serious":
      return {
        humor: 15,
        formality: 75,
        brevity: 50,
        contrarianTone: 40,
        directness: 58,
        warmth: 34,
        technicalDepth: 84,
        confidence: 68,
        evidenceOrientation: 88,
        solutionOrientation: 74,
        socialPosture: 44,
        selfPromotionalIntensity: 18,
      };
    case "Custom mix":
    default:
      return { ...DEFAULT_VOICE_DIMENSIONS };
  }
}

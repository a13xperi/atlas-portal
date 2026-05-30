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
      { field: "humor", label: "Humor" },
      { field: "formality", label: "Formality" },
      { field: "brevity", label: "Brevity" },
      { field: "contrarianTone", label: "Contrarian tone" },
    ],
  },
  {
    title: "Communication Style",
    description: "How the voice sounds in delivery, confidence, and complexity.",
    dimensions: [
      { field: "directness", label: "Directness" },
      { field: "warmth", label: "Warmth" },
      { field: "technicalDepth", label: "Technical depth" },
      { field: "confidence", label: "Confidence" },
    ],
  },
  {
    title: "Content Approach",
    description: "What the writing optimizes for when it makes a point.",
    dimensions: [
      { field: "evidenceOrientation", label: "Evidence orientation" },
      { field: "solutionOrientation", label: "Solution orientation" },
      { field: "socialPosture", label: "Social posture" },
      { field: "selfPromotionalIntensity", label: "Self-promotional intensity" },
    ],
  },
];

type VoiceProfileNameSignal = readonly [
  field: VoiceDimensionField,
  target: number,
  weight?: number,
];

interface VoiceProfileNameRule {
  label: string;
  signals: readonly VoiceProfileNameSignal[];
}

const VOICE_PROFILE_MODIFIER_RULES: readonly VoiceProfileNameRule[] = [
  {
    label: "Witty",
    signals: [
      ["humor", 82, 1.4],
      ["warmth", 64, 1],
      ["brevity", 68, 1],
      ["formality", 28, 1.2],
    ],
  },
  {
    label: "Dry",
    signals: [
      ["humor", 18, 1.4],
      ["formality", 68, 1.1],
      ["brevity", 72, 1],
      ["warmth", 34, 1],
      ["technicalDepth", 66, 1],
    ],
  },
  {
    label: "Formal",
    signals: [
      ["formality", 86, 1.5],
      ["humor", 22, 1.2],
      ["evidenceOrientation", 74, 1],
      ["technicalDepth", 68, 1],
    ],
  },
  {
    label: "Casual",
    signals: [
      ["formality", 18, 1.5],
      ["humor", 70, 1.1],
      ["warmth", 70, 1],
      ["socialPosture", 74, 1],
    ],
  },
  {
    label: "Sharp",
    signals: [
      ["directness", 82, 1.4],
      ["confidence", 74, 1],
      ["brevity", 66, 1],
      ["warmth", 42, 1],
    ],
  },
  {
    label: "Bold",
    signals: [
      ["confidence", 82, 1.3],
      ["contrarianTone", 72, 1.2],
      ["directness", 74, 1],
      ["selfPromotionalIntensity", 60, 1],
    ],
  },
  {
    label: "Warm",
    signals: [
      ["warmth", 86, 1.5],
      ["humor", 58, 1],
      ["socialPosture", 64, 1],
      ["directness", 56, 1],
    ],
  },
  {
    label: "Cold",
    signals: [
      ["warmth", 18, 1.5],
      ["formality", 72, 1.1],
      ["technicalDepth", 72, 1],
      ["evidenceOrientation", 74, 1],
    ],
  },
  {
    label: "Concise",
    signals: [
      ["brevity", 88, 1.6],
      ["directness", 72, 1.1],
      ["technicalDepth", 46, 1],
      ["warmth", 46, 1],
    ],
  },
  {
    label: "Deep",
    signals: [
      ["technicalDepth", 88, 1.5],
      ["evidenceOrientation", 82, 1.1],
      ["brevity", 34, 1.2],
      ["solutionOrientation", 72, 1],
    ],
  },
  {
    label: "Blunt",
    signals: [
      ["directness", 92, 1.5],
      ["contrarianTone", 72, 1.2],
      ["warmth", 24, 1.2],
      ["brevity", 72, 1],
    ],
  },
  {
    label: "Data-Driven",
    signals: [
      ["evidenceOrientation", 92, 1.5],
      ["technicalDepth", 78, 1.2],
      ["formality", 72, 1],
      ["humor", 24, 1.1],
    ],
  },
  {
    label: "Balanced",
    signals: [
      ["humor", 50, 1.1],
      ["formality", 50, 1.1],
      ["brevity", 50, 1],
      ["directness", 50, 1],
      ["warmth", 50, 1.1],
      ["technicalDepth", 50, 1],
      ["confidence", 50, 1],
    ],
  },
];

const VOICE_PROFILE_ARCHETYPE_RULES: readonly VoiceProfileNameRule[] = [
  {
    label: "Analyst",
    signals: [
      ["evidenceOrientation", 88, 1.5],
      ["technicalDepth", 76, 1.2],
      ["confidence", 68, 1],
      ["formality", 62, 1],
      ["socialPosture", 46, 1],
    ],
  },
  {
    label: "Engineer",
    signals: [
      ["solutionOrientation", 84, 1.5],
      ["technicalDepth", 82, 1.3],
      ["directness", 72, 1.1],
      ["formality", 56, 1],
      ["humor", 38, 1],
    ],
  },
  {
    label: "Educator",
    signals: [
      ["warmth", 78, 1.4],
      ["solutionOrientation", 72, 1.2],
      ["evidenceOrientation", 72, 1.1],
      ["technicalDepth", 64, 1],
      ["directness", 56, 1],
    ],
  },
  {
    label: "Pundit",
    signals: [
      ["confidence", 82, 1.3],
      ["socialPosture", 74, 1.2],
      ["contrarianTone", 62, 1.1],
      ["formality", 56, 1],
      ["brevity", 60, 1],
    ],
  },
  {
    label: "Contrarian",
    signals: [
      ["contrarianTone", 90, 1.6],
      ["directness", 78, 1.2],
      ["confidence", 74, 1],
      ["warmth", 28, 1],
      ["formality", 46, 1],
    ],
  },
  {
    label: "Shitposter",
    signals: [
      ["humor", 92, 1.6],
      ["brevity", 84, 1.2],
      ["formality", 16, 1.4],
      ["socialPosture", 84, 1.2],
      ["warmth", 60, 1],
    ],
  },
  {
    label: "Researcher",
    signals: [
      ["evidenceOrientation", 92, 1.6],
      ["technicalDepth", 90, 1.4],
      ["formality", 78, 1.2],
      ["confidence", 62, 1],
      ["selfPromotionalIntensity", 18, 1.2],
    ],
  },
  {
    label: "Influencer",
    signals: [
      ["socialPosture", 90, 1.6],
      ["selfPromotionalIntensity", 78, 1.4],
      ["confidence", 80, 1.1],
      ["warmth", 68, 1],
      ["humor", 62, 1],
    ],
  },
  {
    label: "Builder",
    signals: [
      ["solutionOrientation", 86, 1.6],
      ["technicalDepth", 74, 1.2],
      ["directness", 72, 1.1],
      ["confidence", 70, 1],
      ["socialPosture", 44, 1],
    ],
  },
  {
    label: "Signal Caller",
    signals: [
      ["brevity", 88, 1.5],
      ["confidence", 84, 1.3],
      ["directness", 82, 1.3],
      ["contrarianTone", 68, 1.1],
      ["evidenceOrientation", 60, 1],
    ],
  },
  {
    label: "Commentator",
    signals: [
      ["socialPosture", 68, 1.2],
      ["warmth", 56, 1.1],
      ["confidence", 70, 1.1],
      ["humor", 52, 1],
      ["brevity", 58, 1],
      ["formality", 48, 1],
    ],
  },
];

function clampVoiceDimension(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function scoreVoiceProfileRule(
  dimensions: VoiceDimensions,
  signals: readonly VoiceProfileNameSignal[]
) {
  let totalWeight = 0;
  let totalScore = 0;

  for (const [field, target, weight = 1] of signals) {
    totalWeight += weight;
    totalScore += (100 - Math.abs(dimensions[field] - target)) * weight;
  }

  return totalWeight > 0 ? totalScore / totalWeight : 0;
}

function pickVoiceProfileRule(
  dimensions: VoiceDimensions,
  rules: readonly VoiceProfileNameRule[]
) {
  let bestRule = rules[0];
  let bestScore = scoreVoiceProfileRule(dimensions, bestRule.signals);

  for (const rule of rules.slice(1)) {
    const score = scoreVoiceProfileRule(dimensions, rule.signals);

    if (score > bestScore) {
      bestRule = rule;
      bestScore = score;
    }
  }

  return bestRule.label;
}

function formatVoiceProfileHandle(
  handles: ReadonlyArray<string | null | undefined>
) {
  for (const handle of handles) {
    const trimmed = handle?.trim();

    if (trimmed) {
      return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
    }
  }

  return null;
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

export function formatVoiceDimensionValue(value: number) {
  return `${Math.round(clampVoiceDimension(value) / 10)}/10`;
}

/**
 * Generates a deterministic two-word voice profile name from a dimension
 * fingerprint and optional reference handles.
 */
export function generateVoiceProfileName(
  dimensions: VoiceDimensions,
  handles: ReadonlyArray<string | null | undefined> = []
) {
  const normalizedDimensions = pickVoiceDimensions(dimensions);
  const modifier = pickVoiceProfileRule(
    normalizedDimensions,
    VOICE_PROFILE_MODIFIER_RULES
  );
  const archetype = pickVoiceProfileRule(
    normalizedDimensions,
    VOICE_PROFILE_ARCHETYPE_RULES
  );
  const handle = formatVoiceProfileHandle(handles);

  return handle
    ? `${modifier} ${archetype} (a la ${handle})`
    : `${modifier} ${archetype}`;
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

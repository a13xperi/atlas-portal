import type { VoiceDimensions } from "@/lib/voice-profile-dimensions";
import type { ReferenceAccount, SavedBlend } from "@/lib/api";
import {
  buildBlendFingerprint,
  buildReferenceAccountLookup,
  isPersonalVoiceLabel,
  resolveReferenceAccountForVoice,
} from "@/lib/voice-recipes";

type ArchetypeField =
  | "humor"
  | "formality"
  | "brevity"
  | "contrarianTone"
  | "technicalDepth"
  | "confidence"
  | "warmth"
  | "evidenceOrientation";

export interface VoiceNamingHandle {
  category?: string | null;
  handle?: string | null;
  isPersonal?: boolean;
  label?: string | null;
  percentage?: number | null;
}

type VoiceNamingHandleInput = VoiceNamingHandle | string;

const ARCHETYPE_FIELDS: ArchetypeField[] = [
  "humor",
  "formality",
  "brevity",
  "contrarianTone",
  "technicalDepth",
  "confidence",
  "warmth",
  "evidenceOrientation",
];

const GENERIC_VOICE_PROFILE_NAMES = new Set([
  "",
  "custom blend",
  "custom mix",
  "my starting blend",
  "onboarding blend",
  "untitled voice",
]);

const VOICE_ARCHETYPES: Array<{
  centroid: Record<ArchetypeField, number>;
  name: string;
}> = [
  {
    name: "Analyst",
    centroid: {
      humor: 25,
      formality: 70,
      brevity: 45,
      contrarianTone: 40,
      technicalDepth: 80,
      confidence: 65,
      warmth: 40,
      evidenceOrientation: 85,
    },
  },
  {
    name: "Researcher",
    centroid: {
      humor: 20,
      formality: 75,
      brevity: 30,
      contrarianTone: 45,
      technicalDepth: 85,
      confidence: 60,
      warmth: 45,
      evidenceOrientation: 90,
    },
  },
  {
    name: "Skeptic",
    centroid: {
      humor: 35,
      formality: 60,
      brevity: 60,
      contrarianTone: 80,
      technicalDepth: 65,
      confidence: 70,
      warmth: 35,
      evidenceOrientation: 75,
    },
  },
  {
    name: "Contrarian",
    centroid: {
      humor: 45,
      formality: 40,
      brevity: 70,
      contrarianTone: 85,
      technicalDepth: 60,
      confidence: 85,
      warmth: 30,
      evidenceOrientation: 60,
    },
  },
  {
    name: "Trader",
    centroid: {
      humor: 40,
      formality: 35,
      brevity: 80,
      contrarianTone: 70,
      technicalDepth: 55,
      confidence: 85,
      warmth: 35,
      evidenceOrientation: 60,
    },
  },
  {
    name: "Shitposter",
    centroid: {
      humor: 88,
      formality: 18,
      brevity: 80,
      contrarianTone: 70,
      technicalDepth: 35,
      confidence: 75,
      warmth: 60,
      evidenceOrientation: 30,
    },
  },
  {
    name: "Educator",
    centroid: {
      humor: 55,
      formality: 50,
      brevity: 45,
      contrarianTone: 30,
      technicalDepth: 70,
      confidence: 60,
      warmth: 78,
      evidenceOrientation: 75,
    },
  },
  {
    name: "Builder",
    centroid: {
      humor: 45,
      formality: 55,
      brevity: 55,
      contrarianTone: 35,
      technicalDepth: 88,
      confidence: 70,
      warmth: 55,
      evidenceOrientation: 70,
    },
  },
  {
    name: "Philosopher",
    centroid: {
      humor: 40,
      formality: 72,
      brevity: 30,
      contrarianTone: 65,
      technicalDepth: 65,
      confidence: 65,
      warmth: 58,
      evidenceOrientation: 60,
    },
  },
  {
    name: "Cheerleader",
    centroid: {
      humor: 65,
      formality: 35,
      brevity: 70,
      contrarianTone: 20,
      technicalDepth: 45,
      confidence: 80,
      warmth: 82,
      evidenceOrientation: 45,
    },
  },
];

const MODIFIER_RULES: Array<{
  getDelta: (dimensions: VoiceDimensions) => number;
  modifier: string;
}> = [
  {
    modifier: "Playful",
    getDelta: (dimensions) => (dimensions.humor >= 75 ? dimensions.humor - 50 : 0),
  },
  {
    modifier: "Dry",
    getDelta: (dimensions) => (dimensions.humor <= 25 ? 50 - dimensions.humor : 0),
  },
  {
    modifier: "Measured",
    getDelta: (dimensions) =>
      dimensions.formality >= 75 ? dimensions.formality - 50 : 0,
  },
  {
    modifier: "Casual",
    getDelta: (dimensions) =>
      dimensions.formality <= 25 ? 50 - dimensions.formality : 0,
  },
  {
    modifier: "Punchy",
    getDelta: (dimensions) => (dimensions.brevity >= 75 ? dimensions.brevity - 50 : 0),
  },
  {
    modifier: "Sprawling",
    getDelta: (dimensions) =>
      dimensions.brevity <= 25 ? 50 - dimensions.brevity : 0,
  },
  {
    modifier: "Contrarian",
    getDelta: (dimensions) =>
      dimensions.contrarianTone >= 75 ? dimensions.contrarianTone - 50 : 0,
  },
  {
    modifier: "Consensus",
    getDelta: (dimensions) =>
      dimensions.contrarianTone <= 25 ? 50 - dimensions.contrarianTone : 0,
  },
  {
    modifier: "Blunt",
    getDelta: (dimensions) =>
      dimensions.directness >= 75 ? dimensions.directness - 50 : 0,
  },
  {
    modifier: "Warm",
    getDelta: (dimensions) => (dimensions.warmth >= 75 ? dimensions.warmth - 50 : 0),
  },
  {
    modifier: "Cold",
    getDelta: (dimensions) => (dimensions.warmth <= 25 ? 50 - dimensions.warmth : 0),
  },
  {
    modifier: "Technical",
    getDelta: (dimensions) =>
      dimensions.technicalDepth >= 80 ? dimensions.technicalDepth - 50 : 0,
  },
  {
    modifier: "Bold",
    getDelta: (dimensions) =>
      dimensions.confidence >= 80 ? dimensions.confidence - 50 : 0,
  },
  {
    modifier: "Rigorous",
    getDelta: (dimensions) =>
      dimensions.evidenceOrientation >= 80
        ? dimensions.evidenceOrientation - 50
        : 0,
  },
];

const CATEGORY_MODIFIER_OVERRIDES: Record<string, string> = {
  builder: "Crisp",
  culture: "Loud",
  macro: "Sharp",
  philosophy: "Quiet",
  researcher: "Measured",
  research: "Measured",
  shitposter: "Degen",
  tech: "Crisp",
  trader: "Sharp",
};

function normalizeHandle(value?: string | null) {
  return value?.trim().replace(/^@+/, "") ?? "";
}

function normalizeCategory(value?: string | null) {
  return value?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";
}

function normalizeHandleInput(input: VoiceNamingHandleInput): VoiceNamingHandle {
  if (typeof input === "string") {
    return { handle: input };
  }

  return input;
}

function isNeutralDimensions(dimensions: VoiceDimensions) {
  return Object.values(dimensions).every((value) => value === 50);
}

function getArchetypeDistance(
  dimensions: VoiceDimensions,
  centroid: Record<ArchetypeField, number>
) {
  return ARCHETYPE_FIELDS.reduce((sum, field) => {
    const delta = dimensions[field] - centroid[field];
    return sum + delta * delta;
  }, 0);
}

function pickArchetype(dimensions: VoiceDimensions) {
  let winner = VOICE_ARCHETYPES[0];
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const archetype of VOICE_ARCHETYPES) {
    const distance = getArchetypeDistance(dimensions, archetype.centroid);

    if (distance < bestDistance) {
      bestDistance = distance;
      winner = archetype;
    }
  }

  return winner.name;
}

function getDominantHandle(handles: VoiceNamingHandle[]) {
  const candidates = handles
    .filter((handle) => !handle.isPersonal && (handle.percentage ?? 0) > 0)
    .sort((left, right) => (right.percentage ?? 0) - (left.percentage ?? 0));

  if (candidates.length === 0) {
    return null;
  }

  if ((candidates[0].percentage ?? 0) === (candidates[1]?.percentage ?? -1)) {
    return null;
  }

  return candidates[0];
}

function getModifierOverride(handle: VoiceNamingHandle | null) {
  if (!handle || (handle.percentage ?? 0) < 60) {
    return null;
  }

  const category = normalizeCategory(handle.category);

  return CATEGORY_MODIFIER_OVERRIDES[category] ?? null;
}

function pickModifier(dimensions: VoiceDimensions, archetype: string) {
  const rankedRules = MODIFIER_RULES.map((rule, index) => ({
    delta: rule.getDelta(dimensions),
    index,
    modifier: rule.modifier,
  }))
    .filter((rule) => rule.delta >= 20)
    .sort((left, right) => right.delta - left.delta || left.index - right.index);

  const nonDuplicateModifier = rankedRules.find(
    (rule) => rule.modifier.toLowerCase() !== archetype.toLowerCase()
  );

  return nonDuplicateModifier?.modifier ?? rankedRules[0]?.modifier ?? "Balanced";
}

function getHandleSuffix(handle: VoiceNamingHandle | null) {
  if (!handle) {
    return "";
  }

  const percentage = handle.percentage ?? 0;

  if (percentage < 40 || percentage > 70) {
    return "";
  }

  const normalizedHandle = normalizeHandle(handle.handle);

  return normalizedHandle ? ` + @${normalizedHandle}` : "";
}

export function shouldGenerateVoiceProfileName(name?: string | null) {
  return GENERIC_VOICE_PROFILE_NAMES.has(name?.trim().toLowerCase() ?? "");
}

export function generateVoiceProfileName(
  dimensions: VoiceDimensions,
  handles: VoiceNamingHandleInput[] = []
) {
  const normalizedHandles = handles.map(normalizeHandleInput);

  if (normalizedHandles.length === 0 && isNeutralDimensions(dimensions)) {
    return "Balanced Analyst";
  }

  const archetype = pickArchetype(dimensions);
  const dominantHandle = getDominantHandle(normalizedHandles);
  const modifier =
    getModifierOverride(dominantHandle) ?? pickModifier(dimensions, archetype);
  const suffix = getHandleSuffix(dominantHandle);

  return `${modifier} ${archetype}${suffix}`;
}

export function applyGeneratedBlendNames(
  blends: SavedBlend[],
  personalDimensions: VoiceDimensions,
  referenceAccounts: ReferenceAccount[]
) {
  const referenceLookup = buildReferenceAccountLookup(referenceAccounts);

  return blends.map((blend) => {
    if (!shouldGenerateVoiceProfileName(blend.name)) {
      return blend;
    }

    const dimensions = buildBlendFingerprint(
      blend,
      personalDimensions,
      referenceAccounts
    );

    return {
      ...blend,
      name: generateVoiceProfileName(
        dimensions,
        blend.voices.map((voice) => {
          const referenceAccount = resolveReferenceAccountForVoice(
            voice,
            referenceLookup
          );

          return {
            category: referenceAccount?.category,
            handle: referenceAccount?.handle ?? voice.referenceVoice?.handle,
            isPersonal: isPersonalVoiceLabel(voice.label),
            label: voice.label,
            percentage: voice.percentage,
          };
        })
      ),
    };
  });
}

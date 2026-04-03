export {
  DEFAULT_VOICE_DIMENSIONS,
  TRACK_A_INITIAL_DIMENSIONS,
  VOICE_DIMENSION_FIELDS,
  VOICE_DIMENSION_SECTIONS,
  applyVoiceDimensionDelta,
  formatVoiceDimensionValue,
  pickVoiceDimensions,
  styleToDimensions,
  type VoiceDimensionField,
  type VoiceDimensions as VoiceDimensionValues,
  type VoiceDimensionSection,
} from "@/lib/voice-profile-dimensions";

export function clampVoiceDimension(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export { pickVoiceDimensions as getVoiceDimensions } from "@/lib/voice-profile-dimensions";

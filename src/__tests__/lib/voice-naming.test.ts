import {
  generateVoiceProfileName,
  shouldGenerateVoiceProfileName,
} from "@/lib/voice-naming";
import type { VoiceDimensions } from "@/lib/voice-profile-dimensions";

const NEUTRAL_DIMENSIONS: VoiceDimensions = {
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

describe("generateVoiceProfileName", () => {
  it("returns Balanced Analyst for a neutral voice with no handles", () => {
    expect(generateVoiceProfileName(NEUTRAL_DIMENSIONS)).toBe(
      "Balanced Analyst"
    );
  });

  it("builds a modifier + archetype name from dimensions", () => {
    const dimensions: VoiceDimensions = {
      ...NEUTRAL_DIMENSIONS,
      humor: 25,
      formality: 85,
      brevity: 45,
      contrarianTone: 40,
      directness: 52,
      warmth: 40,
      technicalDepth: 78,
      confidence: 65,
      evidenceOrientation: 70,
    };

    expect(generateVoiceProfileName(dimensions)).toBe("Measured Analyst");
  });

  it("uses the dominant handle category override when one reference owns the blend", () => {
    const dimensions: VoiceDimensions = {
      ...NEUTRAL_DIMENSIONS,
      humor: 45,
      formality: 55,
      brevity: 55,
      contrarianTone: 35,
      technicalDepth: 92,
      confidence: 72,
      warmth: 55,
      evidenceOrientation: 70,
    };

    expect(
      generateVoiceProfileName(dimensions, [
        { isPersonal: true, label: "My voice", percentage: 35 },
        {
          category: "Tech",
          handle: "balaboris",
          label: "Balaji",
          percentage: 65,
        },
      ])
    ).toBe("Crisp Builder + @balaboris");
  });

  it("appends a handle suffix for a visible but non-dominant reference", () => {
    const dimensions: VoiceDimensions = {
      ...NEUTRAL_DIMENSIONS,
      humor: 25,
      formality: 85,
      brevity: 45,
      contrarianTone: 40,
      directness: 52,
      warmth: 40,
      technicalDepth: 78,
      confidence: 65,
      evidenceOrientation: 70,
    };

    expect(
      generateVoiceProfileName(dimensions, [
        { isPersonal: true, label: "My voice", percentage: 50 },
        { handle: "hosseeb", label: "Haseeb Qureshi", percentage: 50 },
      ])
    ).toBe("Measured Analyst + @hosseeb");
  });

  it("avoids duplicate names when the top modifier matches the archetype", () => {
    const dimensions: VoiceDimensions = {
      ...NEUTRAL_DIMENSIONS,
      humor: 45,
      formality: 40,
      brevity: 70,
      contrarianTone: 85,
      directness: 65,
      warmth: 30,
      technicalDepth: 60,
      confidence: 85,
      evidenceOrientation: 60,
    };

    expect(generateVoiceProfileName(dimensions)).toBe("Bold Contrarian");
  });
});

describe("shouldGenerateVoiceProfileName", () => {
  it("treats onboarding placeholders as generic", () => {
    expect(shouldGenerateVoiceProfileName("Onboarding blend")).toBe(true);
    expect(shouldGenerateVoiceProfileName("My starting blend")).toBe(true);
    expect(shouldGenerateVoiceProfileName("Custom Blend")).toBe(true);
  });

  it("preserves authored names", () => {
    expect(shouldGenerateVoiceProfileName("Measured Analyst")).toBe(false);
  });
});

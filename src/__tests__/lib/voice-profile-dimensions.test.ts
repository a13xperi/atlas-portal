import {
  generateVoiceProfileName,
  TRACK_A_INITIAL_DIMENSIONS,
  styleToDimensions,
} from "@/lib/voice-profile-dimensions";

describe("generateVoiceProfileName", () => {
  it("produces a stable analyst-style name for the onboarding track A profile", () => {
    expect(generateVoiceProfileName(TRACK_A_INITIAL_DIMENSIONS)).toBe(
      "Sharp Analyst"
    );
  });

  it("adds the first non-empty reference handle as a suffix", () => {
    expect(
      generateVoiceProfileName(styleToDimensions("Serious"), ["", "naval"])
    ).toBe("Data-Driven Researcher (a la @naval)");
  });

  it("uses a more playful archetype for fun dimensions", () => {
    expect(generateVoiceProfileName(styleToDimensions("Fun"), ["DefiIgnas"])).toBe(
      "Witty Shitposter (a la @DefiIgnas)"
    );
  });

  it("keeps balanced defaults deterministic when no handle is available", () => {
    expect(generateVoiceProfileName(styleToDimensions("Custom mix"))).toBe(
      "Balanced Commentator"
    );
  });
});

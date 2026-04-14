import {
  hasCalibratedVoiceDimensions,
  DEFAULT_VOICE_DIMENSIONS,
} from "@/lib/voice-profile-dimensions";

describe("hasCalibratedVoiceDimensions", () => {
  it("returns false when all dimensions are 50 and no meta exists", () => {
    expect(hasCalibratedVoiceDimensions({ ...DEFAULT_VOICE_DIMENSIONS })).toBe(false);
  });

  it("returns true when any dimension differs from 50", () => {
    expect(
      hasCalibratedVoiceDimensions({ ...DEFAULT_VOICE_DIMENSIONS, humor: 55 })
    ).toBe(true);
  });

  it("returns false for null profile", () => {
    expect(hasCalibratedVoiceDimensions(null)).toBe(false);
  });

  it("returns true when tweetsAnalyzed > 0 even if all dims are 50", () => {
    expect(
      hasCalibratedVoiceDimensions({
        ...DEFAULT_VOICE_DIMENSIONS,
        tweetsAnalyzed: 1,
      })
    ).toBe(true);
  });

  it("returns true when maturity is set even if all dims are 50", () => {
    expect(
      hasCalibratedVoiceDimensions({
        ...DEFAULT_VOICE_DIMENSIONS,
        maturity: "BEGINNER",
      })
    ).toBe(true);
  });
});

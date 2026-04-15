import "@testing-library/jest-dom";

import { getOnboardingCompletionHref } from "@/lib/oracle";

describe("getOnboardingCompletionHref", () => {
  it("routes Track A completions to the dashboard banner", () => {
    expect(
      getOnboardingCompletionHref({
        track: "a",
        voiceCalibrated: true,
        onboardingComplete: true,
      })
    ).toBe(
      "/dashboard?banner=voice-calibrated"
    );
  });

  it("routes Track B completions to the voice lab prompt", () => {
    expect(
      getOnboardingCompletionHref({
        track: "b",
        voiceCalibrated: false,
        onboardingComplete: false,
      })
    ).toBe(
      "/voice-lab?prompt=complete-voice-setup"
    );
  });
});

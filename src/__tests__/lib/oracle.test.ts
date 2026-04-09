import "@testing-library/jest-dom";
import { canAdvance, initialOracleState } from "@/lib/oracle";

describe("oracle onboarding progression", () => {
  it("does not block track A results on manual profile creation", () => {
    const state = {
      ...initialOracleState(),
      currentStep: "TRACK_A_RESULT" as const,
      track: "a" as const,
      xConnected: true,
      xHandle: "atlasanalyst",
    };

    expect(canAdvance(state)).toBe(true);
  });

  it("does not block track B dimensions on manual profile creation", () => {
    const state = {
      ...initialOracleState(),
      currentStep: "TRACK_B_DIMENSIONS" as const,
      track: "b" as const,
      selectedStyle: "Serious",
    };

    expect(canAdvance(state)).toBe(true);
  });
});

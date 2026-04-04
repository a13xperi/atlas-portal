import "@testing-library/jest-dom";

const mockRedirect = jest.fn();

jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args);
    throw new Error("NEXT_REDIRECT");
  },
}));

const TrackAPage = require("@/app/onboarding/track-a/page").default;

describe("TrackARedirect", () => {
  beforeEach(() => {
    mockRedirect.mockClear();
  });

  it("redirects to /onboarding", () => {
    expect(() => TrackAPage()).toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/onboarding");
  });
});

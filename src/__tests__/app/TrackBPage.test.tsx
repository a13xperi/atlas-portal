import "@testing-library/jest-dom";

const mockRedirect = jest.fn();

jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args);
    throw new Error("NEXT_REDIRECT");
  },
}));

const TrackBPage = require("@/app/onboarding/track-b/page").default;

describe("TrackBRedirect", () => {
  beforeEach(() => {
    mockRedirect.mockClear();
  });

  it("redirects to /onboarding", () => {
    expect(() => TrackBPage()).toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/onboarding");
  });
});

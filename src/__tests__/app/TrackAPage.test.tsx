import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import React from "react";

const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  redirect: jest.fn(),
}));

const TrackAStarter = require("@/app/onboarding/track-a/page").default;

describe("TrackARedirect", () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it("renders without crashing and calls router.replace on mount", () => {
    render(React.createElement(TrackAStarter));
    expect(mockReplace).toHaveBeenCalledWith("/onboarding");
  });
});

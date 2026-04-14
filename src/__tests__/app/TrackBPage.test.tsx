import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import React from "react";

const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  redirect: jest.fn(),
}));

const TrackBStarter = require("@/app/onboarding/track-b/page").default;

describe("TrackBRedirect", () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it("renders without crashing and calls router.replace on mount", () => {
    render(React.createElement(TrackBStarter));
    expect(mockReplace).toHaveBeenCalledWith("/onboarding");
  });
});

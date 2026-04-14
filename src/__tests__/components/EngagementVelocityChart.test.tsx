import "@testing-library/jest-dom";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import EngagementVelocityChart from "@/components/analytics/EngagementVelocityChart";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
  }: {
    children: ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

describe("EngagementVelocityChart", () => {
  it("renders the illustrated fallback when there is no engagement data", () => {
    render(<EngagementVelocityChart engagementDays={[]} />);

    expect(screen.getByText("No engagement history yet")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Connect X and import a few report-driven drafts so Atlas can compare predicted reach against real performance."
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Connect X" })).toHaveAttribute(
      "href",
      "/voice-profiles"
    );
    expect(screen.getByRole("link", { name: "Import data" })).toHaveAttribute(
      "href",
      "/crafting"
    );
    expect(screen.queryByText("Predicted")).not.toBeInTheDocument();
    expect(screen.queryByText("Actual")).not.toBeInTheDocument();
  });
});

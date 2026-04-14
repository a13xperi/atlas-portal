import "@testing-library/jest-dom";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import ModelReliabilitySection from "@/components/analytics/ModelReliabilitySection";

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

describe("ModelReliabilitySection", () => {
  it("renders the fallback UI when the learning log is empty", () => {
    render(<ModelReliabilitySection logEntries={[]} />);

    expect(screen.getByText("No confidence trend yet")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Connect X and import a report so Atlas can start learning from the drafts you refine and the posts you ship."
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
  });

  it("summarizes positive signals when reliability data is present", () => {
    render(
      <ModelReliabilitySection
        logEntries={[
          {
            id: "entry-1",
            event: "Refined a BTC ETF thread",
            impact: "+4%",
            positive: true,
            createdAt: "2026-04-14T08:30:00.000Z",
          },
          {
            id: "entry-2",
            event: "Updated a SOL positioning take",
            impact: "-1%",
            positive: false,
            createdAt: "2026-04-14T09:30:00.000Z",
          },
        ]}
      />
    );

    expect(
      screen.getByText("1 positive signals detected across your recent activity.")
    ).toBeInTheDocument();
  });
});

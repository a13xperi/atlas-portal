import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { AnalysisSummary } from "@/components/crafting/AnalysisSummary";
import type { ContentAnalysis } from "@/hooks/useCraftingAdvisor";

const baseAnalysis: ContentAnalysis = {
  summary: "Bitcoin reclaimed $100k after sustained ETF inflows.",
  keyThemes: ["BTC", "ETF inflows", "Resistance breakout"],
  sentiment: "bullish",
  relatedTopics: ["Macro", "ETH correlation"],
  pageCount: 3,
};

describe("AnalysisSummary", () => {
  // ---------- basic render ----------

  it("renders the Analysis label", () => {
    render(<AnalysisSummary analysis={baseAnalysis} />);
    expect(screen.getByText("Analysis")).toBeInTheDocument();
  });

  it("displays the summary text", () => {
    render(<AnalysisSummary analysis={baseAnalysis} />);
    expect(
      screen.getByText("Bitcoin reclaimed $100k after sustained ETF inflows.")
    ).toBeInTheDocument();
  });

  // ---------- sentiment badge ----------

  it("shows the sentiment badge", () => {
    render(<AnalysisSummary analysis={baseAnalysis} />);
    expect(screen.getByText("bullish")).toBeInTheDocument();
  });

  it.each(["bullish", "bearish", "neutral", "mixed"] as const)(
    "renders %s sentiment with the correct style class",
    (sentiment) => {
      const expectedClass: Record<string, string> = {
        bullish: "bg-emerald-500/20",
        bearish: "bg-red-500/20",
        neutral: "bg-slate-500/20",
        mixed: "bg-amber-500/20",
      };

      render(
        <AnalysisSummary analysis={{ ...baseAnalysis, sentiment }} />
      );

      const badge = screen.getByText(sentiment);
      expect(badge.className).toContain(expectedClass[sentiment]);
    }
  );

  it("falls back to neutral style for an unknown sentiment", () => {
    render(
      <AnalysisSummary analysis={{ ...baseAnalysis, sentiment: "confused" }} />
    );

    const badge = screen.getByText("confused");
    expect(badge.className).toContain("bg-slate-500/20");
  });

  // ---------- page count ----------

  it("displays page count when provided", () => {
    render(<AnalysisSummary analysis={baseAnalysis} />);
    expect(screen.getByText("3 pages")).toBeInTheDocument();
  });

  it("hides page count when not provided", () => {
    const { pageCount, ...noPagesAnalysis } = baseAnalysis;
    render(<AnalysisSummary analysis={noPagesAnalysis} />);
    expect(screen.queryByText(/pages/)).not.toBeInTheDocument();
  });

  // ---------- key themes ----------

  it("renders all key themes", () => {
    render(<AnalysisSummary analysis={baseAnalysis} />);
    expect(screen.getByText("BTC")).toBeInTheDocument();
    expect(screen.getByText("ETF inflows")).toBeInTheDocument();
    expect(screen.getByText("Resistance breakout")).toBeInTheDocument();
  });

  it("truncates themes longer than 40 characters", () => {
    const longTheme =
      "This is a very long theme that exceeds the forty character limit easily";
    render(
      <AnalysisSummary
        analysis={{ ...baseAnalysis, keyThemes: [longTheme] }}
      />
    );

    const truncated = longTheme.slice(0, 40) + "\u2026";
    expect(screen.getByText(truncated)).toBeInTheDocument();
  });

  it("does not render themes section when keyThemes is empty", () => {
    render(
      <AnalysisSummary
        analysis={{ ...baseAnalysis, keyThemes: [] }}
      />
    );

    // The theme container should not appear at all
    expect(screen.queryByText("BTC")).not.toBeInTheDocument();
  });

  // ---------- empty / minimal state ----------

  it("renders with minimal data (no pageCount, no themes)", () => {
    const minimal: ContentAnalysis = {
      summary: "Short summary.",
      keyThemes: [],
      sentiment: "neutral",
      relatedTopics: [],
    };

    render(<AnalysisSummary analysis={minimal} />);

    expect(screen.getByText("Analysis")).toBeInTheDocument();
    expect(screen.getByText("Short summary.")).toBeInTheDocument();
    expect(screen.getByText("neutral")).toBeInTheDocument();
    expect(screen.queryByText(/pages/)).not.toBeInTheDocument();
  });
});

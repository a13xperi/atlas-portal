import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import RecipeCard from "@/components/voice-profiles/RecipeCard";
import type { SavedBlend } from "@/lib/api";
import type { VoiceDimensions } from "@/lib/voice-profile-dimensions";
import type { VoiceDimensionSnapshot } from "@/lib/voice-recipes";

const mockDimensions: VoiceDimensions = {
  humor: 50,
  formality: 50,
  brevity: 50,
  contrarianTone: 50,
  directness: 50,
  warmth: 50,
  technicalDepth: 50,
  confidence: 50,
  evidenceOrientation: 50,
  solutionOrientation: 50,
  socialPosture: 50,
  selfPromotionalIntensity: 50,
};

const mockNotableDimensions: VoiceDimensionSnapshot[] = [];

function makeBlend(percentages: number[]): SavedBlend {
  return {
    id: "blend-1",
    name: "Test Blend",
    voices: percentages.map((percentage, index) => ({
      id: `voice-${index}`,
      label: `Voice ${index + 1}`,
      percentage,
    })),
  };
}

describe("RecipeCard", () => {
  it("display-normalizes blend percentages so they sum to 100%", () => {
    const blend = makeBlend([100, 75, 40]);
    // raw total = 215; normalized ≈ 46.51%, 34.88%, 18.60%

    render(
      <RecipeCard
        blend={blend}
        dimensions={mockDimensions}
        fingerprintDescription="Test description"
        notableDimensions={mockNotableDimensions}
        isActive={false}
        onPreviewSample={jest.fn()}
        onUse={jest.fn()}
      />
    );

    // Total blend badge shows 100%
    expect(screen.getByText("100%")).toBeInTheDocument();

    // Composition text shows rounded normalized percentages
    expect(screen.getByText("47% Voice 1 + 35% Voice 2 + 19% Voice 3")).toBeInTheDocument();

    // Pills show rounded normalized percentages
    expect(screen.getByText("47% Voice 1")).toBeInTheDocument();
    expect(screen.getByText("35% Voice 2")).toBeInTheDocument();
    expect(screen.getByText("19% Voice 3")).toBeInTheDocument();

    // Bar segments use exact normalized widths
    const barContainer = screen.getByText("Composition").parentElement?.nextElementSibling;
    expect(barContainer).not.toBeNull();
    const widthBars = barContainer?.querySelectorAll('div[aria-hidden="true"]');
    expect(widthBars).toHaveLength(3);
    expect((widthBars![0] as HTMLElement).style.width).toBe(`${(100 / 215) * 100}%`);
    expect((widthBars![1] as HTMLElement).style.width).toBe(`${(75 / 215) * 100}%`);
    expect((widthBars![2] as HTMLElement).style.width).toBe(`${(40 / 215) * 100}%`);
  });

  it("handles a single voice as 100%", () => {
    const blend = makeBlend([50]);

    render(
      <RecipeCard
        blend={blend}
        dimensions={mockDimensions}
        fingerprintDescription="Test description"
        notableDimensions={mockNotableDimensions}
        isActive={false}
        onPreviewSample={jest.fn()}
        onUse={jest.fn()}
      />
    );

    expect(screen.getAllByText("100% Voice 1").length).toBeGreaterThanOrEqual(1);

    const barContainer = screen.getByText("Composition").parentElement?.nextElementSibling;
    expect(barContainer).not.toBeNull();
    const widthBars = barContainer?.querySelectorAll('div[aria-hidden="true"]');
    expect(widthBars).toHaveLength(1);
    expect((widthBars![0] as HTMLElement).style.width).toBe("100%");
  });
});

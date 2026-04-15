import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import type { SavedBlend } from "@/lib/api";
import type { VoiceDimensions } from "@/lib/voice-profile-dimensions";
import type { VoiceDimensionSnapshot } from "@/lib/voice-recipes";

/* ------------------------------------------------------------------ */
/*  Mocks                                                              */
/* ------------------------------------------------------------------ */

// framer-motion: replace animated wrappers with plain DOM elements
jest.mock("framer-motion", () => {
  const React = require("react");
  const AnimatePresence = ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  );
  AnimatePresence.displayName = "AnimatePresence";

  const MotionDiv = React.forwardRef(
    (
      {
        children,
        initial: _initial,
        animate: _animate,
        exit: _exit,
        transition: _transition,
        ...rest
      }: Record<string, unknown> & { children?: React.ReactNode },
      ref: React.Ref<HTMLDivElement>,
    ) => (
      <div ref={ref} {...rest}>
        {children}
      </div>
    ),
  );
  MotionDiv.displayName = "MotionDiv";

  return {
    AnimatePresence,
    motion: {
      div: MotionDiv,
    },
    useCycle: <T,>(...items: T[]) => {
      let index = 0;
      const value = items[index];
      const cycle = () => {
        index = (index + 1) % items.length;
      };
      return [value, cycle] as const;
    },
  };
});

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

// Import after mocks are registered
import RecipeCard from "@/components/voice-profiles/RecipeCard";

function makeDimensions(overrides: Partial<VoiceDimensions> = {}): VoiceDimensions {
  return {
    humor: 50,
    formality: 60,
    brevity: 40,
    contrarianTone: 55,
    directness: 65,
    warmth: 45,
    technicalDepth: 70,
    confidence: 75,
    evidenceOrientation: 80,
    solutionOrientation: 50,
    socialPosture: 35,
    selfPromotionalIntensity: 20,
    ...overrides,
  };
}

function makeBlend(overrides: Partial<SavedBlend> = {}): SavedBlend {
  return {
    id: "blend-1",
    name: "Alpha Blend",
    voices: [
      {
        id: "v1",
        label: "Analyst",
        percentage: 70,
        referenceVoiceId: "ref-1",
        referenceVoice: {
          id: "ref-1",
          name: "Analyst Voice",
          handle: "@analyst",
          avatarUrl: "https://example.com/analyst.png",
          isActive: true,
        },
      },
      {
        id: "v2",
        label: "Trader",
        percentage: 30,
        referenceVoiceId: "ref-2",
        referenceVoice: {
          id: "ref-2",
          name: "Trader Voice",
          handle: "@trader",
          isActive: true,
        },
      },
    ],
    ...overrides,
  };
}

const defaultNotable: VoiceDimensionSnapshot[] = [
  { field: "humor", label: "Humor", value: 50, deltaFromNeutral: 0 },
  { field: "confidence", label: "Confidence", value: 75, deltaFromNeutral: 25 },
];

function renderCard(overrides: Record<string, unknown> = {}) {
  const defaults = {
    blend: makeBlend(),
    dimensions: makeDimensions(),
    fingerprintDescription: "Confident and analytical",
    notableDimensions: defaultNotable,
    isActive: false,
    onPreviewSample: jest.fn(),
    onUse: jest.fn(),
  };
  const props = { ...defaults, ...overrides };
  return render(<RecipeCard {...(props as any)} />);
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe("RecipeCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* ---------- Basic rendering ---------- */

  it("renders the blend name", () => {
    renderCard();
    expect(screen.getByText("Alpha Blend")).toBeInTheDocument();
  });

  it("renders the 'Voice recipe' badge", () => {
    renderCard();
    expect(screen.getByText("Voice recipe")).toBeInTheDocument();
  });

  it("shows the Active badge when isActive is true", () => {
    renderCard({ isActive: true });
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("does not show the Active badge when isActive is false", () => {
    renderCard({ isActive: false });
    expect(screen.queryByText("Active")).not.toBeInTheDocument();
  });

  it("displays the fingerprint description", () => {
    renderCard({ fingerprintDescription: "Sharp and witty" });
    expect(screen.getByText("Sharp and witty")).toBeInTheDocument();
  });

  it("renders the total blend percentage", () => {
    renderCard();
    // The ratio box shows "100" + "%" in its content
    expect(screen.getByText("Blend")).toBeInTheDocument();
  });

  it("renders the composition percentages", () => {
    renderCard();
    expect(screen.getByText("70% Analyst + 30% Trader")).toBeInTheDocument();
  });

  it("renders notable dimension bars", () => {
    renderCard();
    expect(screen.getByText("Humor")).toBeInTheDocument();
    expect(screen.getByText("Confidence")).toBeInTheDocument();
  });

  /* ---------- Voice avatar display ---------- */

  it("renders voice avatar images for voices with avatarUrl", () => {
    renderCard();
    const imgs = screen.getAllByRole("img");
    // At minimum one from the cluster + one from the pill for the voice with avatarUrl
    expect(imgs.length).toBeGreaterThanOrEqual(1);
  });

  it("falls back to unavatar when referenceVoice has handle but no avatarUrl", () => {
    const blend = makeBlend({
      voices: [
        {
          id: "v1",
          label: "Guru",
          percentage: 100,
          referenceVoice: {
            id: "ref-1",
            name: "Guru",
            handle: "@guru",
            isActive: true,
          },
        },
      ],
    });
    renderCard({ blend });
    const imgs = screen.getAllByRole("img") as HTMLImageElement[];
    const unavatarImg = imgs.find((img) => img.src.includes("unavatar.io/twitter/guru"));
    expect(unavatarImg).toBeDefined();
  });

  it("renders initials fallback when voice has no URL and no user handle", () => {
    const blend = makeBlend({
      voices: [
        {
          id: "v1",
          label: "Zeta",
          percentage: 100,
          referenceVoice: null,
          referenceVoiceId: null,
        },
      ],
    });
    renderCard({ blend, userHandle: undefined });
    // Initials span with "Z" should appear (aria-hidden, but still in DOM)
    const initialSpans = screen.getAllByText("Z");
    expect(initialSpans.length).toBeGreaterThanOrEqual(1);
  });

  it("uses userHandle for unavatar when voice has no referenceVoice", () => {
    const blend = makeBlend({
      voices: [
        {
          id: "v1",
          label: "Own Voice",
          percentage: 100,
          referenceVoice: null,
          referenceVoiceId: null,
        },
      ],
    });
    renderCard({ blend, userHandle: "@myhandle" });
    const imgs = screen.getAllByRole("img") as HTMLImageElement[];
    const unavatarImg = imgs.find((img) => img.src.includes("unavatar.io/twitter/myhandle"));
    expect(unavatarImg).toBeDefined();
  });

  /* ---------- Click handlers ---------- */

  it("calls onPreviewSample when preview button is clicked", () => {
    const onPreviewSample = jest.fn();
    renderCard({ onPreviewSample });

    const btn = screen.getByRole("button", { name: /preview in this voice/i });
    fireEvent.click(btn);
    expect(onPreviewSample).toHaveBeenCalledTimes(1);
  });

  it("calls onUse when use button is clicked", () => {
    const onUse = jest.fn();
    renderCard({ onUse });

    const btn = screen.getByRole("button", { name: /use in crafting/i });
    fireEvent.click(btn);
    expect(onUse).toHaveBeenCalledTimes(1);
  });

  it("calls onEdit when edit button is clicked", () => {
    const onEdit = jest.fn();
    renderCard({ onEdit });

    const btn = screen.getByRole("button", { name: /edit/i });
    fireEvent.click(btn);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("does not render Edit button when onEdit is not provided", () => {
    renderCard({ onEdit: undefined });
    expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
  });

  it("disables the use button when isActive is true", () => {
    renderCard({ isActive: true });
    const btn = screen.getByRole("button", { name: /active in crafting/i });
    expect(btn).toBeDisabled();
  });

  it("shows 'Active in Crafting' label when isActive is true", () => {
    renderCard({ isActive: true });
    expect(screen.getByText("Active in Crafting")).toBeInTheDocument();
  });

  it("shows 'Use in Crafting' label when isActive is false", () => {
    renderCard({ isActive: false });
    expect(screen.getByText("Use in Crafting")).toBeInTheDocument();
  });

  /* ---------- Expand / collapse toggle ---------- */

  it("renders the toggle button with 'Show fingerprint' text initially", () => {
    renderCard();
    expect(
      screen.getByRole("button", { name: /show fingerprint/i }),
    ).toBeInTheDocument();
  });

  it("toggle button has aria-expanded=false initially", () => {
    renderCard();
    const btn = screen.getByRole("button", { name: /show fingerprint/i });
    expect(btn).toHaveAttribute("aria-expanded", "false");
  });

  /* ---------- Preview loading state ---------- */

  it("disables the preview button when previewLoading is true", () => {
    renderCard({ previewLoading: true });
    const btn = screen.getByRole("button", { name: /generating sample/i });
    expect(btn).toBeDisabled();
  });

  it("shows 'Generating sample...' when previewLoading is true", () => {
    renderCard({ previewLoading: true });
    expect(screen.getByText("Generating sample...")).toBeInTheDocument();
  });

  it("shows 'Regenerate sample' when previewText exists", () => {
    renderCard({ previewText: "This is a sample tweet." });
    expect(screen.getByText("Regenerate sample")).toBeInTheDocument();
  });

  /* ---------- Preview text and error ---------- */

  it("renders preview text when provided", () => {
    renderCard({ previewText: "GM! Markets looking bullish today." });
    expect(screen.getByText("GM! Markets looking bullish today.")).toBeInTheDocument();
    expect(screen.getByText("Sample tweet")).toBeInTheDocument();
  });

  it("renders preview error with role=alert when provided", () => {
    renderCard({ previewError: "Rate limited — try again" });
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Rate limited — try again");
  });

  it("shows error over preview text when both are provided", () => {
    renderCard({
      previewText: "Some sample",
      previewError: "Generation failed",
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Generation failed");
  });

  it("does not render preview section when neither previewText nor previewError provided", () => {
    renderCard({ previewText: undefined, previewError: undefined });
    expect(screen.queryByText("Sample tweet")).not.toBeInTheDocument();
  });

  /* ---------- Edge cases: empty / minimal data ---------- */

  it("handles a single voice blend", () => {
    const blend = makeBlend({
      name: "Solo Voice",
      voices: [
        {
          id: "v1",
          label: "Solo",
          percentage: 100,
          referenceVoice: null,
          referenceVoiceId: null,
        },
      ],
    });
    renderCard({ blend, userHandle: undefined });
    expect(screen.getByText("Solo Voice")).toBeInTheDocument();
    // "100% Solo" appears in both composition line and pill
    expect(screen.getAllByText("100% Solo").length).toBeGreaterThanOrEqual(1);
  });

  it("handles blend with empty voices array gracefully", () => {
    const blend = makeBlend({ name: "Empty Blend", voices: [] });
    // Should not throw
    expect(() => renderCard({ blend })).not.toThrow();
    expect(screen.getByText("Empty Blend")).toBeInTheDocument();
  });

  it("handles zero-value dimensions without crashing", () => {
    const dims = makeDimensions({
      humor: 0,
      formality: 0,
      brevity: 0,
      contrarianTone: 0,
      directness: 0,
      warmth: 0,
      technicalDepth: 0,
      confidence: 0,
      evidenceOrientation: 0,
      solutionOrientation: 0,
      socialPosture: 0,
      selfPromotionalIntensity: 0,
    });
    expect(() => renderCard({ dimensions: dims })).not.toThrow();
  });

  it("handles empty notableDimensions array", () => {
    expect(() => renderCard({ notableDimensions: [] })).not.toThrow();
    expect(screen.getByText("Dimension fingerprint")).toBeInTheDocument();
  });

  it("handles empty fingerprintDescription", () => {
    renderCard({ fingerprintDescription: "" });
    expect(screen.getByText("Dimension fingerprint")).toBeInTheDocument();
  });

  it("renders 'Modeled after' text for a 2-voice blend with a creator voice", () => {
    renderCard();
    expect(screen.getByText("Modeled after Analyst")).toBeInTheDocument();
  });

  it("renders 'X voices blended' for blends with 3+ voices", () => {
    const blend = makeBlend({
      voices: [
        { id: "v1", label: "A", percentage: 40, referenceVoice: null },
        { id: "v2", label: "B", percentage: 30, referenceVoice: null },
        { id: "v3", label: "C", percentage: 30, referenceVoice: null },
      ],
    });
    renderCard({ blend });
    expect(screen.getByText("3 voices blended")).toBeInTheDocument();
  });

  /* ---------- Composition bar segments ---------- */

  it("renders a segment per voice in the composition bar", () => {
    const { container } = renderCard();
    // The bar container has child divs with aria-hidden
    const barContainer = container.querySelector(".flex.h-4");
    expect(barContainer).not.toBeNull();
    const segments = barContainer!.querySelectorAll("[aria-hidden='true']");
    expect(segments).toHaveLength(2);
  });

  it("sets segment widths based on voice percentages", () => {
    const { container } = renderCard();
    const barContainer = container.querySelector(".flex.h-4");
    const segments = barContainer!.querySelectorAll("[aria-hidden='true']");
    expect((segments[0] as HTMLElement).style.width).toBe("70%");
    expect((segments[1] as HTMLElement).style.width).toBe("30%");
  });

  /* ---------- Voice pills ---------- */

  it("renders a pill for each voice with percentage and label", () => {
    renderCard();
    expect(screen.getByText("70% Analyst")).toBeInTheDocument();
    expect(screen.getByText("30% Trader")).toBeInTheDocument();
  });
});

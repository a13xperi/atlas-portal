import "@testing-library/jest-dom";
import { fireEvent, render, screen, act, waitFor } from "@testing-library/react";
import { CraftingAdvisor } from "@/components/crafting/CraftingAdvisor";
import type { CraftingAngle, ContentAnalysis } from "@/hooks/useCraftingAdvisor";
import type { TweetDraft } from "@/lib/api";

// ---------- mock data ----------

const mockAnalysis: ContentAnalysis = {
  summary: "Bitcoin reclaimed $100k after sustained ETF inflows.",
  keyThemes: ["BTC", "ETF inflows", "Resistance breakout"],
  sentiment: "bullish",
  relatedTopics: ["Macro", "ETH correlation"],
  pageCount: 3,
};

const mockAngles: CraftingAngle[] = [
  {
    id: "angle-0",
    title: "Key Insight",
    description: "BTC reclaiming $100k is a structural shift, not just a bounce.",
    sampleOpener: "Here's what most people miss about this...",
    tone: "Analytical",
    structure: "tweet",
    angleInstruction: "Key Insight: BTC reclaiming $100k. Tone: Analytical.",
  },
  {
    id: "angle-1",
    title: "Hot Take",
    description: "Everyone celebrating too early — the real test is the weekly close.",
    sampleOpener: "Everyone is wrong about this...",
    tone: "Provocative",
    structure: "tweet",
    angleInstruction: "Hot Take: Weekly close test. Tone: Provocative.",
  },
  {
    id: "angle-2",
    title: "Data Thread",
    description: "ETF flows tell a different story than price action.",
    sampleOpener: "Let me show you the data...",
    tone: "Educational",
    structure: "thread",
    angleInstruction: "Data Thread: ETF flows. Tone: Educational.",
  },
];

const mockDrafts: TweetDraft[] = [
  {
    id: "draft-1",
    content: "BTC just reclaimed $100k. Here's why the ETF flows matter more than the price candle.",
    version: 1,
    status: "DRAFT",
    createdAt: "2026-04-12T10:00:00.000Z",
  },
];

// ---------- mock hook ----------

const mockStartAnalysis = jest.fn();
const mockToggleAngle = jest.fn();
const mockAddCustomAngle = jest.fn();
const mockGenerateSelected = jest.fn();
const mockReset = jest.fn();

let hookOverrides: Record<string, unknown> = {};

jest.mock("@/hooks/useCraftingAdvisor", () => ({
  useCraftingAdvisor: () => ({
    phase: "idle",
    analysis: null,
    angles: [],
    selectedAngleIds: new Set<string>(),
    generatedDrafts: [],
    error: null,
    startAnalysis: mockStartAnalysis,
    toggleAngle: mockToggleAngle,
    addCustomAngle: mockAddCustomAngle,
    generateSelected: mockGenerateSelected,
    reset: mockReset,
    ...hookOverrides,
  }),
}));

jest.mock("@/components/crafting/AnalysisSummary", () => ({
  AnalysisSummary: ({ analysis }: { analysis: ContentAnalysis }) => (
    <div data-testid="analysis-summary">{analysis.summary}</div>
  ),
}));

jest.mock("@/components/crafting/AngleCard", () => ({
  AngleCard: ({
    angle,
    selected,
    onToggle,
  }: {
    angle: CraftingAngle;
    selected: boolean;
    disabled: boolean;
    onToggle: (id: string) => void;
  }) => (
    <button
      data-testid={`angle-card-${angle.id}`}
      aria-pressed={selected}
      onClick={() => onToggle(angle.id)}
    >
      {angle.title}
    </button>
  ),
}));

// ---------- helpers ----------

const defaultProps = {
  sourceContent: "Bitcoin reclaimed $100k after ETF inflows surged.",
  sourceType: "text",
  onDraftsGenerated: jest.fn(),
  onClose: jest.fn(),
};

function renderAdvisor(overrides: Record<string, unknown> = {}) {
  hookOverrides = overrides;
  return render(<CraftingAdvisor {...defaultProps} />);
}

// ---------- tests ----------

describe("CraftingAdvisor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    hookOverrides = {};
  });

  // ---- render tests ----

  describe("basic rendering", () => {
    it("renders the header with title and close button", () => {
      renderAdvisor();

      expect(screen.getByText("Craft with Atlas")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Close advisor" })).toBeInTheDocument();
    });

    it("calls onClose when the header close button is clicked", () => {
      renderAdvisor();

      fireEvent.click(screen.getByRole("button", { name: "Close advisor" }));

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it("triggers startAnalysis on mount when phase is idle and content exists", () => {
      renderAdvisor();

      expect(mockStartAnalysis).toHaveBeenCalledWith(
        defaultProps.sourceContent,
        defaultProps.sourceType,
        undefined,
      );
    });

    it("does not trigger startAnalysis when phase is not idle", () => {
      renderAdvisor({ phase: "presenting", analysis: mockAnalysis, angles: mockAngles });

      expect(mockStartAnalysis).not.toHaveBeenCalled();
    });
  });

  // ---- analyzing state ----

  describe("analyzing phase", () => {
    it("shows the loading spinner and skeleton cards", () => {
      renderAdvisor({ phase: "analyzing" });

      expect(screen.getByText("Atlas is reading your content\u2026")).toBeInTheDocument();
    });
  });

  // ---- presenting state ----

  describe("presenting phase", () => {
    const presentingOverrides = {
      phase: "presenting",
      analysis: mockAnalysis,
      angles: mockAngles,
      selectedAngleIds: new Set<string>(),
    };

    it("renders the analysis summary", () => {
      renderAdvisor(presentingOverrides);

      expect(screen.getByTestId("analysis-summary")).toHaveTextContent(mockAnalysis.summary);
    });

    it("renders all angle cards", () => {
      renderAdvisor(presentingOverrides);

      expect(screen.getByTestId("angle-card-angle-0")).toBeInTheDocument();
      expect(screen.getByTestId("angle-card-angle-1")).toBeInTheDocument();
      expect(screen.getByTestId("angle-card-angle-2")).toBeInTheDocument();
    });

    it("shows 'Select 1-5' hint when nothing is selected", () => {
      renderAdvisor(presentingOverrides);

      expect(screen.getByText("Select 1\u20135")).toBeInTheDocument();
    });

    it("shows selected count when angles are selected", () => {
      renderAdvisor({
        ...presentingOverrides,
        selectedAngleIds: new Set(["angle-0", "angle-1"]),
      });

      expect(screen.getByText("2 selected")).toBeInTheDocument();
    });

    it("calls toggleAngle when an angle card is clicked", () => {
      renderAdvisor(presentingOverrides);

      fireEvent.click(screen.getByTestId("angle-card-angle-1"));

      expect(mockToggleAngle).toHaveBeenCalledWith("angle-1");
    });

    it("shows the generate button disabled when no angles selected", () => {
      renderAdvisor(presentingOverrides);

      const btn = screen.getByRole("button", { name: "Select at least one angle" });
      expect(btn).toBeDisabled();
    });

    it("shows enabled generate button with selection count when angles are selected", () => {
      renderAdvisor({
        ...presentingOverrides,
        selectedAngleIds: new Set(["angle-0"]),
      });

      const btn = screen.getByRole("button", { name: "Generate 1 draft" });
      expect(btn).toBeEnabled();
    });

    it("shows plural drafts label for multiple selections", () => {
      renderAdvisor({
        ...presentingOverrides,
        selectedAngleIds: new Set(["angle-0", "angle-1", "angle-2"]),
      });

      expect(screen.getByRole("button", { name: "Generate 3 drafts" })).toBeEnabled();
    });

    it("calls generateSelected on generate button click", () => {
      renderAdvisor({
        ...presentingOverrides,
        selectedAngleIds: new Set(["angle-0"]),
      });

      fireEvent.click(screen.getByRole("button", { name: "Generate 1 draft" }));

      expect(mockGenerateSelected).toHaveBeenCalledWith(
        defaultProps.sourceContent,
        defaultProps.sourceType,
        undefined,
      );
    });
  });

  // ---- custom angle ----

  describe("custom angle input", () => {
    const presentingOverrides = {
      phase: "presenting",
      analysis: mockAnalysis,
      angles: mockAngles,
      selectedAngleIds: new Set<string>(),
    };

    it("shows the 'Add your own angle' button initially", () => {
      renderAdvisor(presentingOverrides);

      expect(screen.getByText("Add your own angle")).toBeInTheDocument();
    });

    it("shows the custom input field when 'Add your own angle' is clicked", () => {
      renderAdvisor(presentingOverrides);

      fireEvent.click(screen.getByText("Add your own angle"));

      expect(screen.getByLabelText("Custom angle description")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
    });

    it("calls addCustomAngle and clears input on Enter", () => {
      renderAdvisor(presentingOverrides);

      fireEvent.click(screen.getByText("Add your own angle"));
      const input = screen.getByLabelText("Custom angle description");

      fireEvent.change(input, { target: { value: "My custom take on this" } });
      fireEvent.keyDown(input, { key: "Enter" });

      expect(mockAddCustomAngle).toHaveBeenCalledWith("My custom take on this");
    });

    it("calls addCustomAngle when the Add button is clicked", () => {
      renderAdvisor(presentingOverrides);

      fireEvent.click(screen.getByText("Add your own angle"));
      const input = screen.getByLabelText("Custom angle description");

      fireEvent.change(input, { target: { value: "My custom angle" } });
      fireEvent.click(screen.getByRole("button", { name: "Add" }));

      expect(mockAddCustomAngle).toHaveBeenCalledWith("My custom angle");
    });

    it("does not call addCustomAngle when input is blank", () => {
      renderAdvisor(presentingOverrides);

      fireEvent.click(screen.getByText("Add your own angle"));
      const input = screen.getByLabelText("Custom angle description");

      fireEvent.change(input, { target: { value: "   " } });
      fireEvent.click(screen.getByRole("button", { name: "Add" }));

      expect(mockAddCustomAngle).not.toHaveBeenCalled();
    });

    it("hides the custom input on Escape", () => {
      renderAdvisor(presentingOverrides);

      fireEvent.click(screen.getByText("Add your own angle"));
      const input = screen.getByLabelText("Custom angle description");

      fireEvent.keyDown(input, { key: "Escape" });

      expect(screen.queryByLabelText("Custom angle description")).not.toBeInTheDocument();
      expect(screen.getByText("Add your own angle")).toBeInTheDocument();
    });

    it("disables the Add button when the input is empty", () => {
      renderAdvisor(presentingOverrides);

      fireEvent.click(screen.getByText("Add your own angle"));

      expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
    });
  });

  // ---- calibration blocked ----

  describe("calibration blocked", () => {
    const blockedProps = {
      ...defaultProps,
      isCalibrationBlocked: true,
    };

    it("shows calibration warning when isCalibrationBlocked is true", () => {
      hookOverrides = {
        phase: "presenting",
        analysis: mockAnalysis,
        angles: mockAngles,
        selectedAngleIds: new Set(["angle-0"]),
      };
      render(<CraftingAdvisor {...blockedProps} />);

      expect(
        screen.getByText("Calibrate your voice first in Voice Studio before generating drafts."),
      ).toBeInTheDocument();
    });

    it("disables the generate button when calibration is blocked", () => {
      hookOverrides = {
        phase: "presenting",
        analysis: mockAnalysis,
        angles: mockAngles,
        selectedAngleIds: new Set(["angle-0"]),
      };
      render(<CraftingAdvisor {...blockedProps} />);

      expect(
        screen.getByRole("button", { name: "Calibrate voice to generate" }),
      ).toBeDisabled();
    });

    it("does not call generateSelected when calibration is blocked", () => {
      hookOverrides = {
        phase: "presenting",
        analysis: mockAnalysis,
        angles: mockAngles,
        selectedAngleIds: new Set(["angle-0"]),
      };
      render(<CraftingAdvisor {...blockedProps} />);

      fireEvent.click(screen.getByRole("button", { name: "Calibrate voice to generate" }));

      expect(mockGenerateSelected).not.toHaveBeenCalled();
    });
  });

  // ---- generating state ----

  describe("generating phase", () => {
    it("shows the generating progress indicator", () => {
      renderAdvisor({
        phase: "generating",
        selectedAngleIds: new Set(["angle-0", "angle-1"]),
      });

      expect(screen.getByText("Generating 2 drafts\u2026")).toBeInTheDocument();
    });

    it("shows singular text for one draft", () => {
      renderAdvisor({
        phase: "generating",
        selectedAngleIds: new Set(["angle-0"]),
      });

      expect(screen.getByText("Generating 1 draft\u2026")).toBeInTheDocument();
    });
  });

  // ---- complete state ----

  describe("complete phase", () => {
    it("shows the drafts-ready message", () => {
      renderAdvisor({
        phase: "complete",
        generatedDrafts: mockDrafts,
      });

      expect(screen.getByText("1 draft ready in sidebar")).toBeInTheDocument();
    });

    it("shows plural label for multiple drafts", () => {
      renderAdvisor({
        phase: "complete",
        generatedDrafts: [...mockDrafts, { ...mockDrafts[0], id: "draft-2" }],
      });

      expect(screen.getByText("2 drafts ready in sidebar")).toBeInTheDocument();
    });

    it("renders the New analysis button and calls reset when clicked", () => {
      renderAdvisor({ phase: "complete", generatedDrafts: mockDrafts });

      const btn = screen.getByRole("button", { name: "New analysis" });
      expect(btn).toBeInTheDocument();

      fireEvent.click(btn);

      expect(mockReset).toHaveBeenCalledTimes(1);
    });

    it("renders the close button and calls onClose when clicked", () => {
      renderAdvisor({ phase: "complete", generatedDrafts: mockDrafts });

      fireEvent.click(screen.getByRole("button", { name: "Close advisor" }));

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onDraftsGenerated when phase transitions to complete", () => {
      const onDraftsGenerated = jest.fn();
      hookOverrides = { phase: "complete", generatedDrafts: mockDrafts };

      render(
        <CraftingAdvisor
          {...defaultProps}
          onDraftsGenerated={onDraftsGenerated}
        />,
      );

      expect(onDraftsGenerated).toHaveBeenCalledWith(mockDrafts);
    });
  });

  // ---- error state ----

  describe("error handling", () => {
    it("shows error message during presenting phase", () => {
      renderAdvisor({
        phase: "presenting",
        analysis: mockAnalysis,
        angles: mockAngles,
        selectedAngleIds: new Set<string>(),
        error: "Rate limit exceeded",
      });

      expect(screen.getByText("Rate limit exceeded")).toBeInTheDocument();
    });

    it("shows error with retry button during idle phase", () => {
      renderAdvisor({ phase: "idle", error: "Network error" });

      expect(screen.getByText("Network error")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    });

    it("calls startAnalysis when retry button is clicked", () => {
      renderAdvisor({ phase: "idle", error: "Network error" });

      fireEvent.click(screen.getByRole("button", { name: "Try again" }));

      expect(mockStartAnalysis).toHaveBeenCalledWith(
        defaultProps.sourceContent,
        defaultProps.sourceType,
        undefined,
      );
    });
  });

  // ---- edge cases ----

  describe("edge cases", () => {
    it("passes blendId and pageCount through to startAnalysis and generateSelected", () => {
      hookOverrides = {
        phase: "presenting",
        analysis: mockAnalysis,
        angles: mockAngles,
        selectedAngleIds: new Set(["angle-0"]),
      };

      render(
        <CraftingAdvisor
          {...defaultProps}
          blendId="blend-abc"
          pageCount={5}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "Generate 1 draft" }));

      expect(mockGenerateSelected).toHaveBeenCalledWith(
        defaultProps.sourceContent,
        defaultProps.sourceType,
        "blend-abc",
      );
    });

    it("does not call onDraftsGenerated when generatedDrafts is empty in complete phase", () => {
      const onDraftsGenerated = jest.fn();
      hookOverrides = { phase: "complete", generatedDrafts: [] };

      render(
        <CraftingAdvisor
          {...defaultProps}
          onDraftsGenerated={onDraftsGenerated}
        />,
      );

      expect(onDraftsGenerated).not.toHaveBeenCalled();
    });

    it("renders correctly with no optional props", () => {
      hookOverrides = { phase: "idle" };

      const { container } = render(
        <CraftingAdvisor
          sourceContent="test"
          sourceType="text"
          onDraftsGenerated={jest.fn()}
          onClose={jest.fn()}
        />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });
});

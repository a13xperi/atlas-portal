import "@testing-library/jest-dom";

import {
  canAdvance,
  getContinueLabel,
  getOnboardingCompletionHref,
  getTrackMeta,
  initialOracleState,
  oracleReducer,
  TRACK_META,
} from "@/lib/oracle";
import { DEFAULT_VOICE_DIMENSIONS } from "@/lib/voice-profile-dimensions";

describe("getOnboardingCompletionHref", () => {
  it("routes Track A completions to the dashboard banner", () => {
    expect(getOnboardingCompletionHref("a")).toBe(
      "/dashboard?banner=voice-calibrated"
    );
  });

  it("routes Track B completions to the voice lab prompt", () => {
    expect(getOnboardingCompletionHref("b")).toBe(
      "/voice-lab?prompt=complete-voice-setup"
    );
  });
});

describe("getTrackMeta", () => {
  it("returns null when track is null", () => {
    expect(getTrackMeta(null)).toBeNull();
  });

  it("returns Track A metadata", () => {
    expect(getTrackMeta("a")).toEqual(TRACK_META.a);
  });

  it("returns Track B metadata", () => {
    expect(getTrackMeta("b")).toEqual(TRACK_META.b);
  });
});

describe("getContinueLabel", () => {
  it.each([
    ["TRACK_A_RESULT", "a", "Looks right — continue"],
    ["TRACK_A_RESULT", "b", "Looks right — continue"],
    ["TRACK_B_STYLE", "a", "Use this as my starting point"],
    ["TRACK_B_STYLE", "b", "Use this as my starting point"],
    ["TRACK_B_DIMENSIONS", "a", "Lock in these dimensions"],
    ["TRACK_B_DIMENSIONS", "b", "Lock in these dimensions"],
    ["REFERENCES", "a", "These are my people"],
    ["REFERENCES", "b", "These voices feel right"],
    ["WELCOME", "a", "Continue"],
    ["WELCOME", "b", "Continue"],
    ["HANDOFF", "a", "Continue"],
  ] as const)(
    "returns the correct label for step %s track %s",
    (step, track, expected) => {
      expect(getContinueLabel(step, track)).toBe(expected);
    }
  );
});

describe("canAdvance", () => {
  const base = initialOracleState();

  it("allows advancing from WELCOME", () => {
    expect(canAdvance(base)).toBe(true);
  });

  it("blocks advancing from CONNECT_X when not connected", () => {
    const state = { ...base, currentStep: "CONNECT_X" as const };
    expect(canAdvance(state)).toBe(false);
  });

  it("allows advancing from CONNECT_X when connected with handle", () => {
    const state = {
      ...base,
      currentStep: "CONNECT_X" as const,
      xConnected: true,
      xHandle: "alex",
    };
    expect(canAdvance(state)).toBe(true);
  });

  it("blocks advancing from TRACK_A_SCANNING without calibration", () => {
    const state = { ...base, currentStep: "TRACK_A_SCANNING" as const };
    expect(canAdvance(state)).toBe(false);
  });

  it("allows advancing from TRACK_A_SCANNING with calibration result", () => {
    const state = {
      ...base,
      currentStep: "TRACK_A_SCANNING" as const,
      calibrationResult: { analysis: "test", tweetsAnalyzed: 42 },
    };
    expect(canAdvance(state)).toBe(true);
  });

  it("allows advancing from TRACK_A_RESULT", () => {
    const state = { ...base, currentStep: "TRACK_A_RESULT" as const };
    expect(canAdvance(state)).toBe(true);
  });

  it("blocks advancing from TRACK_B_STYLE without selection", () => {
    const state = { ...base, currentStep: "TRACK_B_STYLE" as const };
    expect(canAdvance(state)).toBe(false);
  });

  it("allows advancing from TRACK_B_STYLE with selection", () => {
    const state = {
      ...base,
      currentStep: "TRACK_B_STYLE" as const,
      selectedStyle: "Fun",
    };
    expect(canAdvance(state)).toBe(true);
  });

  it("allows advancing from TRACK_B_CONTENT", () => {
    const state = { ...base, currentStep: "TRACK_B_CONTENT" as const };
    expect(canAdvance(state)).toBe(true);
  });

  it("allows advancing from TRACK_B_DIMENSIONS", () => {
    const state = { ...base, currentStep: "TRACK_B_DIMENSIONS" as const };
    expect(canAdvance(state)).toBe(true);
  });

  it("blocks advancing from REFERENCES without selections", () => {
    const state = { ...base, currentStep: "REFERENCES" as const };
    expect(canAdvance(state)).toBe(false);
  });

  it("allows advancing from REFERENCES with at least one selection", () => {
    const state = {
      ...base,
      currentStep: "REFERENCES" as const,
      selectedRefs: ["ref1"],
    };
    expect(canAdvance(state)).toBe(true);
  });

  it("allows advancing from BLEND", () => {
    const state = { ...base, currentStep: "BLEND" as const };
    expect(canAdvance(state)).toBe(true);
  });

  it("allows advancing from TOPICS", () => {
    const state = { ...base, currentStep: "TOPICS" as const };
    expect(canAdvance(state)).toBe(true);
  });

  it("blocks advancing from HANDOFF", () => {
    const state = { ...base, currentStep: "HANDOFF" as const };
    expect(canAdvance(state)).toBe(false);
  });
});

describe("oracleReducer", () => {
  const base = initialOracleState();

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(1_000_000);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("SET_TRACK", () => {
    it("selects track a and advances to CONNECT_X", () => {
      const state = oracleReducer(base, { type: "SET_TRACK", track: "a" });
      expect(state.track).toBe("a");
      expect(state.currentStep).toBe("CONNECT_X");
      expect(state.selfPercentage).toBe(50);
      expect(state.messages[state.messages.length - 1].role).toBe("user");
      expect(state.pendingMessages.length).toBeGreaterThan(0);
    });

    it("selects track b and advances to TRACK_B_STYLE", () => {
      const state = oracleReducer(base, { type: "SET_TRACK", track: "b" });
      expect(state.track).toBe("b");
      expect(state.currentStep).toBe("TRACK_B_STYLE");
      expect(state.selfPercentage).toBe(30);
      expect(state.messages[state.messages.length - 1].role).toBe("user");
      expect(state.pendingMessages.length).toBeGreaterThan(0);
    });
  });

  describe("ADVANCE", () => {
    it("advances from WELCOME to CONNECT_X and records history", () => {
      const state = oracleReducer(base, {
        type: "ADVANCE",
        payload: "Let's go",
      });
      expect(state.currentStep).toBe("CONNECT_X");
      expect(state.stepHistory.length).toBe(1);
      expect(state.stepHistory[0].step).toBe("WELCOME");
      expect(state.messages[state.messages.length - 1].content).toBe("Let's go");
      expect(state.pendingMessages.length).toBeGreaterThan(0);
    });

    it("does not advance from a terminal step", () => {
      const terminal = { ...base, currentStep: "HANDOFF" as const };
      const state = oracleReducer(terminal, { type: "ADVANCE" });
      expect(state.currentStep).toBe("HANDOFF");
      expect(state.stepHistory).toEqual([]);
    });

    it("caps history at 10 entries", () => {
      // Use a synthetic non-terminal step so we can keep advancing indefinitely.
      let state = { ...base, currentStep: "WELCOME" as const };
      const cycle: Array<typeof base.currentStep> = [
        "WELCOME",
        "CONNECT_X",
        "TRACK_B_STYLE",
        "TRACK_B_CONTENT",
        "TRACK_B_DIMENSIONS",
      ];
      for (let i = 0; i < 14; i++) {
        const nextStep = cycle[(cycle.indexOf(state.currentStep) + 1) % cycle.length];
        state = oracleReducer(
          { ...state, currentStep: state.currentStep },
          { type: "ADVANCE", payload: `step ${i}` }
        );
        // Force the next step so we never hit a terminal step
        state = { ...state, currentStep: nextStep };
      }
      expect(state.stepHistory.length).toBe(10);
    });

    it("appends user message only when payload is provided", () => {
      const state = oracleReducer(base, { type: "ADVANCE" });
      expect(state.currentStep).toBe("CONNECT_X");
      expect(state.messages.length).toBe(base.messages.length);
    });
  });

  describe("GO_BACK", () => {
    it("restores previous step and truncates messages", () => {
      const s1 = oracleReducer(base, { type: "SET_TRACK", track: "a" });
      const s2 = oracleReducer(s1, {
        type: "ADVANCE",
        payload: "Connected",
      });
      expect(s2.currentStep).toBe("TRACK_A_SCANNING");
      expect(s2.messages.length).toBeGreaterThan(s1.messages.length);

      const back = oracleReducer(s2, { type: "GO_BACK" });
      expect(back.currentStep).toBe("CONNECT_X");
      expect(back.messages.length).toBe(s1.messages.length);
      expect(back.stepHistory.length).toBe(0);
      expect(back.isTyping).toBe(false);
      expect(back.pendingMessages).toEqual([]);
    });

    it("does nothing when history is empty", () => {
      const state = oracleReducer(base, { type: "GO_BACK" });
      expect(state).toEqual(base);
    });

    it("restores snapshot state including dimensions", () => {
      const withDims = {
        ...base,
        dimensions: { ...DEFAULT_VOICE_DIMENSIONS, humor: 80 },
      };
      // ADVANCE to build history, then mutate dimensions, then go back.
      const s1 = oracleReducer(withDims, { type: "ADVANCE", payload: "go" });
      const s2 = oracleReducer(s1, {
        type: "SET_DIMENSIONS",
        dimensions: { ...DEFAULT_VOICE_DIMENSIONS, humor: 20 },
      });
      const back = oracleReducer(s2, { type: "GO_BACK" });
      expect(back.currentStep).toBe("WELCOME");
      expect(back.dimensions.humor).toBe(80);
    });
  });

  describe("SET_HANDLE", () => {
    it("updates xHandle", () => {
      const state = oracleReducer(base, {
        type: "SET_HANDLE",
        handle: "alex",
      });
      expect(state.xHandle).toBe("alex");
    });
  });

  describe("SET_X_CONNECTED", () => {
    it("updates xConnected", () => {
      const state = oracleReducer(base, {
        type: "SET_X_CONNECTED",
        connected: true,
      });
      expect(state.xConnected).toBe(true);
    });
  });

  describe("SET_CALIBRATION", () => {
    it("updates calibrationResult", () => {
      const result = { analysis: "test", tweetsAnalyzed: 5 };
      const state = oracleReducer(base, {
        type: "SET_CALIBRATION",
        result,
      });
      expect(state.calibrationResult).toEqual(result);
    });
  });

  describe("SET_DIMENSIONS", () => {
    it("updates dimensions", () => {
      const dims = { ...DEFAULT_VOICE_DIMENSIONS, humor: 99 };
      const state = oracleReducer(base, {
        type: "SET_DIMENSIONS",
        dimensions: dims,
      });
      expect(state.dimensions).toEqual(dims);
    });
  });

  describe("SET_STYLE", () => {
    it("updates selectedStyle", () => {
      const state = oracleReducer(base, { type: "SET_STYLE", style: "Serious" });
      expect(state.selectedStyle).toBe("Serious");
    });
  });

  describe("SET_REFS", () => {
    it("updates selectedRefs", () => {
      const state = oracleReducer(base, {
        type: "SET_REFS",
        ids: ["ref1", "ref2"],
      });
      expect(state.selectedRefs).toEqual(["ref1", "ref2"]);
    });
  });

  describe("SET_BLEND", () => {
    it("updates selfPercentage", () => {
      const state = oracleReducer(base, { type: "SET_BLEND", percentage: 75 });
      expect(state.selfPercentage).toBe(75);
    });
  });

  describe("SET_TOPICS", () => {
    it("updates selectedTopics", () => {
      const state = oracleReducer(base, {
        type: "SET_TOPICS",
        topics: ["crypto", "ai"],
      });
      expect(state.selectedTopics).toEqual(["crypto", "ai"]);
    });
  });

  describe("ENQUEUE_MESSAGES", () => {
    it("appends messages to pendingMessages", () => {
      const msgs = [
        { id: "1", role: "oracle" as const, content: "hello", timestamp: 1 },
      ];
      const state = oracleReducer(base, {
        type: "ENQUEUE_MESSAGES",
        messages: msgs,
      });
      expect(state.pendingMessages.length).toBe(base.pendingMessages.length + 1);
      expect(state.pendingMessages[state.pendingMessages.length - 1]).toEqual(
        msgs[0]
      );
    });
  });

  describe("DEQUEUE_MESSAGE", () => {
    it("moves the first pending message to messages", () => {
      const state = oracleReducer(base, { type: "DEQUEUE_MESSAGE" });
      expect(state.pendingMessages.length).toBe(base.pendingMessages.length - 1);
      expect(state.messages.length).toBe(base.messages.length + 1);
      expect(state.isTyping).toBe(false);
    });

    it("clears isTyping when no pending messages remain", () => {
      const emptyPending = { ...base, pendingMessages: [], isTyping: true };
      const state = oracleReducer(emptyPending, { type: "DEQUEUE_MESSAGE" });
      expect(state.isTyping).toBe(false);
      expect(state.pendingMessages).toEqual([]);
      expect(state.messages).toEqual(base.messages);
    });
  });

  describe("SET_TYPING", () => {
    it("updates isTyping", () => {
      const state = oracleReducer(base, { type: "SET_TYPING", isTyping: true });
      expect(state.isTyping).toBe(true);
    });
  });

  describe("unknown action", () => {
    it("returns state unchanged", () => {
      // @ts-expect-error testing unknown action
      const state = oracleReducer(base, { type: "UNKNOWN" });
      expect(state).toEqual(base);
    });
  });
});

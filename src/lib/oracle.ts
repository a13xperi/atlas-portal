import type { OracleAction, OracleState, OracleStep } from "./oracle-types";
import { DEFAULT_VOICE_DIMENSIONS } from "./voice-profile-dimensions";
import { prepareMessages } from "./oracle-messages";

// ── Step transition map ────────────────────────────────────────────
const NEXT_STEP: Record<OracleStep, OracleStep | null> = {
  WELCOME: null, // determined by track selection
  TRACK_A_HANDLE: "TRACK_A_SCANNING",
  TRACK_A_SCANNING: "TRACK_A_RESULT",
  TRACK_A_RESULT: "TRACK_A_RATE",
  TRACK_A_RATE: "REFERENCES",
  TRACK_B_STYLE: "TRACK_B_DIMENSIONS",
  TRACK_B_DIMENSIONS: "REFERENCES",
  REFERENCES: "BLEND",
  BLEND: "TOPICS",
  TOPICS: "HANDOFF",
  HANDOFF: null, // terminal
};

// ── Can-advance predicates ─────────────────────────────────────────
export function canAdvance(state: OracleState): boolean {
  switch (state.currentStep) {
    case "WELCOME":
      return state.track !== null;
    case "TRACK_A_HANDLE":
      return state.xHandle.trim().length > 0;
    case "TRACK_A_SCANNING":
      return state.calibrationResult !== null;
    case "TRACK_A_RESULT":
      return true;
    case "TRACK_A_RATE":
      return true;
    case "TRACK_B_STYLE":
      return state.selectedStyle !== null;
    case "TRACK_B_DIMENSIONS":
      return state.displayName.trim().length >= 2;
    case "REFERENCES":
      return state.selectedRefs.length >= 2;
    case "BLEND":
      return true;
    case "TOPICS":
      return state.selectedTopics.length >= 1;
    case "HANDOFF":
      return false; // terminal
  }
}

// ── Initial state ──────────────────────────────────────────────────
export function initialOracleState(): OracleState {
  return {
    currentStep: "WELCOME",
    track: null,
    messages: [],
    pendingMessages: prepareMessages("WELCOME"),
    isTyping: false,
    xHandle: "",
    calibrationResult: null,
    dimensions: DEFAULT_VOICE_DIMENSIONS,
    displayName: "",
    selectedStyle: null,
    selectedRefs: [],
    selfPercentage: 50,
    selectedTopics: [],
  };
}

// ── Reducer ────────────────────────────────────────────────────────
export function oracleReducer(
  state: OracleState,
  action: OracleAction
): OracleState {
  switch (action.type) {
    case "SET_TRACK": {
      const track = action.track;
      const nextStep: OracleStep =
        track === "a" ? "TRACK_A_HANDLE" : "TRACK_B_STYLE";
      const userMsg = {
        id: `user-track-${Date.now()}`,
        role: "user" as const,
        content: track === "a" ? "Connect X" : "Set up manually",
        timestamp: Date.now(),
      };
      return {
        ...state,
        track,
        currentStep: nextStep,
        messages: [...state.messages, userMsg],
        pendingMessages: prepareMessages(nextStep),
        selfPercentage: track === "a" ? 50 : 30,
      };
    }

    case "ADVANCE": {
      const next = NEXT_STEP[state.currentStep];
      if (!next) return state;
      const userContent = action.payload;
      const userMsg = userContent
        ? {
            id: `user-${Date.now()}`,
            role: "user" as const,
            content: userContent,
            timestamp: Date.now(),
          }
        : null;
      return {
        ...state,
        currentStep: next,
        messages: userMsg
          ? [...state.messages, userMsg]
          : state.messages,
        pendingMessages: prepareMessages(next),
      };
    }

    case "SET_HANDLE":
      return { ...state, xHandle: action.handle };

    case "SET_CALIBRATION":
      return { ...state, calibrationResult: action.result };

    case "SET_DIMENSIONS":
      return { ...state, dimensions: action.dimensions };

    case "SET_DISPLAY_NAME":
      return { ...state, displayName: action.name };

    case "SET_STYLE":
      return { ...state, selectedStyle: action.style };

    case "SET_REFS":
      return { ...state, selectedRefs: action.ids };

    case "SET_BLEND":
      return { ...state, selfPercentage: action.percentage };

    case "SET_TOPICS":
      return { ...state, selectedTopics: action.topics };

    case "ENQUEUE_MESSAGES":
      return {
        ...state,
        pendingMessages: [...state.pendingMessages, ...action.messages],
      };

    case "DEQUEUE_MESSAGE": {
      const [next, ...rest] = state.pendingMessages;
      if (!next) return { ...state, isTyping: false };
      return {
        ...state,
        messages: [...state.messages, next],
        pendingMessages: rest,
        isTyping: rest.length > 0,
      };
    }

    case "SET_TYPING":
      return { ...state, isTyping: action.isTyping };

    default:
      return state;
  }
}

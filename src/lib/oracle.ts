import type { OracleAction, OracleState, OracleStep } from "./oracle-types";
import { DEFAULT_VOICE_DIMENSIONS } from "./voice-profile-dimensions";
import { prepareMessages } from "./oracle-messages";

// ── Track metadata — human-first, visible to users ───────────────
export interface TrackMeta {
  id: "a" | "b";
  /** Backend Prisma enum value this UI track maps to. */
  backendEnum: "TRACK_A" | "TRACK_B";
  /** Short badge label shown in the onboarding header. */
  label: string;
  /** One-sentence "what this track does" tagline — used as badge title. */
  tagline: string;
  /** Icon key — TrackBadge picks a lucide icon from this. */
  iconKey: "sparkles" | "brush";
  /** Tailwind utility applied to the badge border + text. */
  accent: string;
}

/**
 * Track metadata keyed by local frontend state.track value.
 *
 * Frontend "a" = X-first path (Connect X → scan tweets → refine).
 * Frontend "b" = Manual path (pick a style → dial in from scratch).
 *
 * User-facing labels are functional ("X-Powered", "Hand-Crafted"),
 * not letter-coded, so the copy reads naturally regardless of how the
 * local state ids map to backend enum values.
 */
export const TRACK_META: Record<"a" | "b", TrackMeta> = {
  a: {
    id: "a",
    backendEnum: "TRACK_B",
    label: "X-Powered",
    tagline: "I scan your tweets to learn your voice, then you refine.",
    iconKey: "sparkles",
    accent: "border-atlas-teal text-atlas-teal",
  },
  b: {
    id: "b",
    backendEnum: "TRACK_A",
    label: "Hand-Crafted",
    tagline: "Pick a starter style and we dial it in together from scratch.",
    iconKey: "brush",
    accent: "border-delphi-teal text-delphi-teal",
  },
};

export function getTrackMeta(track: OracleState["track"]): TrackMeta | null {
  if (!track) return null;
  return TRACK_META[track];
}

/**
 * Track-aware continue CTA label for each step. Human-first verbs tell
 * the user exactly what clicking the button will do next — "Continue" is
 * the silent fallback.
 */
export function getContinueLabel(
  step: OracleStep,
  track: OracleState["track"],
): string {
  switch (step) {
    case "TRACK_A_RESULT":
      return "Looks right — continue";
    case "TRACK_B_STYLE":
      return "Use this as my starting point";
    case "TRACK_B_DIMENSIONS":
      return "Lock in these dimensions";
    case "REFERENCES":
      return track === "a"
        ? "These are my people"
        : "These voices feel right";
    default:
      return "Continue";
  }
}

// ── Step transition map ────────────────────────────────────────────
const NEXT_STEP: Record<OracleStep, OracleStep | null> = {
  WELCOME: "TRACK_A_SCANNING",
  CONNECT_X: "WELCOME",
  TRACK_A_SCANNING: "TRACK_A_RESULT",
  TRACK_A_RESULT: "REFERENCES",
  TRACK_B_STYLE: "TRACK_B_CONTENT",
  TRACK_B_CONTENT: "TRACK_B_DIMENSIONS",
  TRACK_B_DIMENSIONS: "REFERENCES",
  REFERENCES: "NAME_VOICE",
  BLEND: "HANDOFF",
  NAME_VOICE: "HANDOFF",
  TOPICS: "HANDOFF", // legacy fallback, step skipped in flow
  HANDOFF: null, // terminal
};

export interface OnboardingRoutingState {
  track: OracleState["track"];
  voiceCalibrated: boolean; // tweetsAnalyzed >= MIN_TWEETS_FOR_VOICE_CALIBRATION
  onboardingComplete: boolean; // user.onboardingTrack !== null
}

export function getOnboardingCompletionHref(
  state: OnboardingRoutingState
): string {
  const { track, voiceCalibrated, onboardingComplete } = state;

  // Stage 1: voice not calibrated → steer to calibration
  if (!voiceCalibrated) {
    return track === "b"
      ? "/voice-lab?prompt=complete-voice-setup"
      : "/voice-profiles?prompt=calibrate";
  }

  // Stage 2: calibrated but onboarding not persisted → finish onboarding
  if (!onboardingComplete) {
    return "/onboarding?resume=handoff";
  }

  // Stage 3: fully done
  return "/dashboard?banner=voice-calibrated";
}

// ── Can-advance predicates ─────────────────────────────────────────
export function canAdvance(state: OracleState): boolean {
  switch (state.currentStep) {
    case "WELCOME":
      return true;
    case "CONNECT_X":
      return true; // allow skip
    case "TRACK_A_SCANNING":
      return state.calibrationResult !== null;
    case "TRACK_A_RESULT":
      return true;
    case "TRACK_B_STYLE":
      return state.selectedStyle !== null;
    case "TRACK_B_CONTENT":
      return true; // content signals are optional
    case "TRACK_B_DIMENSIONS":
      return true;
    case "REFERENCES":
      return state.selectedRefs.length >= 1;
    case "BLEND":
      return true;
    case "NAME_VOICE":
      return state.blendName.trim().length > 0;
    case "TOPICS":
      return true; // step skipped in flow, kept for type exhaustiveness
    case "HANDOFF":
      return false; // terminal
  }
}

// ── Initial state ──────────────────────────────────────────────────
export function initialOracleState(): OracleState {
  return {
    currentStep: "CONNECT_X",
    track: null,
    messages: [],
    pendingMessages: prepareMessages("CONNECT_X", null),
    isTyping: false,
    xHandle: "",
    xConnected: false,
    calibrationResult: null,
    dimensions: DEFAULT_VOICE_DIMENSIONS,
    selectedStyle: null,
    selectedRefs: [],
    selfPercentage: 50,
    selectedTopics: [],
    blendName: "",
    stepHistory: [],
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
        track === "a" ? "TRACK_A_SCANNING" : "TRACK_B_STYLE";
      const userMsg = {
        id: `user-track-${Date.now()}`,
        role: "user" as const,
        content: track === "a" ? "X-Powered" : "Hand-Crafted",
        timestamp: Date.now(),
      };
      return {
        ...state,
        track,
        currentStep: nextStep,
        messages: [...state.messages, userMsg],
        pendingMessages: prepareMessages(nextStep, track),
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
      // Save snapshot for back-navigation (cap at 10)
      const { stepHistory: _h, ...snapshot } = state;
      const newHistory = [...state.stepHistory, { step: state.currentStep, messageCount: state.messages.length, snapshot: snapshot as Omit<typeof state, 'stepHistory'> }].slice(-10);
      return {
        ...state,
        currentStep: next,
        messages: userMsg
          ? [...state.messages, userMsg]
          : state.messages,
        pendingMessages: prepareMessages(next, state.track),
        stepHistory: newHistory,
      };
    }

    case "GO_BACK": {
      if (state.stepHistory.length === 0) return state;
      const history = [...state.stepHistory];
      const prev = history.pop()!;
      return {
        ...prev.snapshot,
        // Truncate messages to what existed at that step
        messages: state.messages.slice(0, prev.messageCount),
        pendingMessages: [],
        isTyping: false,
        stepHistory: history,
      };
    }

    case "SET_HANDLE":
      return { ...state, xHandle: action.handle };

    case "SET_X_CONNECTED":
      return { ...state, xConnected: action.connected };

    case "SET_CALIBRATION":
      return { ...state, calibrationResult: action.result };

    case "SET_DIMENSIONS":
      return { ...state, dimensions: action.dimensions };

    case "SET_STYLE":
      return { ...state, selectedStyle: action.style };

    case "SET_REFS":
      return { ...state, selectedRefs: action.ids };

    case "SET_BLEND":
      return { ...state, selfPercentage: action.percentage };

    case "SET_TOPICS":
      return { ...state, selectedTopics: action.topics };

    case "SET_BLEND_NAME":
      return { ...state, blendName: action.name };

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
        isTyping: false,
      };
    }

    case "START_STREAM_MESSAGE": {
      const [next, ...rest] = state.pendingMessages;
      if (!next) return { ...state, isTyping: false };
      return {
        ...state,
        messages: [...state.messages, { ...next, content: "" }],
        pendingMessages: rest,
        isTyping: true,
      };
    }

    case "APPEND_TO_LAST_MESSAGE": {
      if (state.messages.length === 0) return state;
      const lastIndex = state.messages.length - 1;
      const last = state.messages[lastIndex];
      return {
        ...state,
        messages: [
          ...state.messages.slice(0, lastIndex),
          { ...last, content: last.content + action.text },
        ],
      };
    }

    case "SET_TYPING":
      return { ...state, isTyping: action.isTyping };

    default:
      return state;
  }
}

/** Create a ReadableStream that yields words from `text` one at a time. */
export function createTextStream(text: string, wordDelayMs = 30): ReadableStream<string> {
  const tokens = text.split(/(\s+)/);
  return new ReadableStream<string>({
    start(controller) {
      let i = 0;
      function push() {
        if (i >= tokens.length) {
          controller.close();
          return;
        }
        controller.enqueue(tokens[i]);
        i++;
        setTimeout(push, wordDelayMs);
      }
      push();
    },
  });
}

/** Parse a server-sent events (SSE) stream into yielded JSON objects. */
export async function* readSSEStream<T = unknown>(stream: ReadableStream<Uint8Array>): AsyncGenerator<T, void, unknown> {
  const reader = stream.pipeThrough(new TextDecoderStream() as unknown as ReadableWritablePair<string, Uint8Array>).getReader();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += value;
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") return;
        try {
          yield JSON.parse(data) as T;
        } catch {
          yield data as unknown as T;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

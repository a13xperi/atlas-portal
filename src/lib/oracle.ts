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

    case "TRACK_B_STYLE":
      return "Use this as my starting point";
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
  WELCOME: "OWN_TWEET_TINDER",
  CONNECT_X: "WELCOME",
  OWN_TWEET_TINDER: "REFERENCE_TINDER",
  REFERENCE_TINDER: "REFERENCES",
  TRACK_B_STYLE: "REFERENCES",
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
    case "OWN_TWEET_TINDER":
      return state.archetype !== null || state.calibrationResult !== null;
    case "REFERENCE_TINDER":
      return true; // optional skip
    case "TRACK_B_STYLE":
      return state.selectedStyle !== null;
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
    archetype: null,
    dimensions: DEFAULT_VOICE_DIMENSIONS,
    selectedStyle: null,
    swipeResults: { own: [], ref: [] },
    referenceHandles: [],
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
      // If X is connected, both tracks go through tweet tinder calibration.
      // If X is skipped, Track B gets the style picker; Track A falls through.
      const nextStep: OracleStep = state.xConnected
        ? "OWN_TWEET_TINDER"
        : track === "b"
          ? "TRACK_B_STYLE"
          : "REFERENCES";
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
        swipeResults: { own: [], ref: [] },
        referenceHandles: [],
      };
    }

    case "ADVANCE": {
      let next = NEXT_STEP[state.currentStep];
      if (state.currentStep === "REFERENCES" && state.track === "b") {
        next = "NAME_VOICE";
      }
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
      console.log("[oracleReducer] SET_CALIBRATION", action.result);
      return { ...state, calibrationResult: action.result };

    case "SET_ARCHETYPE":
      return { ...state, archetype: action.archetype };

    case "SET_DIMENSIONS":
      console.log("[oracleReducer] SET_DIMENSIONS", action.dimensions);
      return {
        ...state,
        dimensions: action.dimensions,
        calibrationResult: state.calibrationResult
          ? { ...state.calibrationResult, dimensions: action.dimensions }
          : null,
      };

    case "SET_STYLE":
      return { ...state, selectedStyle: action.style };

    case "RECORD_SWIPE": {
      const nextSwipeResults = {
        own: [...state.swipeResults.own],
        ref: [...state.swipeResults.ref],
      };

      for (const signal of action.signals) {
        const bucket = signal.source === "OWN" ? "own" : "ref";
        const existingIndex = nextSwipeResults[bucket].findIndex(
          (candidate) =>
            candidate.tweetId === signal.tweetId &&
            candidate.direction === signal.direction &&
            (candidate.handle ?? null) === (signal.handle ?? null)
        );

        if (existingIndex >= 0) {
          nextSwipeResults[bucket][existingIndex] = signal;
        } else {
          nextSwipeResults[bucket].push(signal);
        }
      }

      return { ...state, swipeResults: nextSwipeResults };
    }

    case "SET_REF_HANDLES":
      return {
        ...state,
        referenceHandles: Array.from(
          new Set(
            action.handles
              .map((handle) => handle.replace(/^@/, "").trim().toLowerCase())
              .filter(Boolean)
          )
        ).slice(0, 3),
      };

    case "RESET_SWIPES": {
      const scope = action.scope ?? "all";
      return {
        ...state,
        swipeResults: {
          own: scope === "ref" ? state.swipeResults.own : [],
          ref: scope === "own" ? state.swipeResults.ref : [],
        },
      };
    }

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
export function createTextStream(
  text: string,
  wordDelayMs = 30,
  signal?: AbortSignal
): ReadableStream<string> {
  const tokens = text.split(/(\s+)/);
  return new ReadableStream<string>({
    start(controller) {
      if (signal?.aborted) {
        controller.close();
        return;
      }
      let i = 0;
      let timer: ReturnType<typeof setTimeout> | null = null;
      let closed = false;
      const close = () => {
        if (closed) return;
        closed = true;
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        try {
          controller.error(new Error("Aborted"));
        } catch {
          // already closed
        }
      };
      if (signal) {
        signal.addEventListener("abort", close, { once: true });
      }
      function push() {
        if (closed) return;
        if (i >= tokens.length) {
          closed = true;
          try {
            controller.close();
          } catch {
            // already closed
          }
          return;
        }
        try {
          controller.enqueue(tokens[i]);
        } catch {
          closed = true;
          return;
        }
        i++;
        timer = setTimeout(push, wordDelayMs);
      }
      push();
    },
    cancel() {
      // Cleanup handled implicitly; closed flag prevents further enqueue.
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

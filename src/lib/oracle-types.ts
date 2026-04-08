import type { VoiceDimensions } from "./voice-profile-dimensions";

// ── Steps ──────────────────────────────────────────────────────────
export type OracleStep =
  | "WELCOME"
  | "CONNECT_X"
  | "PULL_TWEETS"
  | "TRACK_A_HANDLE"   // legacy alias — not used in new flow
  | "TRACK_A_SCANNING" // legacy alias — not used in new flow
  | "TRACK_A_RESULT"
  | "TRACK_A_RATE"
  | "TRACK_B_STYLE"
  | "TRACK_B_CONTENT"
  | "TRACK_B_DIMENSIONS"
  | "REFERENCES"
  | "BLEND"
  | "TOPICS"
  | "HANDOFF";

// ── Inline component types ─────────────────────────────────────────
export type InlineComponentType =
  | "x-connect"
  | "handle-input"
  | "scan-progress"
  | "dimensions"
  | "tweet-ratings"
  | "style-picker"
  | "references"
  | "blend"
  | "topics"
  | "content-signals"
  | "handoff-telegram";

// ── Messages ───────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  role: "oracle" | "user" | "system";
  content: string;
  component?: {
    type: InlineComponentType;
    props?: Record<string, unknown>;
  };
  actions?: Array<{
    label: string;
    value: string;
    variant: "primary" | "secondary" | "ghost";
  }>;
  timestamp: number;
}

// ── State ──────────────────────────────────────────────────────────
export interface OracleState {
  currentStep: OracleStep;
  track: "a" | "b" | null;
  messages: ChatMessage[];
  pendingMessages: ChatMessage[];
  isTyping: boolean;

  // Accumulated onboarding data
  xHandle: string;
  xConnected: boolean;
  calibrationResult: { analysis: string; tweetsAnalyzed: number } | null;
  dimensions: VoiceDimensions;
  displayName: string;
  selectedStyle: string | null;
  selectedRefs: string[];
  selfPercentage: number;
  selectedTopics: string[];

  // Back-navigation
  stepHistory: Array<{ step: OracleStep; messageCount: number; snapshot: Omit<OracleState, 'stepHistory'> }>;
}

// ── Actions ────────────────────────────────────────────────────────
export type OracleAction =
  | { type: "SET_TRACK"; track: "a" | "b" }
  | { type: "ADVANCE"; payload?: string }
  | { type: "SET_HANDLE"; handle: string }
  | { type: "SET_X_CONNECTED"; connected: boolean }
  | { type: "SET_CALIBRATION"; result: OracleState["calibrationResult"] }
  | { type: "SET_DIMENSIONS"; dimensions: VoiceDimensions }
  | { type: "SET_DISPLAY_NAME"; name: string }
  | { type: "SET_STYLE"; style: string }
  | { type: "SET_REFS"; ids: string[] }
  | { type: "SET_BLEND"; percentage: number }
  | { type: "SET_TOPICS"; topics: string[] }
  | { type: "ENQUEUE_MESSAGES"; messages: ChatMessage[] }
  | { type: "DEQUEUE_MESSAGE" }
  | { type: "SET_TYPING"; isTyping: boolean }
  | { type: "GO_BACK" };

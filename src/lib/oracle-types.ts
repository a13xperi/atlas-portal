import type { VoiceDimensions } from "./voice-profile-dimensions";

// ── Content signals (Track B) ──────────────────────────────────────
export type ContentSignalSource = "article" | "report" | "tweet" | "link";

export interface ContentSignal {
  source: ContentSignalSource;
  title?: string;
  url?: string;
  addedLabel?: string;
}

// ── Steps ──────────────────────────────────────────────────────────
export type OracleStep =
  | "WELCOME"
  | "CONNECT_X"
  | "TRACK_A_SCANNING"
  | "TRACK_A_RESULT"
  | "TRACK_B_STYLE"
  | "TRACK_B_CONTENT"
  | "TRACK_B_DIMENSIONS"
  | "REFERENCES"
  | "BLEND"
  | "NAME_VOICE"
  | "TOPICS"
  | "HANDOFF";

// ── Inline component types ─────────────────────────────────────────
export type InlineComponentType =
  | "x-oauth"
  | "scan-progress"
  | "dimensions"
  | "style-picker"
  | "references"
  | "blend"
  | "voice-name-input"
  | "topics"
  | "content-signals"
  | "handoff-telegram";

// ── Messages ───────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  role: "oracle" | "user" | "system";
  content: string;
  // Optional tag for special rendering paths (e.g. Track B content signals).
  type?: "content_signal";
  component?: {
    type: InlineComponentType;
    props?: Record<string, unknown>;
  };
  actions?: Array<{
    label: string;
    value: string;
    variant: "primary" | "secondary" | "ghost";
  }>;
  // Arbitrary structured attachments rendered below the message bubble.
  metadata?: {
    contentSignal?: ContentSignal;
    [key: string]: unknown;
  };
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
  selectedStyle: string | null;
  selectedRefs: string[];
  selfPercentage: number;
  selectedTopics: string[];
  blendName: string;

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
  | { type: "SET_STYLE"; style: string }
  | { type: "SET_REFS"; ids: string[] }
  | { type: "SET_BLEND"; percentage: number }
  | { type: "SET_TOPICS"; topics: string[] }
  | { type: "SET_BLEND_NAME"; name: string }
  | { type: "ENQUEUE_MESSAGES"; messages: ChatMessage[] }
  | { type: "DEQUEUE_MESSAGE" }
  | { type: "START_STREAM_MESSAGE" }
  | { type: "APPEND_TO_LAST_MESSAGE"; text: string }
  | { type: "SET_TYPING"; isTyping: boolean }
  | { type: "GO_BACK" };

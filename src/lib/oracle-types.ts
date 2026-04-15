import type { VoiceDimensions } from "./voice-profile-dimensions";
import type { VoiceArchetype } from "./api";

// ── Content signals (Track B) ──────────────────────────────────────
export type ContentSignalSource = "article" | "report" | "tweet" | "link";

export interface ContentSignal {
  source: ContentSignalSource;
  title?: string;
  url?: string;
  addedLabel?: string;
}

export type SwipeSignalDirection = "like" | "dislike";
export type SwipeSignalSource = "OWN" | "REF";

export interface SwipeSignal {
  tweetId: string;
  text: string;
  direction: SwipeSignalDirection;
  source: SwipeSignalSource;
  handle?: string | null;
  reasons: string[];
}

// ── Steps ──────────────────────────────────────────────────────────
export type OracleStep =
  | "WELCOME"
  | "CONNECT_X"
  | "OWN_TWEET_TINDER"
  | "REFERENCE_TINDER"
  | "TRACK_B_STYLE"
  | "REFERENCES"
  | "BLEND"
  | "NAME_VOICE"
  | "TOPICS"
  | "HANDOFF";

// ── Inline component types ─────────────────────────────────────────
export type InlineComponentType =
  | "x-oauth"
  | "own-tweet-tinder"
  | "reference-tinder"
  | "archetype-reveal"
  | "style-picker"
  | "references"
  | "blend"
  | "voice-name-input"
  | "topics"
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
  calibrationResult: { analysis: string; tweetsAnalyzed: number; dimensions?: VoiceDimensions } | null;
  archetype: VoiceArchetype | null;
  dimensions: VoiceDimensions;
  selectedStyle: string | null;
  swipeResults: {
    own: SwipeSignal[];
    ref: SwipeSignal[];
  };
  referenceHandles: string[];
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
  | { type: "SET_ARCHETYPE"; archetype: VoiceArchetype | null }
  | { type: "SET_DIMENSIONS"; dimensions: VoiceDimensions }
  | { type: "SET_STYLE"; style: string }
  | { type: "RECORD_SWIPE"; signals: SwipeSignal[] }
  | { type: "SET_REF_HANDLES"; handles: string[] }
  | { type: "RESET_SWIPES"; scope?: "own" | "ref" | "all" }
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

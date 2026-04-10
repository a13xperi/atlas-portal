import type { ChatMessage, OracleStep } from "./oracle-types";

let _id = 0;
function msg(
  role: ChatMessage["role"],
  content: string,
  extra?: Partial<ChatMessage>
): ChatMessage {
  return {
    id: `oracle-${++_id}`,
    role,
    content,
    timestamp: 0, // filled at dispatch time
    ...extra,
  };
}

export const ORACLE_MESSAGES: Record<OracleStep, ChatMessage[]> = {
  WELCOME: [
    msg("system", "Initializing DELPHI OS..."),
    msg(
      "oracle",
      "Welcome. I am The Oracle.\n\nI'm going to learn how you write so I can help you craft tweets that sound like you — but sharper."
    ),
    msg(
      "oracle",
      "Let\'s get started.",
      {
        actions: [
          { label: "Let\'s go", value: "start-onboarding", variant: "primary" },
        ],
      }
    ),
  ],

  CONNECT_X: [
    msg(
      "oracle",
      "First things first — let\'s connect your X account. I\'ll sync your display name, bio, avatar, and handle, then scan your tweets to calibrate your voice.",
      {
        component: { type: "x-oauth" },
        actions: [
          { label: "Skip for now", value: "skip-x", variant: "ghost" },
        ],
      }
    ),
  ],

  TRACK_A_SCANNING: [
    msg(
      "oracle",
      "Scanning now... give me a moment.",
      {
        component: { type: "scan-progress" },
      }
    ),
  ],

  TRACK_A_RESULT: [
    msg(
      "oracle",
      "Here's what I think your voice looks like. Adjust anything that feels off — most people tweak 2-3 dimensions after seeing this.",
      {
        component: { type: "dimensions" },
      }
    ),
  ],

  TRACK_A_RATE: [
    msg(
      "oracle",
      "I generated a few tweets in your voice. Rate them — thumbs up means more like you, thumbs down means less.",
      {
        component: { type: "tweet-ratings" },
      }
    ),
  ],

  TRACK_B_STYLE: [
    msg(
      "oracle",
      "No worries, I got you. There's no wrong way to do this.\n\nWe're going to build your voice from scratch. I'll ask a few questions, you pick what feels right, and we'll dial it in together."
    ),
    msg(
      "oracle",
      "What type of style resonates with you?",
      {
        component: { type: "style-picker" },
      }
    ),
  ],

  TRACK_B_CONTENT: [
    msg(
      "oracle",
      "Got any tweets or articles that match the style you want? Drop them here — I'll use them as individual style signals.",
      {
        component: { type: "content-signals" },
        actions: [{ label: "Skip for now", value: "skip-content", variant: "ghost" }],
      }
    ),
  ],

  TRACK_B_DIMENSIONS: [
    msg(
      "oracle",
      "Now let's dial in each dimension. I've set defaults based on your style choice — adjust anything that feels off.",
      {
        component: { type: "dimensions" },
      }
    ),
  ],

  REFERENCES: [
    msg(
      "oracle",
      "Now pick some voices you admire. I'll blend elements of their style with yours. Most people pick 2-4.",
      {
        component: { type: "references" },
      }
    ),
  ],

  BLEND: [
    msg(
      "oracle",
      "How much should I lean on your style vs. theirs? You can always change this later.",
      {
        component: { type: "blend" },
      }
    ),
  ],

  TOPICS: [
    msg(
      "oracle",
      "Last thing — what topics should I watch for you? I'll send alerts when big accounts post about these.",
      {
        component: { type: "topics" },
      }
    ),
  ],

  HANDOFF: [
    msg(
      "oracle",
      "You're all set. I'll keep learning as you use Atlas.\n\nI'm the same brain on Telegram — drop me a report, a tweet link, or a voice note anytime.",
      {
        component: { type: "handoff-telegram" },
      }
    ),
  ],
};

/** Stamp messages with current time and unique IDs */
export function prepareMessages(step: OracleStep): ChatMessage[] {
  const now = Date.now();
  return ORACLE_MESSAGES[step].map((m, i) => ({
    ...m,
    id: `${step}-${i}-${now}`,
    timestamp: now + i,
  }));
}

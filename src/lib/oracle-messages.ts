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
      "First things first — let\'s connect your X account. I\'ll sync your display name, bio, avatar, and handle so I know who I\'m working with.",
      {
        component: { type: "x-oauth" },
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
      "Pick a voice you admire — someone whose writing style resonates with you. I'll use their style as a reference when crafting your tweets. You can add more later.",
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

/**
 * Per-track overrides for steps where the Oracle should speak differently
 * depending on which path the user is on. Track-agnostic steps fall
 * through to ORACLE_MESSAGES so this map only lists the intentional
 * divergences. Human-first framing: concrete language about what the
 * user did and what happens next.
 */
const TRACK_MESSAGE_OVERRIDES: Partial<
  Record<OracleStep, Record<"a" | "b", ChatMessage[]>>
> = {
  REFERENCES: {
    a: [
      msg(
        "oracle",
        "I have your voice from the tweets I scanned. Now pick who you're in conversation with — people whose writing sharpens yours. You can add more later.",
        {
          component: { type: "references" },
        }
      ),
    ],
    b: [
      msg(
        "oracle",
        "Pick a voice you want to grow toward. I'll use their style as a north star when I craft your tweets — you can swap it out anytime.",
        {
          component: { type: "references" },
        }
      ),
    ],
  },
  HANDOFF: {
    a: [
      msg(
        "oracle",
        "Your voice is dialed in from real tweets. Time to craft — I'll keep learning from every draft you ship.\n\nI'm the same brain on Telegram. Drop me a report, a link, or a voice note anytime.",
        {
          component: { type: "handoff-telegram" },
        }
      ),
    ],
    b: [
      msg(
        "oracle",
        "Your starter voice is set. We'll sharpen it every time you craft — the more you write, the tighter we get.\n\nI'm the same brain on Telegram. Drop me a report, a link, or a voice note anytime.",
        {
          component: { type: "handoff-telegram" },
        }
      ),
    ],
  },
};

/** Stamp messages with current time and unique IDs */
export function prepareMessages(
  step: OracleStep,
  track: "a" | "b" | null = null
): ChatMessage[] {
  const now = Date.now();
  const override = track ? TRACK_MESSAGE_OVERRIDES[step]?.[track] : undefined;
  const template = override ?? ORACLE_MESSAGES[step];
  return template.map((m, i) => ({
    ...m,
    id: `${step}-${track ?? "-"}-${i}-${now}`,
    timestamp: now + i,
  }));
}

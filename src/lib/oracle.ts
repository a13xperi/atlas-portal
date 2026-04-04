import type { VoiceDimensions } from "@/lib/voice-profile-dimensions";

// ── Types ────────────────────────────────────────────────────────

export type OracleTrack = "a" | "b";

export type InlineComponentType =
  | "handle-input"
  | "scan-progress"
  | "dimensions"
  | "rate-tweets"
  | "style-picker"
  | "tweet-paste"
  | "references"
  | "blend"
  | "topics"
  | "handoff-actions";

export interface ChatAction {
  label: string;
  value: string;
  variant: "primary" | "secondary" | "ghost";
}

export interface ChatMessage {
  id: string;
  role: "oracle" | "user" | "system";
  content: string;
  component?: InlineComponentType;
  actions?: ChatAction[];
  timestamp: number;
}

export interface OracleState {
  track: OracleTrack | null;
  step: string;
  messages: ChatMessage[];
  // Accumulated onboarding data
  xHandle?: string;
  calibrationResult?: { analysis: string; tweetsAnalyzed: number };
  dimensions?: VoiceDimensions;
  selectedStyle?: string;
  selectedRefIds: string[];
  selfPercentage: number;
  selectedTopics: string[];
  displayName: string;
  isTyping: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────

let msgCounter = 0;

function msg(
  role: ChatMessage["role"],
  content: string,
  opts?: { component?: InlineComponentType; actions?: ChatAction[] },
): ChatMessage {
  return {
    id: `msg-${++msgCounter}`,
    role,
    content,
    component: opts?.component,
    actions: opts?.actions,
    timestamp: Date.now(),
  };
}

// ── Initial State ────────────────────────────────────────────────

export function createInitialState(): OracleState {
  return {
    track: null,
    step: "fork",
    messages: [
      msg(
        "oracle",
        "Hey, I'm Atlas. I'm going to learn how you write so I can help you craft tweets that sound like you — but sharper. How do you want to get started?",
        {
          actions: [
            { label: "Connect my X", value: "fork:a", variant: "primary" },
            { label: "Set up manually", value: "fork:b", variant: "secondary" },
          ],
        },
      ),
    ],
    selectedRefIds: [],
    selfPercentage: 50,
    selectedTopics: [],
    displayName: "",
    isTyping: false,
  };
}

// ── Step Definitions ─────────────────────────────────────────────

// Track A steps: handle → scan → review → rate → refs → blend → topics → handoff
// Track B steps: welcome → style → paste → dims → refs → blend → topics → handoff

interface StepTransition {
  userMessage?: string;
  oracleMessages: Array<{
    content: string;
    component?: InlineComponentType;
    actions?: ChatAction[];
  }>;
  nextStep: string;
}

export function getStepTransition(
  action: string,
  state: OracleState,
): StepTransition | null {
  // ── Fork ─────────────────────────────────────────────────────
  if (action === "fork:a") {
    return {
      userMessage: "Connect my X",
      oracleMessages: [
        {
          content:
            "Nice — I'll scan your tweets to figure out how you write. What's your X handle?",
          component: "handle-input",
        },
      ],
      nextStep: "a:handle",
    };
  }

  if (action === "fork:b") {
    return {
      userMessage: "Set up manually",
      oracleMessages: [
        {
          content:
            "No worries, I got you. There's no wrong way to do this. We're going to build your voice from scratch — I'll ask a few questions, you pick what feels right, and we'll dial it in together.",
        },
        {
          content: "What type of style resonates with you?",
          component: "style-picker",
        },
      ],
      nextStep: "b:style",
    };
  }

  // ── Track A ──────────────────────────────────────────────────

  if (action.startsWith("handle:")) {
    const handle = action.replace("handle:", "");
    return {
      userMessage: `@${handle}`,
      oracleMessages: [
        {
          content: `Scanning @${handle} now...`,
          component: "scan-progress",
        },
      ],
      nextStep: "a:scanning",
    };
  }

  if (action === "scan-complete") {
    const tweetsAnalyzed = state.calibrationResult?.tweetsAnalyzed ?? 0;
    const analysis = state.calibrationResult?.analysis ?? "";
    return {
      oracleMessages: [
        {
          content: `Here's what I found from ${tweetsAnalyzed} tweets. ${analysis ? analysis : "You've got a distinctive voice — let me show you the breakdown."}`,
          component: "dimensions",
        },
        {
          content:
            "Adjust anything that feels off — most people tweak 2-3 dimensions. When you're happy, rate a few sample tweets below so I can fine-tune.",
          component: "rate-tweets",
        },
      ],
      nextStep: "a:review",
    };
  }

  if (action === "review-continue") {
    return {
      userMessage: "Looks good, let's continue",
      oracleMessages: [
        {
          content:
            "Now pick some voices you admire. I'll blend elements of their style with yours. Most people pick 2-4.",
          component: "references",
        },
      ],
      nextStep: "a:refs",
    };
  }

  // ── Track B ──────────────────────────────────────────────────

  if (action.startsWith("style:")) {
    const style = action.replace("style:", "");
    return {
      userMessage: style,
      oracleMessages: [
        {
          content:
            style === "Custom mix"
              ? "Custom mix — good instinct. That gives you the most control."
              : style === "Fun"
                ? "Fun — I like it. Playful and witty usually gets the best engagement."
                : "Serious — straight-shooting and data-driven. Respect.",
        },
        {
          content:
            "Got any tweets or articles that match the style you want? Drop them here — I'll use them as style signals. You can skip this.",
          component: "tweet-paste",
          actions: [
            { label: "Skip for now", value: "paste-skip", variant: "ghost" },
          ],
        },
      ],
      nextStep: "b:paste",
    };
  }

  if (action === "paste-continue" || action === "paste-skip") {
    return {
      userMessage:
        action === "paste-skip" ? "Skip for now" : "Added style signals",
      oracleMessages: [
        {
          content:
            "Now let's dial in each dimension of your voice. I've set defaults based on your style choice — adjust anything that feels off.",
          component: "dimensions",
        },
      ],
      nextStep: "b:dims",
    };
  }

  if (action === "dims-continue") {
    return {
      userMessage: "Voice dimensions set",
      oracleMessages: [
        {
          content:
            "Pick some voices you admire — I'll blend elements of their style with yours. Most people pick 2-4.",
          component: "references",
        },
      ],
      nextStep: "b:refs",
    };
  }

  // ���─ Shared steps (both tracks) ───────────────────────────────

  if (action === "refs-continue") {
    const count = state.selectedRefIds.length;
    const defaultSelf = state.track === "b" ? 30 : 50;
    return {
      userMessage: `Selected ${count} reference voice${count !== 1 ? "s" : ""}`,
      oracleMessages: [
        {
          content:
            state.track === "b"
              ? `Since you're building from scratch, I'd suggest leaning more on the references to start — maybe ${defaultSelf}% you / ${100 - defaultSelf}% them. You can always shift it later.`
              : `How much should I lean on your style vs. theirs? Based on your tweets, you've got a strong enough voice to go ${defaultSelf}/${100 - defaultSelf}.`,
          component: "blend",
        },
      ],
      nextStep: `${state.track}:blend`,
    };
  }

  if (action === "blend-continue") {
    return {
      userMessage: `Blend set to ${state.selfPercentage}% me / ${100 - state.selfPercentage}% references`,
      oracleMessages: [
        {
          content:
            "Last thing — what topics should I watch for you? I'll send alerts when big accounts post about these.",
          component: "topics",
        },
      ],
      nextStep: `${state.track}:topics`,
    };
  }

  if (action === "topics-continue") {
    const topicList = state.selectedTopics.join(", ");
    return {
      userMessage: `Watching: ${topicList}`,
      oracleMessages: [
        {
          content:
            "You're all set. I'll keep learning as you use Atlas. I'm the same brain on Telegram — drop me a report, a tweet link, or a voice note anytime.",
          component: "handoff-actions",
          actions: [
            {
              label: "Connect Telegram",
              value: "handoff:telegram",
              variant: "secondary",
            },
            {
              label: "Go to Dashboard",
              value: "handoff:dashboard",
              variant: "primary",
            },
          ],
        },
      ],
      nextStep: `${state.track}:handoff`,
    };
  }

  return null;
}

// ── Reducer ──────────────────────────────────────────────────────

export type OracleAction =
  | { type: "SET_TYPING"; isTyping: boolean }
  | { type: "TRANSITION"; action: string }
  | { type: "SET_TRACK"; track: OracleTrack }
  | { type: "SET_HANDLE"; handle: string }
  | { type: "SET_CALIBRATION"; result: { analysis: string; tweetsAnalyzed: number } }
  | { type: "SET_DIMENSIONS"; dimensions: VoiceDimensions }
  | { type: "SET_STYLE"; style: string }
  | { type: "SET_REFS"; ids: string[] }
  | { type: "SET_BLEND"; selfPercentage: number }
  | { type: "SET_TOPICS"; topics: string[] }
  | { type: "SET_DISPLAY_NAME"; name: string }
  | { type: "ADD_MESSAGE"; message: ChatMessage };

export function oracleReducer(
  state: OracleState,
  action: OracleAction,
): OracleState {
  switch (action.type) {
    case "SET_TYPING":
      return { ...state, isTyping: action.isTyping };

    case "TRANSITION": {
      const transition = getStepTransition(action.action, state);
      if (!transition) return state;

      const newMessages = [...state.messages];

      if (transition.userMessage) {
        newMessages.push(msg("user", transition.userMessage));
      }

      for (const om of transition.oracleMessages) {
        newMessages.push(
          msg("oracle", om.content, {
            component: om.component,
            actions: om.actions,
          }),
        );
      }

      // Derive track from action if at fork
      let track = state.track;
      if (action.action === "fork:a") track = "a";
      if (action.action === "fork:b") track = "b";

      return {
        ...state,
        track,
        step: transition.nextStep,
        messages: newMessages,
        isTyping: false,
      };
    }

    case "SET_TRACK":
      return { ...state, track: action.track };
    case "SET_HANDLE":
      return { ...state, xHandle: action.handle };
    case "SET_CALIBRATION":
      return { ...state, calibrationResult: action.result };
    case "SET_DIMENSIONS":
      return { ...state, dimensions: action.dimensions };
    case "SET_STYLE":
      return { ...state, selectedStyle: action.style };
    case "SET_REFS":
      return { ...state, selectedRefIds: action.ids };
    case "SET_BLEND":
      return { ...state, selfPercentage: action.selfPercentage };
    case "SET_TOPICS":
      return { ...state, selectedTopics: action.topics };
    case "SET_DISPLAY_NAME":
      return { ...state, displayName: action.name };
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.message] };

    default:
      return state;
  }
}

import { pickVoiceDimensions } from "@/lib/voice-profile-dimensions";
import type {
  BlendPreviewRequest,
  BlendPreviewResult,
} from "@/types/voice-profile-preview";

const TOPIC_LIBRARY = {
  eth: {
    theses: [
      "ETH pressing toward $4k matters because quality beta usually reclaims leadership before the rest of the complex wakes up.",
      "ETH near $4k is a positioning reset, not just a pretty chart.",
      "ETH back at $4k only sticks if the market is rotating into conviction instead of pure reflex.",
    ],
    technical: [
      "Watch ETF flows, staking demand, and fee burn before calling it a clean breakout.",
      "The useful confirmation is spot-led demand plus healthier fee capture across the stack.",
      "If basis stays sane while validator demand improves, the move has real room.",
    ],
    accessible: [
      "Price is the headline; follow-through is whether users and capital both keep showing up.",
      "The candle is nice, but participation is what changes positioning.",
      "The real tell is whether the move brings actual activity back onchain.",
    ],
  },
  rollups: {
    theses: [
      "Rollup TPS charts are helpful marketing, but raw throughput is the lazy metric.",
      "TPS comparisons between rollups miss the point if you ignore what that throughput costs.",
      "Not all rollup TPS is created equal; the benchmark only matters if users can actually sustain it.",
    ],
    technical: [
      "I care more about DA efficiency, time-to-finality, and state growth than headline burst capacity.",
      "Compression quality, finality, and fee consistency tell you more than the screenshot number.",
      "The real spread is in proving costs, DA overhead, and how ugly performance gets under load.",
    ],
    accessible: [
      "The winner is the chain people can keep using, not the one with the loudest dashboard.",
      "Throughput without cheap repeat usage is just a benchmark flex.",
      "Users feel cost and latency long before they care about the leaderboard graphic.",
    ],
  },
  adoption: {
    theses: [
      "L2s matter for adoption because they turn onchain actions from special occasions into default behavior.",
      "Adoption does not scale on ideology; it scales when execution gets cheap enough to feel normal.",
      "L2s are the bridge between crypto's ambition and something regular users will actually touch.",
    ],
    technical: [
      "Cheap blockspace, fast confirmations, and sane onboarding loops are what convert curiosity into retained usage.",
      "The unlock is low-cost execution paired with app distribution that does not punish experimentation.",
      "When confirmation times and fee variance compress, product teams can finally optimize for retention instead of apology copy.",
    ],
    accessible: [
      "If sending, swapping, and minting feel instant and cheap, more people try it twice.",
      "Lower fees are not cosmetic; they are what make habit formation possible.",
      "Cheaper transactions are how onchain behavior stops feeling like a premium hobby.",
    ],
  },
} as const;

const HUMOR_LEADS = ["Chart goblin take:", "Timeline take:", "Low-key take:"];
const FORMAL_LEADS = ["Base case:", "Working view:", "Read-through:"];
const NEUTRAL_LEADS = ["My take:", "Net/net:", "View:"];
const HUMOR_TAILS = [
  "The timeline will call it obvious after the candle closes.",
  "Everyone becomes a macro genius once the chart agrees.",
  "Somebody will still post a victory lap from the wrong thesis.",
];
const FORMAL_TAILS = [
  "That is the signal stack worth underwriting.",
  "That is the adoption vector worth monitoring.",
  "That is the cleaner framework for sizing the move.",
];
const WARM_TAILS = [
  "That is the part normal users actually feel.",
  "That is how the UX gap finally narrows.",
  "That is what makes the product click for newcomers.",
];
const NEUTRAL_TAILS = [
  "That is the real unlock.",
  "That is the part I care about.",
  "That is the section the market reprices.",
];

function hashString(input: string) {
  let hash = 2166136261;
  for (const char of input) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pick(options: readonly string[], seed: number) {
  return options[seed % options.length];
}

function detectTopic(prompt: string) {
  const normalized = prompt.toLowerCase();
  if (normalized.includes("eth")) return TOPIC_LIBRARY.eth;
  if (normalized.includes("rollup") || normalized.includes("tps")) return TOPIC_LIBRARY.rollups;
  if (normalized.includes("l2")) return TOPIC_LIBRARY.adoption;
  return TOPIC_LIBRARY.adoption;
}

function buildLead(dimensions: ReturnType<typeof pickVoiceDimensions>, seed: number) {
  if (dimensions.formality >= 70) return pick(FORMAL_LEADS, seed);
  if (dimensions.humor >= 70) return pick(HUMOR_LEADS, seed);
  return pick(NEUTRAL_LEADS, seed);
}

function buildTail(dimensions: ReturnType<typeof pickVoiceDimensions>, seed: number) {
  if (dimensions.humor >= 70) return pick(HUMOR_TAILS, seed);
  if (dimensions.formality >= 70) return pick(FORMAL_TAILS, seed);
  if (dimensions.warmth >= 60) return pick(WARM_TAILS, seed);
  return pick(NEUTRAL_TAILS, seed);
}

function trimTweet(text: string) {
  return text.length <= 280 ? text : `${text.slice(0, 277)}...`;
}

export function generateMockBlendPreview(
  blend: BlendPreviewRequest["blend"],
  prompts: string[]
): BlendPreviewResult {
  const dimensions = pickVoiceDimensions(blend.dimensions);
  const voiceSignature = blend.voices
    .map((voice) => `${voice.handle.replace(/^@/, "").toLowerCase()}:${voice.percentage}`)
    .join("|");
  const baseSeed = hashString(`${voiceSignature}|${JSON.stringify(dimensions)}`);

  return {
    mode: "mock",
    tweets: prompts.map((prompt, index) => {
      const topic = detectTopic(prompt);
      const seed = baseSeed + index * 97;
      const detailPool =
        dimensions.technicalDepth >= 60 || dimensions.evidenceOrientation >= 60
          ? topic.technical
          : topic.accessible;
      return {
        prompt,
        text: trimTweet(
          [
            buildLead(dimensions, seed),
            pick(topic.theses, seed + 11),
            pick(detailPool, seed + 23),
            buildTail(dimensions, seed + 31),
          ].join(" ")
        ),
      };
    }),
  };
}

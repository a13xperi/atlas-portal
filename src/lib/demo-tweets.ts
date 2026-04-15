import type { TwitterLike } from "./api";

const SELF_TOP_TWEET_TEXTS = [
  "The market usually pays the cleanest premium to people who can update their view before they update their branding.",
  "Stablecoin distribution is the real consumer funnel. Everything else in crypto is still arguing over the landing page.",
  "If your thesis only works in a straight line, it is not a thesis. It is a mood board with price targets.",
  "The cleanest edges right now are boring: better unit economics, tighter distribution, and fewer stories that require divine intervention.",
  "People call it chop when they really mean the market stopped rewarding lazy narratives.",
  "You do not need a hotter take. You need a clearer one with fewer hidden assumptions.",
  "A lot of product-market fit in crypto is really just founder-market stamina with a better dashboard.",
  "Narrative strength matters, but distribution plus retention still does more work than the timeline wants to admit.",
];

const REFERENCE_TWEET_TEMPLATES = [
  "Consensus trades are usually crowded way before the chart makes it obvious. The edge is noticing the posture shift, not the headline.",
  "The cleanest call is often the least cinematic one: follow the incentives, then wait for everyone else to rediscover arithmetic.",
  "If a team cannot explain the distribution loop in one sentence, it probably does not have one.",
  "The best operators in crypto sound calm because they already did the second-order work before the market asked the first-order question.",
  "A lot of 'macro' commentary is just sentiment with a Bloomberg terminal. The useful part is still the positioning.",
  "When the narrative gets too clean, I assume the underwriting got sloppy somewhere upstream.",
];

function makeTweet(
  id: string,
  text: string,
  authorHandle: string,
  createdAt: string,
  likeCount: number,
  retweetCount: number
): TwitterLike {
  return {
    id,
    text,
    author_handle: authorHandle,
    author_avatar: null,
    created_at: createdAt,
    like_count: likeCount,
    retweet_count: retweetCount,
  };
}

function buildTweets(
  authorHandle: string,
  texts: string[],
  seedLabel: string
): TwitterLike[] {
  return texts.map((text, index) =>
    makeTweet(
      `${seedLabel}-${authorHandle}-${index + 1}`,
      text,
      authorHandle,
      new Date(Date.UTC(2026, 2, 20 - index)).toISOString(),
      420 + index * 57,
      110 + index * 21
    )
  );
}

function normalizeHandle(handle: string) {
  return handle.replace(/^@/, "").trim().toLowerCase();
}

function buildReferenceTexts(handle: string) {
  const readableHandle = normalizeHandle(handle) || "reference";

  return REFERENCE_TWEET_TEMPLATES.map((template, index) => {
    if (index % 2 === 0) {
      return `${template} @${readableHandle} would probably frame it as a positioning problem, not a vibes problem.`;
    }

    return `${template} That is the kind of line you expect from @${readableHandle} when the crowd starts overfitting the obvious trade.`;
  });
}

export function getDemoTopTweets(limit = 10): TwitterLike[] {
  return buildTweets("atlasanalyst", SELF_TOP_TWEET_TEXTS, "demo-self").slice(0, limit);
}

export function getDemoTopTweetsByHandle(
  handle: string,
  limit = 10
): TwitterLike[] {
  const normalizedHandle = normalizeHandle(handle) || "reference";
  return buildTweets(
    normalizedHandle,
    buildReferenceTexts(normalizedHandle),
    "demo-ref"
  ).slice(0, limit);
}

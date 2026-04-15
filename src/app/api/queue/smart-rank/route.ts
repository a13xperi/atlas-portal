import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function hasSession(request: NextRequest): boolean {
  return request.cookies.has("atlas_session") || Boolean(request.headers.get("authorization"));
}

interface TweetDraft {
  id: string;
  content: string;
  status: string;
  predictedEngagement?: number;
  actualEngagement?: number;
  scheduledAt?: string | null;
  createdAt: string;
}

interface RankedDraft extends TweetDraft {
  optimalTime: string;
  predictedEngagement: number;
  topicScore: number;
  timeScore: number;
  historyScore: number;
}

const CRYPTO_KEYWORDS = new Set([
  "btc", "bitcoin", "eth", "ethereum", "sol", "solana", "crypto", "defi",
  "nft", "altcoin", "blockchain", "token", "airdrop", "staking", "yield",
  "market", "pump", "dump", "bull", "bear", "rally", "correction", "crash",
  "support", "resistance", "breakout", "chart", "ta", "analysis", "onchain",
  "whale", "liquidation", "futures", "perp", "etf", "fed", "inflation",
  "macro", "rates", "dxy", "usd", "fiat", "mining", "halving", "upgrade",
  "layer2", "l2", "rollup", "bridge", "dex", "cex", "binance", "coinbase",
]);

const HIGH_ENGAGEMENT_PATTERNS = [
  /\?/, // questions
  /poll/i,
  /thread/i,
  /🧵/,
  /1\/\d+/,
  /like and retweet/i,
  /drop your/i,
  /what do you think/i,
  /agree\?/i,
];

function extractTopicScore(draft: TweetDraft): number {
  const content = draft.content.toLowerCase();
  const words = content.split(/\s+/);

  let score = 0;

  // Keyword matches
  const keywordMatches = words.filter((w) =>
    CRYPTO_KEYWORDS.has(w.replace(/[^a-z0-9]/g, ""))
  ).length;
  score += Math.min(40, keywordMatches * 8);

  // Engagement patterns
  const patternMatches = HIGH_ENGAGEMENT_PATTERNS.filter((p) => p.test(content)).length;
  score += Math.min(20, patternMatches * 10);

  // Hashtags
  const hashtags = (content.match(/#/g) || []).length;
  score += Math.min(15, hashtags * 5);

  // Mentions
  const mentions = (content.match(/@\w+/g) || []).length;
  score += Math.min(10, mentions * 5);

  // Length optimization (100-220 chars ideal for Twitter/X)
  const len = draft.content.length;
  if (len >= 80 && len <= 240) {
    score += 15;
  } else if (len >= 40 && len < 80) {
    score += 8;
  } else if (len > 240 && len <= 280) {
    score += 5;
  }

  return Math.min(100, Math.round(score));
}

function extractTimeScore(draft: TweetDraft, now: Date): number {
  const created = new Date(draft.createdAt);
  const ageHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);

  let score = 50; // baseline

  // Fresher drafts score slightly higher (recency bias on social)
  if (ageHours < 2) score += 10;
  else if (ageHours < 24) score += 5;
  else if (ageHours > 72) score -= 10;

  // Content timing relevance
  const content = draft.content.toLowerCase();
  const hour = now.getHours();

  // Market-open/morning content does better in AM
  if (/morning|open|premarket|am/.test(content) && hour < 12) score += 10;
  // Evening analysis does better in PM
  if (/evening|wrap|close|daily|recap/.test(content) && hour >= 16) score += 10;
  // Breaking news does well anytime but slightly better during active hours
  if (/breaking|just|live|now/.test(content)) score += 8;

  return Math.min(100, Math.max(0, score));
}

function extractHistoryScore(draft: TweetDraft): number {
  let score = 50; // baseline

  if (draft.actualEngagement && draft.actualEngagement > 0) {
    // Normalize actual engagement into a 0-50 bonus
    const engagementBonus = Math.min(50, draft.actualEngagement / 20);
    score += engagementBonus;
  }

  if (typeof draft.predictedEngagement === "number" && draft.predictedEngagement > 0) {
    // Existing predicted engagement contributes up to 20 points
    const normalized =
      draft.predictedEngagement > 1
        ? Math.min(1, draft.predictedEngagement / 100)
        : draft.predictedEngagement;
    score += normalized * 20;
  }

  return Math.min(100, Math.round(score));
}

function computeOptimalWindows(from: Date): Date[] {
  const windows: Date[] = [];
  const start = new Date(from);
  start.setMinutes(0, 0, 0);

  // Typical high-engagement windows for crypto Twitter (UTC)
  const dailySlots = [8, 10, 12, 14, 17, 19, 21];

  for (let day = 0; day < 7; day++) {
    const d = new Date(start);
    d.setDate(d.getDate() + day);
    for (const hour of dailySlots) {
      const slot = new Date(d);
      slot.setHours(hour);
      if (slot.getTime() > from.getTime()) {
        windows.push(slot);
      }
    }
  }

  return windows;
}

function formatBadgeTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export async function POST(request: NextRequest) {
  try {
    if (!hasSession(request)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { drafts?: TweetDraft[]; text?: string };

    if (body.text && body.text.length > 500) {
      return NextResponse.json({ error: "text too long" }, { status: 400 });
    }

    const drafts = body.drafts ?? [];

    if (drafts.length === 0) {
      return NextResponse.json({ drafts: [] });
    }

    const now = new Date();
    const windows = computeOptimalWindows(now);

    const scored = drafts.map((draft) => {
      const topicScore = extractTopicScore(draft);
      const timeScore = extractTimeScore(draft, now);
      const historyScore = extractHistoryScore(draft);

      // Weighted composite predicted engagement
      const predictedEngagement = Math.round(
        topicScore * 0.4 + timeScore * 0.25 + historyScore * 0.35
      );

      return {
        ...draft,
        topicScore,
        timeScore,
        historyScore,
        predictedEngagement: Math.min(100, predictedEngagement),
        optimalTime: "",
      } as RankedDraft;
    });

    // Sort descending by predicted engagement
    scored.sort((a, b) => b.predictedEngagement - a.predictedEngagement);

    // Assign optimal time slots, spacing at least 90 minutes apart
    const usedSlots: Date[] = [];
    for (const draft of scored) {
      const slot = windows.find((w) => {
        return usedSlots.every((u) => {
          const diff = Math.abs(w.getTime() - u.getTime());
          return diff >= 90 * 60 * 1000;
        });
      });
      const chosen = slot ?? windows[usedSlots.length % windows.length] ?? now;
      draft.optimalTime = chosen.toISOString();
      usedSlots.push(chosen);
    }

    const result = scored.map((d) => ({
      ...d,
      optimalTimeBadge: formatBadgeTime(d.optimalTime),
    }));

    return NextResponse.json({ drafts: result });
  } catch (error) {
    console.error("Smart rank error:", error);
    return NextResponse.json(
      { error: "Failed to compute smart ranking" },
      { status: 500 }
    );
  }
}

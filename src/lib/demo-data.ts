/**
 * Demo Mode — hardcoded mock data for all GET endpoints.
 * Returns the UNWRAPPED inner data (after envelope stripping).
 */

import type {
  AnalyticsSummary,
  TweetDraft,
  VoiceProfile,
  ReferenceVoice,
  SavedBlend,
  TeamAnalyst,
  DailyEngagement,
  LearningLogEntry,
  Alert,
  AlertSubscription,
  DailyActivity,
} from "./api";

const now = new Date().toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

// ── Analytics Summary ────────────────────────────────────────────────────────

const analyticsSummary: { summary: AnalyticsSummary } = {
  summary: {
    draftsCreated: 47,
    draftsPosted: 12,
    feedbackGiven: 23,
    refinements: 18,
    reportsIngested: 9,
    period: "last_30_days",
  },
};

// ── Drafts ───────────────────────────────────────────────────────────────────

const drafts: { drafts: TweetDraft[] } = {
  drafts: [
    {
      id: "demo-draft-1",
      content:
        "ETH staking yields are compressing but that's actually bullish. It means the network is maturing and validators are playing a longer game. The yield farmers leave, the believers stay.",
      version: 1,
      status: "POSTED",
      confidence: 0.87,
      predictedEngagement: 8.4,
      actualEngagement: 11.2,
      sourceType: "MANUAL",
      createdAt: daysAgo(1),
    },
    {
      id: "demo-draft-2",
      content:
        "L2 fees just hit an all-time low. The rollup wars are doing exactly what competition is supposed to do — drive costs down while throughput goes up. Users win.",
      version: 2,
      status: "DRAFT",
      confidence: 0.72,
      predictedEngagement: 6.1,
      sourceType: "MANUAL",
      createdAt: daysAgo(2),
    },
    {
      id: "demo-draft-3",
      content:
        "Hot take: DeFi governance is broken not because of voter apathy, but because proposals are written by insiders for insiders. Fix the interface, fix the participation.",
      version: 1,
      status: "DRAFT",
      confidence: 0.91,
      predictedEngagement: 14.3,
      sourceType: "MANUAL",
      createdAt: daysAgo(3),
    },
    {
      id: "demo-draft-4",
      content:
        "Restaking narrative is getting overleveraged. When the same ETH secures 15 different AVSs, you're not distributing risk — you're concentrating it with extra steps.",
      version: 1,
      status: "APPROVED",
      confidence: 0.65,
      predictedEngagement: 9.7,
      sourceType: "MANUAL",
      createdAt: daysAgo(4),
    },
    {
      id: "demo-draft-5",
      content:
        "The best crypto content isn't alpha calls — it's frameworks. Teach people how to think, not what to buy. That's how you build an audience that actually sticks around.",
      version: 3,
      status: "POSTED",
      confidence: 0.94,
      predictedEngagement: 12.0,
      actualEngagement: 15.8,
      sourceType: "MANUAL",
      createdAt: daysAgo(5),
    },
  ],
};

// ── Voice Profile ────────────────────────────────────────────────────────────

const voiceProfile: { profile: VoiceProfile } = {
  profile: {
    id: "demo-voice-1",
    userId: "demo-user",
    humor: 72,
    formality: 35,
    brevity: 68,
    contrarianTone: 55,
    directness: 80,
    warmth: 45,
    technicalDepth: 62,
    confidence: 78,
    evidenceOrientation: 70,
    solutionOrientation: 58,
    socialPosture: 40,
    selfPromotionalIntensity: 25,
    maturity: "ADVANCED",
    tweetsAnalyzed: 342,
  },
};

// ── Voice References ─────────────────────────────────────────────────────────

const voiceReferences: { voices: ReferenceVoice[] } = {
  voices: [
    {
      id: "demo-ref-1",
      name: "Cobie",
      handle: "coaboratecobie",
      isActive: true,
    },
    {
      id: "demo-ref-2",
      name: "Hasu",
      handle: "hasufl",
      isActive: true,
    },
    {
      id: "demo-ref-3",
      name: "GCR",
      handle: "GCRClassic",
      isActive: true,
    },
  ],
};

// ── Voice Blends ─────────────────────────────────────────────────────────────

const voiceBlends: { blends: SavedBlend[] } = {
  blends: [
    {
      id: "demo-blend-1",
      name: "CT Shitposter",
      voices: [
        { label: "Personal", percentage: 60 },
        { label: "Cobie", percentage: 25 },
        { label: "GCR", percentage: 15 },
      ],
    },
    {
      id: "demo-blend-2",
      name: "Research Thread",
      voices: [
        { label: "Personal", percentage: 40 },
        { label: "Hasu", percentage: 40 },
        { label: "Cobie", percentage: 20 },
      ],
    },
  ],
};

// ── Team Analysts ────────────────────────────────────────────────────────────

function makeVoiceProfile(overrides: Partial<VoiceProfile> = {}): VoiceProfile {
  return {
    id: `vp-${Math.random().toString(36).slice(2, 8)}`,
    userId: "",
    humor: 50,
    formality: 50,
    brevity: 50,
    contrarianTone: 50,
    maturity: "INTERMEDIATE",
    tweetsAnalyzed: 0,
    ...overrides,
  };
}

const teamAnalysts: { analysts: TeamAnalyst[] } = {
  analysts: [
    {
      id: "ta-1",
      handle: "DegenSpartan",
      voiceProfile: makeVoiceProfile({ humor: 90, brevity: 95, contrarianTone: 85, maturity: "ADVANCED", tweetsAnalyzed: 520 }),
      _count: { tweetDrafts: 187, analyticsEvents: 340, sessions: 45 },
    },
    {
      id: "ta-2",
      handle: "CryptoHayes",
      voiceProfile: makeVoiceProfile({ humor: 65, formality: 70, contrarianTone: 60, maturity: "ADVANCED", tweetsAnalyzed: 410 }),
      _count: { tweetDrafts: 156, analyticsEvents: 290, sessions: 38 },
    },
    {
      id: "ta-3",
      handle: "inversebrah",
      voiceProfile: makeVoiceProfile({ humor: 80, brevity: 85, maturity: "ADVANCED", tweetsAnalyzed: 380 }),
      _count: { tweetDrafts: 134, analyticsEvents: 250, sessions: 32 },
    },
    {
      id: "ta-4",
      handle: "punk6529",
      voiceProfile: makeVoiceProfile({ formality: 75, contrarianTone: 70, maturity: "ADVANCED", tweetsAnalyzed: 290 }),
      _count: { tweetDrafts: 98, analyticsEvents: 180, sessions: 25 },
    },
    {
      id: "ta-5",
      handle: "Pentosh1",
      voiceProfile: makeVoiceProfile({ brevity: 80, contrarianTone: 55, maturity: "INTERMEDIATE", tweetsAnalyzed: 210 }),
      _count: { tweetDrafts: 72, analyticsEvents: 140, sessions: 20 },
    },
    {
      id: "ta-6",
      handle: "CryptoCobain",
      voiceProfile: makeVoiceProfile({ humor: 75, brevity: 70, maturity: "INTERMEDIATE", tweetsAnalyzed: 160 }),
      _count: { tweetDrafts: 45, analyticsEvents: 90, sessions: 14 },
    },
    {
      id: "ta-7",
      handle: "ZssBecker",
      voiceProfile: makeVoiceProfile({ formality: 60, maturity: "INTERMEDIATE", tweetsAnalyzed: 110 }),
      _count: { tweetDrafts: 28, analyticsEvents: 55, sessions: 9 },
    },
    {
      id: "ta-8",
      handle: "IcedKnife",
      voiceProfile: makeVoiceProfile({ humor: 40, formality: 80, maturity: "BEGINNER", tweetsAnalyzed: 50 }),
      _count: { tweetDrafts: 12, analyticsEvents: 25, sessions: 4 },
    },
    {
      id: "ta-9",
      handle: "SmolDegen",
      voiceProfile: makeVoiceProfile({ maturity: "BEGINNER", tweetsAnalyzed: 20 }),
      _count: { tweetDrafts: 5, analyticsEvents: 10, sessions: 2 },
    },
    {
      id: "ta-10",
      handle: "GhostAnon",
      voiceProfile: makeVoiceProfile({ maturity: "BEGINNER", tweetsAnalyzed: 0 }),
      _count: { tweetDrafts: 0, analyticsEvents: 0, sessions: 0 },
    },
  ],
};

// ── Daily Engagement ─────────────────────────────────────────────────────────

const engagementDaily: { days: DailyEngagement[] } = {
  days: Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86400000);
    const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
    const predicted = 4 + Math.sin(i * 0.3) * 3 + Math.random() * 2;
    const actual = predicted + (Math.random() - 0.4) * 3;
    return {
      date: d.toISOString().slice(0, 10),
      dayLabel,
      predicted: Math.round(predicted * 10) / 10,
      actual: Math.max(0, Math.round(actual * 10) / 10),
    };
  }),
};

// ── Activity Daily ───────────────────────────────────────────────────────────

const activityDaily: { days: DailyActivity[] } = {
  days: Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86400000);
    return {
      date: d.toISOString().slice(0, 10),
      count: Math.floor(Math.random() * 8) + 1,
    };
  }),
};

// ── Learning Log ─────────────────────────────────────────────────────────────

const learningLog: { entries: LearningLogEntry[] } = {
  entries: [
    {
      id: "ll-1",
      event: "User preferred shorter, punchier drafts",
      impact: "+12% engagement on concise posts",
      positive: true,
      createdAt: daysAgo(1),
    },
    {
      id: "ll-2",
      event: "Contrarian angle resonated with audience",
      impact: "+8% likes on counter-narrative takes",
      positive: true,
      createdAt: daysAgo(3),
    },
    {
      id: "ll-3",
      event: "Technical jargon reduced reach",
      impact: "-5% impressions on deep-tech threads",
      positive: false,
      createdAt: daysAgo(5),
    },
    {
      id: "ll-4",
      event: "Humor injection increased retweets",
      impact: "+15% RT ratio on witty posts",
      positive: true,
      createdAt: daysAgo(7),
    },
    {
      id: "ll-5",
      event: "Adjusted formality based on feedback",
      impact: "Neutral — still calibrating",
      positive: true,
      createdAt: daysAgo(10),
    },
  ],
};

// ── Alerts ───────────────────────────────────────────────────────────────────

const alertsFeed: { alerts: Alert[] } = {
  alerts: [
    {
      id: "alert-1",
      type: "TRENDING_TOPIC",
      title: "Ethereum blob fees spike 400% as L2 activity surges",
      context:
        "EIP-4844 blob usage hitting capacity during peak hours. Base and Arbitrum leading the charge.",
      category: "SIGNAL",
      sentiment: "bullish",
      relevance: 0.92,
      createdAt: daysAgo(0),
    },
    {
      id: "alert-2",
      type: "COMPETITOR_POST",
      title: "@punk6529 thread on NFT financialization getting massive engagement",
      context:
        "12-tweet thread arguing NFTs are underpriced infrastructure. 2.4k likes in 3 hours.",
      category: "SIGNAL",
      sentiment: "neutral",
      relevance: 0.85,
      createdAt: daysAgo(0),
    },
    {
      id: "alert-3",
      type: "ENGAGEMENT_SPIKE",
      title: "Your DeFi governance thread is going viral",
      context:
        "Your draft about governance UX was posted 6 hours ago and has 3x your average engagement.",
      category: "NOTIFICATION",
      sentiment: "bullish",
      relevance: 0.98,
      createdAt: daysAgo(0),
    },
    {
      id: "alert-4",
      type: "MARKET_MOVE",
      title: "SOL breaks $200 — ecosystem narrative shifting",
      context:
        "Solana hits new ATH. Content opportunity around ecosystem comparison takes.",
      category: "SIGNAL",
      sourceUrl: "https://example.com/sol-ath",
      sentiment: "bullish",
      relevance: 0.78,
      createdAt: daysAgo(1),
    },
    {
      id: "alert-5",
      type: "CONTENT_OPPORTUNITY",
      title: "No major accounts have covered the new Uniswap v4 hooks yet",
      context:
        "First-mover advantage on technical breakdown of custom hook patterns.",
      category: "SIGNAL",
      sentiment: "neutral",
      relevance: 0.88,
      createdAt: daysAgo(1),
    },
  ],
};

// ── Alert Subscriptions ──────────────────────────────────────────────────────

const alertSubscriptions: { subscriptions: AlertSubscription[] } = {
  subscriptions: [
    {
      id: "sub-1",
      type: "TOPIC",
      value: "Ethereum L2",
      isActive: true,
      delivery: ["in_app", "telegram"],
    },
    {
      id: "sub-2",
      type: "TOPIC",
      value: "DeFi Governance",
      isActive: true,
      delivery: ["in_app"],
    },
    {
      id: "sub-3",
      type: "TOPIC",
      value: "NFT Infrastructure",
      isActive: false,
      delivery: ["in_app"],
    },
  ],
};

// ── Briefing ─────────────────────────────────────────────────────────────────

const briefingLatest = {
  preference: {
    deliveryTime: "08:00",
    topics: ["Ethereum", "DeFi", "L2s"],
    sources: ["on-chain", "twitter", "news"],
    channel: "in_app",
    deliveryChannel: "in_app",
  },
};

// ── Reference Accounts (global) ──────────────────────────────────────────────

const referenceAccounts = {
  accounts: [
    {
      id: "ra-1",
      handle: "coaboratecobie",
      displayName: "Cobie",
      category: "Analyst",
      name: "Cobie",
    },
    {
      id: "ra-2",
      handle: "hasufl",
      displayName: "Hasu",
      category: "Researcher",
      name: "Hasu",
    },
    {
      id: "ra-3",
      handle: "GCRClassic",
      displayName: "GCR",
      category: "Trader",
      name: "GCR",
    },
  ],
};

// ── Path Map ─────────────────────────────────────────────────────────────────

const demoData: Record<string, unknown> = {
  "/api/analytics/summary": analyticsSummary,
  "/api/drafts": drafts,
  "/api/voice/profile": voiceProfile,
  "/api/voice/references": voiceReferences,
  "/api/voice/blends": voiceBlends,
  "/api/voice/reference-accounts": referenceAccounts,
  "/api/analytics/team": teamAnalysts,
  "/api/analytics/engagement-daily": engagementDaily,
  "/api/analytics/activity-daily": activityDaily,
  "/api/analytics/learning-log": learningLog,
  "/api/alerts/feed": alertsFeed,
  "/api/alerts/subscriptions": alertSubscriptions,
  "/api/briefing/preferences": briefingLatest,
};

/**
 * Returns demo response for a given API path, or null if the path
 * should not be intercepted (e.g. auth endpoints).
 */
export function getDemoResponse(path: string): unknown | null {
  // Strip query params for matching
  const cleanPath = path.split("?")[0];

  // Never intercept auth
  if (cleanPath.startsWith("/api/auth")) return null;

  return demoData[cleanPath] ?? null;
}

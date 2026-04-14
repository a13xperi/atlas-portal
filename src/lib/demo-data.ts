/**
 * Demo Mode — hardcoded mock data for all GET endpoints.
 * Returns the UNWRAPPED inner data (after envelope stripping).
 */

import type {
  AnalyticsSummary,
  BlendedVoiceProfile,
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
  TeamMember,
} from "./api";
import { publicUrls } from "./public-urls";

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

// ── Campaigns ────────────────────────────────────────────────────────────────

type DemoCampaign = {
  id: string;
  name: string;
  description: string;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED";
  draftCount: number;
  createdAt: string;
  drafts: TweetDraft[];
};

const demoCampaigns: DemoCampaign[] = [
  {
    id: "camp-1",
    name: "Modular Rollups Report",
    description:
      "Report-sourced campaign from Delphi's modular rollups quarterly note — drives the shared sequencer narrative with supporting trending commentary.",
    status: "ACTIVE",
    draftCount: 4,
    createdAt: daysAgo(7),
    drafts: [
      {
        id: "camp-1-draft-1",
        content:
          "Blob fees just cratered 40% and CT is calling it bearish. It's the opposite — L2 calldata compression is the modular thesis playing out in real-time. Cheaper infra is the adoption signal nobody's pricing in.",
        version: 1,
        status: "POSTED",
        confidence: 0.91,
        predictedEngagement: 4200,
        actualEngagement: 5380,
        sourceType: "REPORT",
        createdAt: daysAgo(6),
      },
      {
        id: "camp-1-draft-2",
        content:
          "Shared sequencers aren't a scaling upgrade. They're an alignment mechanism. When rollups share ordering, they stop competing for MEV and start compounding liquidity. That's the real unlock.",
        version: 2,
        status: "APPROVED",
        confidence: 0.87,
        predictedEngagement: 3600,
        sourceType: "REPORT",
        createdAt: daysAgo(5),
      },
      {
        id: "camp-1-draft-3",
        content:
          "Hot take: EigenDA + Celestia + Avail aren't competing for the same market. They're each optimizing for a different failure mode. The winning rollup stack will run all three in parallel.",
        version: 1,
        status: "APPROVED",
        confidence: 0.82,
        predictedEngagement: 2900,
        sourceType: "REPORT",
        createdAt: daysAgo(4),
      },
      {
        id: "camp-1-draft-4",
        content:
          "Three metrics that actually matter for modular L2s: blob fee efficiency, sequencer uptime, and cross-rollup message latency. Everyone's watching TPS. The data is in the footnotes.",
        version: 1,
        status: "DRAFT",
        confidence: 0.78,
        predictedEngagement: 2400,
        sourceType: "REPORT",
        createdAt: daysAgo(2),
      },
    ],
  },
  {
    id: "camp-2",
    name: "DeFi Market Update",
    description:
      "Working campaign for the upcoming DeFi update — stablecoin payments angle plus the restaking thread idea, both still in DRAFT status.",
    status: "DRAFT",
    draftCount: 3,
    createdAt: daysAgo(3),
    drafts: [
      {
        id: "camp-2-draft-1",
        content:
          "The carry trade is back — and this time it's denominated in stablecoins. $180B in circulating USDC/USDT is quietly earning 5%+ on T-bills. Banks aren't ready for what happens when that yield flows on-chain.",
        version: 1,
        status: "DRAFT",
        confidence: 0.84,
        predictedEngagement: 3100,
        sourceType: "MANUAL",
        createdAt: daysAgo(3),
      },
      {
        id: "camp-2-draft-2",
        content:
          "Restaking is overleveraged. When the same ETH secures 15 AVSs, you're not distributing risk — you're concentrating it with extra steps. The first correlated slashing event will reprice the entire sector.",
        version: 2,
        status: "DRAFT",
        confidence: 0.79,
        predictedEngagement: 3800,
        sourceType: "MANUAL",
        createdAt: daysAgo(2),
      },
      {
        id: "camp-2-draft-3",
        content:
          "Intent-based DEXs just crossed $12B in monthly volume. Solvers are competing on price and latency instead of bribes. This is how DeFi finally eats the OTC desks — quietly, then all at once.",
        version: 1,
        status: "APPROVED",
        confidence: 0.88,
        predictedEngagement: 2700,
        sourceType: "MANUAL",
        createdAt: daysAgo(1),
      },
    ],
  },
  {
    id: "camp-3",
    name: "L2 Fee Wars — March Recap",
    description:
      "Weekly recap thread on L2 fee compression. Blob fees, calldata optimization, and rollup economics.",
    status: "COMPLETED",
    draftCount: 5,
    createdAt: daysAgo(10),
    drafts: [
      {
        id: "camp-3-draft-1",
        content:
          "March L2 recap 🧵\n\nBlob fees: -42%\nAvg tx cost: -61%\nDaily active addresses: +28%\n\nThe fee wars are doing exactly what competition is supposed to do. Users win, rollups learn.",
        version: 1,
        status: "POSTED",
        confidence: 0.93,
        predictedEngagement: 4100,
        actualEngagement: 4820,
        sourceType: "REPORT",
        createdAt: daysAgo(9),
      },
      {
        id: "camp-3-draft-2",
        content:
          "Base shipped calldata compression and cut costs in half overnight. Arbitrum followed within 48 hours. Optimism is next. This isn't a race to zero — it's a race to the bottom of the cost curve where only infra matters.",
        version: 1,
        status: "POSTED",
        confidence: 0.89,
        predictedEngagement: 3400,
        actualEngagement: 3920,
        sourceType: "REPORT",
        createdAt: daysAgo(8),
      },
      {
        id: "camp-3-draft-3",
        content:
          "SOL reclaimed the 200d MA and nobody's talking about it. Last three times this happened: +34%, +51%, +72% over the following 90 days. The setup rhymes — just with quieter attention.",
        version: 2,
        status: "POSTED",
        confidence: 0.86,
        predictedEngagement: 3900,
        actualEngagement: 4450,
        sourceType: "MANUAL",
        createdAt: daysAgo(7),
      },
      {
        id: "camp-3-draft-4",
        content:
          "The most underrated L2 metric right now is sequencer uptime. Everyone's optimizing for fees but the real differentiator over the next cycle will be reliability. Downtime is the new rug.",
        version: 1,
        status: "POSTED",
        confidence: 0.81,
        predictedEngagement: 2500,
        actualEngagement: 2980,
        sourceType: "REPORT",
        createdAt: daysAgo(6),
      },
      {
        id: "camp-3-draft-5",
        content:
          "Closing thought: the modular vs monolithic debate is over. The market already voted — with fee dollars. Look at where the activity went in Q1, not where the arguments did.",
        version: 1,
        status: "POSTED",
        confidence: 0.9,
        predictedEngagement: 3200,
        actualEngagement: 3610,
        sourceType: "REPORT",
        createdAt: daysAgo(5),
      },
    ],
  },
];

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
      name: "Delphi Voice",
      voices: [
        { id: "demo-blend-1-v1", blendId: "demo-blend-1", label: "Personal", percentage: 70 },
        { id: "demo-blend-1-v2", blendId: "demo-blend-1", label: "Delphi Digital", percentage: 20 },
        { id: "demo-blend-1-v3", blendId: "demo-blend-1", label: "Messari", percentage: 10 },
      ],
    },
    {
      id: "demo-blend-2",
      name: "Founder Voice",
      voices: [
        { id: "demo-blend-2-v1", blendId: "demo-blend-2", label: "Personal", percentage: 55 },
        { id: "demo-blend-2-v2", blendId: "demo-blend-2", label: "Naval", percentage: 25 },
        { id: "demo-blend-2-v3", blendId: "demo-blend-2", label: "Paul Graham", percentage: 20 },
      ],
    },
    {
      id: "demo-blend-3",
      name: "Market Commentary",
      voices: [
        { id: "demo-blend-3-v1", blendId: "demo-blend-3", label: "Personal", percentage: 60 },
        { id: "demo-blend-3-v2", blendId: "demo-blend-3", label: "Messari", percentage: 25 },
        { id: "demo-blend-3-v3", blendId: "demo-blend-3", label: "Marc Andreessen", percentage: 15 },
      ],
    },
  ],
};

const twitterFollows = {
  follows: [
    {
      id: "demo-follow-1",
      handle: "hasufl",
      displayName: "Hasu",
      bio: "Writing about markets, crypto structure, and the second-order effects most people miss.",
      avatarUrl: null,
      followerCount: 182400,
    },
    {
      id: "demo-follow-2",
      handle: "DefiIgnas",
      displayName: "Ignas",
      bio: "DeFi researcher breaking down product design, token mechanics, and the incentive layer.",
      avatarUrl: null,
      followerCount: 95600,
    },
    {
      id: "demo-follow-3",
      handle: "goodalexander",
      displayName: "Alex Good",
      bio: "Macro, liquidity, and the market structure beneath the headline noise.",
      avatarUrl: null,
      followerCount: 74200,
    },
    {
      id: "demo-follow-4",
      handle: "punk6529",
      displayName: "punk6529",
      bio: "Long-form thinking on the internet, culture, and the future of digital ownership.",
      avatarUrl: null,
      followerCount: 521000,
    },
  ],
  cached: false,
};

const blendedVoiceProfile: { profile: BlendedVoiceProfile } = {
  profile: {
    id: "demo-blended-profile-1",
    primaryTwitterId: "demo-follow-1",
    primaryHandle: "hasufl",
    additionalTwitterIds: ["demo-follow-2", "demo-follow-3"],
    additionalHandles: ["DefiIgnas", "goodalexander"],
    weights: {
      "demo-follow-1": 0.7,
      "demo-follow-2": 0.15,
      "demo-follow-3": 0.15,
    },
    dimensions: {
      humor: 48,
      formality: 74,
      brevity: 61,
      contrarianTone: 67,
      directness: 69,
      warmth: 42,
      technicalDepth: 79,
      confidence: 71,
      evidenceOrientation: 83,
      solutionOrientation: 56,
      socialPosture: 38,
      selfPromotionalIntensity: 22,
    },
    styleSignals: null,
    tweetsAnalyzed: 146,
    blendSummary:
      "Voice blend anchored on @hasufl with supporting influence from @DefiIgnas and @goodalexander.",
    createdAt: now,
    updatedAt: now,
  },
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
      sourceUrl: publicUrls.demoSourceUrl,
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


// ── Team Members (Management) ─────────────────────────────────────────────────

const teamMembers: { team: TeamMember[] } = {
  team: [
    { id: "u1", handle: "DegenSpartan", displayName: "Degen Spartan", role: "ANALYST", _count: { tweetDrafts: 23, sessions: 14 } },
    { id: "u2", handle: "CryptoHayes", displayName: "Arthur Hayes", role: "ANALYST", _count: { tweetDrafts: 18, sessions: 9 } },
    { id: "u3", handle: "inversebrah", displayName: "inversebrah", role: "ANALYST", _count: { tweetDrafts: 31, sessions: 22 } },
    { id: "u4", handle: "punk6529", displayName: "punk6529", role: "ANALYST", _count: { tweetDrafts: 15, sessions: 7 } },
    { id: "u5", handle: "Pentosh1", displayName: "Pentosh1", role: "ANALYST", _count: { tweetDrafts: 8, sessions: 4 } },
    { id: "u6", handle: "a13xperi", displayName: "Alex Peri", role: "ADMIN", _count: { tweetDrafts: 47, sessions: 31 } },
  ],
};

const demoData: Record<string, unknown> = {
  "/api/qa/runs": {
    runs: [
      {
        id: "demo-run-1",
        tester_name: "Demo Tester",
        tester_initials: "DT",
        tester_id: "demo-user",
        created_at: new Date().toISOString(),
        results: {},
        summary: { pass: 0, fail: 0, skip: 0, blockers: 0, total: 130 },
      },
    ],
  },
  "/api/analytics/summary": analyticsSummary,
  "/api/drafts": drafts,
  "/api/voice/profile": voiceProfile,
  "/api/voice/references": voiceReferences,
  "/api/voice/blends": voiceBlends,
  "/api/voice/blended-profile": blendedVoiceProfile,
  "/api/voice/reference-accounts": referenceAccounts,
  "/api/twitter/follows": twitterFollows,
  "/api/analytics/team": teamAnalysts,
  "/api/analytics/engagement-daily": engagementDaily,
  "/api/analytics/activity-daily": activityDaily,
  "/api/analytics/learning-log": learningLog,
  "/api/alerts/feed": alertsFeed,
  "/api/alerts/subscriptions": alertSubscriptions,
  "/api/briefing/preferences": briefingLatest,

  "/api/users/profile": {
    user: {
      id: "cmn8z3yn50000nz01y0xcyfgn",
      handle: "a13xperi",
      displayName: "Alex Peri",
      email: "alex.e.peri@gmail.com",
      role: "ANALYST",
      bio: "Crypto analyst & builder. DeFi native. Building Atlas at Delphi Digital.",
      timezone: "America/Los_Angeles",
      notificationsEnabled: true,
      telegramLinked: false,
      createdAt: "2026-03-15T00:00:00Z",
    },
  },

  "/api/trending/topics": {
    topics: [
      { id: "tt-1", topic: "Ethereum Blob Fees", headline: "Blob fees crater 40% as L2s optimize calldata compression", sentiment: "bearish", relevance: 0.95 },
      { id: "tt-2", topic: "Uniswap v4 Hooks", headline: "First custom hook deployments go live on mainnet", sentiment: "bullish", relevance: 0.91 },
      { id: "tt-3", topic: "SOL ETF Filing", headline: "VanEck files amended S-1 for spot Solana ETF", sentiment: "bullish", relevance: 0.88 },
      { id: "tt-4", topic: "Restaking Risk", headline: "Researchers flag systemic risk in multi-layer restaking", sentiment: "bearish", relevance: 0.84 },
      { id: "tt-5", topic: "RWA Tokenization", headline: "BlackRock BUIDL fund crosses $1B in tokenized treasuries", sentiment: "bullish", relevance: 0.82 },
    ],
  },

  "/api/drafts/team": {
    drafts: [
      { id: "td-1", content: "Blob fees are the new gas wars. Except this time the battlefield is off-chain and nobody's watching.", version: 1, status: "POSTED", confidence: 0.89, predictedEngagement: 10.2, actualEngagement: 13.5, sourceType: "MANUAL", createdAt: daysAgo(1), blendName: "CT Alpha", user: { handle: "DegenSpartan", displayName: "Degen Spartan", avatarUrl: null } },
      { id: "td-2", content: "The carry trade is back — and this time it's denominated in stablecoins. Banks aren't ready.", version: 1, status: "DRAFT", confidence: 0.76, predictedEngagement: 8.8, sourceType: "MANUAL", createdAt: daysAgo(1), blendName: null, user: { handle: "CryptoHayes", displayName: "Arthur Hayes", avatarUrl: null } },
      { id: "td-3", content: "Everyone wants to be a contrarian until the contrarian trade actually works. Then they call it obvious.", version: 2, status: "APPROVED", confidence: 0.82, predictedEngagement: 11.0, sourceType: "MANUAL", createdAt: daysAgo(2), blendName: "Shitpost Blend", user: { handle: "inversebrah", displayName: "inversebrah", avatarUrl: null } },
      { id: "td-4", content: "NFTs aren't dead. The speculation layer is dead. The infrastructure layer is just getting started.", version: 1, status: "POSTED", confidence: 0.93, predictedEngagement: 14.5, actualEngagement: 18.2, sourceType: "MANUAL", createdAt: daysAgo(3), blendName: null, user: { handle: "punk6529", displayName: "punk6529", avatarUrl: null } },
      { id: "td-5", content: "SOL reclaimed the 200-day MA. Historically this has led to 30-60 day rallies. Watch the weekly close.", version: 1, status: "DRAFT", confidence: 0.71, predictedEngagement: 7.3, sourceType: "MANUAL", createdAt: daysAgo(1), blendName: "TA Focus", user: { handle: "Pentosh1", displayName: "Pentosh1", avatarUrl: null } },
    ],
    total: 5,
  },

  "/api/users/team": teamMembers,
  "/api/campaigns": {
    campaigns: demoCampaigns.map(({ drafts: campaignDrafts, ...rest }) => ({
      ...rest,
      draftCount: campaignDrafts.length,
    })),
  },

  "/api/briefing/history": {
    briefings: [
      {
        id: "b1",
        title: "Morning Brief — Friday, April 4",
        summary: "ETH blob fees dropped 40% overnight as major L2s rolled out calldata compression upgrades. VanEck's amended SOL ETF filing has reignited the alt-ETF narrative.",
        sections: [
          { heading: "Ethereum & L2s", emoji: "🔵", bullets: ["Blob fees down 40% — L2 compression approach working", "Uniswap v4 hooks see first mainnet deployments"] },
          { heading: "ETF & Institutions", emoji: "🏦", bullets: ["VanEck files amended S-1 for spot Solana ETF", "BlackRock BUIDL tokenized treasury fund crosses $1B AUM"] },
          { heading: "Contrarian Take", emoji: "🔮", bullets: ["Blob fee compression signals maturity, not weakness — institutions watch infra costs before deploying"] },
        ],
        topics: ["DeFi", "L2", "ETF"],
        sources: ["X/Twitter", "News"],
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
  },
  "/api/arena/leaderboard": {
    period: "weekly" as const,
    entries: [
      { rank: 1, userId: "u3", displayName: "inversebrah", avatarUrl: null, tweetsPublished: 31, totalEngagement: 142000, consistencyStreak: 14, badge: "Alpha" },
      { rank: 2, userId: "u1", displayName: "DegenSpartan", avatarUrl: null, tweetsPublished: 23, totalEngagement: 118000, consistencyStreak: 10, badge: null },
      { rank: 3, userId: "u2", displayName: "CryptoHayes", avatarUrl: null, tweetsPublished: 18, totalEngagement: 97000, consistencyStreak: 7, badge: null },
      { rank: 4, userId: "u4", displayName: "punk6529", avatarUrl: null, tweetsPublished: 15, totalEngagement: 74000, consistencyStreak: 5, badge: null },
      { rank: 5, userId: "u5", displayName: "Pentosh1", avatarUrl: null, tweetsPublished: 8, totalEngagement: 41000, consistencyStreak: 3, badge: null },
      { rank: 6, userId: "u6", displayName: "Alex Peri", avatarUrl: null, tweetsPublished: 47, totalEngagement: 210000, consistencyStreak: 21, badge: null },
    ],
  },
  "/api/arena/me": {
    rank: 6,
    userId: "u6",
    displayName: "Alex Peri",
    avatarUrl: null,
    tweetsPublished: 47,
    totalEngagement: 210000,
    consistencyStreak: 21,
    badge: null,
  },

  "/api/drafts/queue": {
    queue: [
      { id: "demo-q-1", content: "ETH staking yields are compressing but that's actually bullish. It means the network is maturing and validators are playing a longer game. The yield farmers leave, the believers stay.", version: 1, status: "APPROVED", confidence: 0.87, predictedEngagement: 8.4, actualEngagement: null, sourceType: "MANUAL" as const, createdAt: daysAgo(1), _score: 0.92, suggestedAt: new Date(Date.now() + 1 * 3600000).toISOString() },
      { id: "demo-q-2", content: "The carry trade is back — and this time it's denominated in stablecoins. Banks aren't ready for a world where yield on-chain is 2x what they offer off-chain.", version: 1, status: "DRAFT", confidence: 0.76, predictedEngagement: 7.1, actualEngagement: null, sourceType: "REPORT" as const, createdAt: daysAgo(2), _score: 0.84, suggestedAt: new Date(Date.now() + 5 * 3600000).toISOString() },
      { id: "demo-q-3", content: "L2 fees just hit an all-time low. The rollup wars are doing exactly what competition is supposed to do — drive costs down while throughput goes up. Users win.", version: 2, status: "APPROVED", confidence: 0.81, predictedEngagement: 9.3, actualEngagement: null, sourceType: "MANUAL" as const, createdAt: daysAgo(1), _score: 0.79, suggestedAt: new Date(Date.now() + 24 * 3600000).toISOString() },
      { id: "demo-q-4", content: "Everyone wants to be a contrarian until the contrarian trade actually works. Then they call it obvious. The blob fee thesis has been in our research for 6 months.", version: 1, status: "DRAFT", confidence: 0.69, predictedEngagement: 5.8, actualEngagement: null, sourceType: "MANUAL" as const, createdAt: daysAgo(3), _score: 0.71, suggestedAt: new Date(Date.now() + 48 * 3600000).toISOString() },
    ],
    total: 4,
    nextUp: { id: "demo-q-1", content: "ETH staking yields are compressing but that's actually bullish. It means the network is maturing and validators are playing a longer game. The yield farmers leave, the believers stay.", version: 1, status: "APPROVED", confidence: 0.87, predictedEngagement: 8.4, actualEngagement: null, sourceType: "MANUAL" as const, createdAt: daysAgo(1), _score: 0.92, suggestedAt: new Date(Date.now() + 1 * 3600000).toISOString() },
  },

  "/api/briefing/latest": {
    id: "b1",
    date: "2026-04-04",
    summary: "ETH blob fees dropped 40% overnight as major L2s rolled out calldata compression upgrades. Meanwhile, VanEck's amended SOL ETF filing has reignited the alt-ETF narrative, and BlackRock's BUIDL fund quietly crossed $1B in tokenized treasuries.",
    bullets: [
      "Ethereum blob fees down 40% — L2 compression approach approach approach approach approach approach approach working",
      "VanEck files amended S-1 for spot Solana ETF with updated custody details",
      "BlackRock BUIDL tokenized treasury fund crosses $1B AUM",
      "Uniswap v4 hooks see first mainnet deployments — custom AMM logic is live",
      "Restaking researchers publish risk framework for multi-AVS exposure",
    ],
    topics: ["DeFi", "L2", "ETF", "Restaking"],
    createdAt: "2026-04-04T07:00:00Z",
  },
};

/**
 * Returns demo response for a given API path, or null if the path
 * should not be intercepted (e.g. auth endpoints).
 */
export function getDemoResponse(path: string, method: string = "GET", body?: unknown): unknown | null {
  // Strip query params for matching
  const cleanPath = path.split("?")[0];

  // Never intercept auth
  if (cleanPath.startsWith("/api/auth")) return null;

  // Dynamic path matchers
  if (method === "GET" && /^\/api\/drafts\/[^/]+$/.test(cleanPath)) {
    // Don't intercept /api/drafts/team — it has its own entry in the path map
    if (cleanPath !== "/api/drafts/team") {
      return { draft: drafts.drafts[0] };
    }
  }

  // Campaign detail — return full campaign with drafts populated
  if (method === "GET" && /^\/api\/campaigns\/[^/]+$/.test(cleanPath)) {
    const id = cleanPath.split("/").pop() as string;
    const match = demoCampaigns.find((c) => c.id === id);
    if (match) {
      return { campaign: match };
    }
    // Unknown id (e.g. freshly created in-session) — return a minimal shell
    // with the first demo draft so the page renders something useful.
    return {
      campaign: {
        id,
        name: "New Campaign",
        description: "Campaign created in demo mode.",
        status: "DRAFT" as const,
        draftCount: 1,
        drafts: [drafts.drafts[0]],
        createdAt: now,
      },
    };
  }

  // Campaign create — return a synthetic campaign the UI can route to
  if (method === "POST" && cleanPath === "/api/campaigns") {
    const payload = (body ?? {}) as { name?: string; description?: string };
    return {
      campaign: {
        id: `camp-demo-${Date.now()}`,
        name: payload.name || "New Campaign",
        description: payload.description ?? null,
        status: "DRAFT" as const,
        draftCount: 0,
        drafts: [],
        createdAt: now,
      },
    };
  }

  // Campaign clone
  if (method === "POST" && /^\/api\/campaigns\/[^/]+\/clone$/.test(cleanPath)) {
    const id = cleanPath.split("/")[3] as string;
    const existing = demoCampaigns.find((c) => c.id === id);
    return {
      campaign: {
        id: `camp-clone-${Date.now()}`,
        name: `${existing?.name ?? "Campaign"} (Copy)`,
        description: existing?.description ?? null,
        status: "DRAFT" as const,
        draftCount: existing?.draftCount ?? 0,
        drafts: existing?.drafts ?? [],
        createdAt: now,
      },
    };
  }

  // Campaign update
  if (method === "PATCH" && /^\/api\/campaigns\/[^/]+$/.test(cleanPath)) {
    const id = cleanPath.split("/").pop() as string;
    const existing = demoCampaigns.find((c) => c.id === id);
    const payload = (body ?? {}) as Partial<{
      name: string;
      description: string | null;
      status: DemoCampaign["status"];
    }>;
    return {
      campaign: {
        id,
        name: payload.name ?? existing?.name ?? "Campaign",
        description: payload.description ?? existing?.description ?? null,
        status: payload.status ?? existing?.status ?? ("DRAFT" as const),
        draftCount: existing?.draftCount ?? 0,
        drafts: existing?.drafts ?? [],
        createdAt: existing?.createdAt ?? now,
      },
    };
  }

  // Campaign add/remove draft
  if (method === "POST" && /^\/api\/campaigns\/[^/]+\/drafts$/.test(cleanPath)) {
    return { success: true };
  }
  if (method === "DELETE" && /^\/api\/campaigns\/[^/]+\/drafts\/[^/]+$/.test(cleanPath)) {
    return { success: true };
  }

  if (method === "POST" && cleanPath === "/api/drafts/generate") {
    return {
      draft: {
        id: "demo-gen-1",
        content:
          "The intersection of blob fee economics and L2 scaling isn't just a technical story — it's the most underpriced narrative in crypto right now.\n\nHere's why the next 6 months will reshape how we think about transaction costs. \ud83e\uddf5",
        status: "draft",
        createdAt: new Date().toISOString(),
        blendId: null,
      },
    };
  }

  if (method === "POST" && /^\/api\/drafts\/[^/]+\/refine$/.test(cleanPath)) {
    return {
      draft: {
        id: "demo-ref-1",
        content:
          "Blob fees just hit historic lows. L2 transaction costs are cratering.\n\nThis isn't a blip — it's the modular thesis playing out in real-time. And most people still don't get it.",
        status: "draft",
        createdAt: new Date().toISOString(),
        blendId: null,
      },
    };
  }

  if (method === "POST" && /^\/api\/drafts\/[^/]+\/regenerate$/.test(cleanPath)) {
    return {
      draft: {
        id: "demo-regen-1",
        content:
          "Everyone's talking about blob fees but missing the bigger picture: the modular stack is compressing faster than anyone modeled.\n\nCelestia. EigenDA. Avail. They're not competing — they're converging.",
        status: "draft",
        createdAt: new Date().toISOString(),
        blendId: null,
      },
    };
  }

  // Research — used by alerts page "Research" button
  if (method === "POST" && cleanPath === "/api/research") {
    return {
      result: {
        id: "demo-research-1",
        query: "demo research",
        summary: "On-chain data shows institutional accumulation accelerating across major L1s. ETF inflows remain strong while exchange reserves hit multi-year lows. The supply squeeze thesis is playing out in real time — and most retail hasn't noticed yet.",
        keyFacts: [
          "ETF net inflows averaged $420M/day this week",
          "Exchange reserves at lowest since 2021",
          "Institutional wallets added 12,000 BTC in 7 days",
        ],
        sentiment: "bullish" as const,
        relatedTopics: ["ETF Flows", "Supply Squeeze", "Institutional Adoption"],
        sources: ["Glassnode", "CoinMetrics", "DefiLlama"],
        confidence: 0.87,
        createdAt: now,
      },
    };
  }

  // Image generation
  if (method === "POST" && (cleanPath === "/api/images/generate" || cleanPath === "/api/images/generate-for-draft")) {
    return {
      image: {
        id: "demo-img-1",
        url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='512' height='512' fill='%230a1628'%3E%3Crect width='512' height='512'/%3E%3Ctext x='256' y='256' text-anchor='middle' fill='%234ecdc4' font-size='24' dy='.3em'%3EDemo Image%3C/text%3E%3C/svg%3E",
        prompt: "demo",
        createdAt: now,
      },
    };
  }

  // Oracle message — used by onboarding chat
  if (method === "POST" && cleanPath === "/api/oracle/message") {
    return {
      messages: [
        { content: "Great question! Let me help you explore that. Atlas learns your voice over time — the more you draft, the better it gets at matching your style.", role: "oracle" },
      ],
      llmGenerated: false,
    };
  }

  // Oracle chat — used by FloatingOracle widget + CraftingAdvisor angle generation
  if (method === "POST" && cleanPath === "/api/oracle/chat") {
    const msgs = typeof body === "object" && body !== null && "messages" in body ? (body as Record<string, unknown>).messages : [];
    const msg = Array.isArray(msgs) && msgs.length > 0 && typeof msgs[0] === "object" && msgs[0] !== null ? String((msgs[0] as Record<string, unknown>).content ?? "") : "";
    if (msg.includes("Generate exactly 4-5 tweet angles")) {
      return {
        text: `Here are your angles:\n\n${JSON.stringify([
          { title: "The Contrarian Take", description: "Challenge the prevailing narrative with on-chain data", sampleOpener: "Everyone's bullish on ETH but the data tells a different story...", tone: "Contrarian", structure: "tweet" },
          { title: "Data Deep Dive", description: "Lead with the numbers that most people missed", sampleOpener: "Three metrics nobody's watching right now:", tone: "Analytical", structure: "thread" },
          { title: "Hot Take Express", description: "Quick, punchy opinion that sparks engagement", sampleOpener: "Unpopular opinion: this cycle's winners aren't who you think.", tone: "Provocative", structure: "tweet" },
          { title: "Educational Breakdown", description: "Explain the complex topic simply for your audience", sampleOpener: "Let me break down what's actually happening with...", tone: "Educational", structure: "thread" },
        ])}\n\nPick the ones that match your mood.`,
      };
    }
    return {
      text: "That's a sharp question. Based on your voice profile, I'd suggest leading with data — your contrarian edge works best when it's backed by on-chain evidence. Want me to help draft something?",
    };
  }

  // Oracle agent — used by FloatingOracle agent mode
  if (method === "POST" && cleanPath === "/api/oracle/agent") {
    const agentMsgs = typeof body === "object" && body !== null && "messages" in body ? (body as Record<string, unknown>).messages : [];
    const lastUser = Array.isArray(agentMsgs)
      ? [...agentMsgs].reverse().find((m) => typeof m === "object" && m !== null && (m as Record<string, unknown>).role === "user")
      : null;
    const lastText = lastUser && typeof lastUser === "object" ? String((lastUser as Record<string, unknown>).content ?? "").toLowerCase() : "";

    if (/\b(draft|tweet|write|post)\b/.test(lastText)) {
      return { text: "On it — spinning up a draft based on your voice profile.", actions: [{ id: `act-${Date.now()}`, type: "generate_draft", input: { prompt: lastText }, requiresConfirmation: false, label: "Generate draft" }] };
    }
    if (/\b(analytics|stats|performance|metrics)\b/.test(lastText)) {
      return { text: "Pulling your latest analytics summary now.", actions: [{ id: `act-${Date.now()}`, type: "get_analytics_summary", input: {}, requiresConfirmation: false, label: "Get analytics summary" }] };
    }
    if (/\b(trending|signals|hot|momentum)\b/.test(lastText)) {
      return { text: "Checking the signal feed — here\'s what\'s moving right now.", actions: [{ id: `act-${Date.now()}`, type: "get_trending", input: {}, requiresConfirmation: false, label: "Get trending signals" }] };
    }
    if (/\b(voice|tone|style|profile)\b/.test(lastText)) {
      return { text: "Grabbing your current voice profile so we can tune it together.", actions: [{ id: `act-${Date.now()}`, type: "get_voice_profile", input: {}, requiresConfirmation: false, label: "Get voice profile" }] };
    }
    return { text: "I can help you draft tweets, check analytics, browse signals, tune your voice, or generate briefings. Just tell me what you need — or tap a quick action below.", actions: [] };
  }

  // Briefing generate
  if (method === "POST" && cleanPath === "/api/briefing/generate") {
    return {
      briefing: {
        id: `b-${Date.now()}`,
        title: "Alpha Scan — Saturday, April 5",
        summary: "Three undervalued narratives emerging: restaking derivatives, intent-based DEXs, and modular DA layers. Each has <$500M TVL but accelerating developer activity.",
        sections: [
          { heading: "Restaking Derivatives", emoji: "🔄", bullets: ["EigenLayer derivatives market forming — watch Pendle and Swell", "Risk: multi-AVS exposure creates correlated liquidation cascades"] },
          { heading: "Intent DEXs", emoji: "🎯", bullets: ["CoW Protocol volume up 300% MoM — solver competition heating up", "UniswapX scaling intent-based routing across L2s"] },
          { heading: "Contrarian", emoji: "🔮", bullets: ["Modular DA is overhyped short-term but underpriced long-term — EigenDA + Celestia will compress blob fees further"] },
        ],
        topics: ["DeFi", "L2"],
        sources: ["X/Twitter", "News"],
        createdAt: new Date().toISOString(),
      },
    };
  }

  // Trending scan
  if (method === "POST" && cleanPath === "/api/trending/scan") {
    return { alerts: [] };
  }

  // Thread generation
  if (method === "POST" && /^\/api\/drafts\/[^/]+\/thread$/.test(cleanPath)) {
    return {
      thread: [
        "1/ Blob fees are cratering. Here's why that's actually the most bullish signal for Ethereum right now. 🧵",
        "2/ L2s just shipped calldata compression. Translation: posting data to Ethereum is getting cheaper, faster.",
        "3/ This is the flywheel: cheaper → more activity → more fees → repeat. The blob fee drop IS the adoption signal.",
        "4/ Don't confuse price compression with value destruction. This is infrastructure maturing. And mature infra attracts institutions.",
      ],
      count: 4,
    };
  }

  // Draft create/update passthrough
  if (method === "POST" && cleanPath === "/api/drafts") {
    return { draft: drafts.drafts[0] };
  }
  if (method === "PATCH" && /^\/api\/drafts\/[^/]+$/.test(cleanPath)) {
    return { draft: drafts.drafts[0] };
  }

  // Alert subscription
  if (method === "POST" && cleanPath === "/api/alerts/subscriptions") {
    return { subscription: { id: "demo-sub-new", type: "TOPIC", value: "New Topic", isActive: true, delivery: ["in_app"] } };
  }

  // Manager actions (Arena page)
  if (method === "POST" && cleanPath === "/api/users/push-top-profiles") {
    return { message: "Top voice profiles pushed to 4 analysts", affected: 4 };
  }
  if (method === "POST" && cleanPath === "/api/users/send-nudge") {
    return { message: "Nudge sent to 2 inactive analysts", affected: 2 };
  }
  if (method === "POST" && cleanPath === "/api/users/push-style") {
    return { message: "Style pushed to all analysts", affected: 6 };
  }

  // Voice profile update
  if ((method === "PUT" || method === "PATCH") && cleanPath === "/api/voice/profile") {
    return { profile: voiceProfile.profile };
  }

  // Briefing preferences update
  if (method === "PUT" && cleanPath === "/api/briefing/preferences") {
    return { preference: briefingLatest.preference };
  }

  // Catch-all for any other POST/PUT/PATCH in demo mode
  if (method !== "GET") {
    return {};
  }

  return demoData[cleanPath] ?? null;
}

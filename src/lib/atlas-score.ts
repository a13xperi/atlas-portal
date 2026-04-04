import type { TeamAnalyst, VoiceProfile } from "./api";

// ── Tiers ──────────────────────────────────────────────────────────
export type AtlasTier = "Oracle" | "Alpha" | "Analyst" | "Apprentice" | "Ghost";

export interface TierConfig {
  name: AtlasTier;
  min: number;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const TIERS: TierConfig[] = [
  { name: "Oracle", min: 900, color: "text-purple-400", bgColor: "bg-purple-400/10", borderColor: "border-purple-400/40" },
  { name: "Alpha", min: 700, color: "text-yellow-400", bgColor: "bg-yellow-400/10", borderColor: "border-yellow-400/40" },
  { name: "Analyst", min: 400, color: "text-atlas-teal", bgColor: "bg-atlas-teal/10", borderColor: "border-atlas-teal/40" },
  { name: "Apprentice", min: 100, color: "text-orange-400", bgColor: "bg-orange-400/10", borderColor: "border-orange-400/40" },
  { name: "Ghost", min: 0, color: "text-atlas-text-muted", bgColor: "bg-atlas-surface", borderColor: "border-glass-border" },
];

export function getAtlasTier(score: number): TierConfig {
  for (const tier of TIERS) {
    if (score >= tier.min) return tier;
  }
  return TIERS[TIERS.length - 1];
}

// ── Score Components ───────────────────────────────────────────────
export interface ScoreBreakdown {
  output: number;      // 0-250
  postRate: number;    // 0-200
  engagement: number;  // 0-200
  maturity: number;    // 0-150
  feedback: number;    // 0-100
  streak: number;      // 0-100
  total: number;       // 0-1000
}

// ── Maturity Score ─────────────────────────────────────────────────
function maturityScore(profile?: VoiceProfile | null): number {
  if (!profile) return 0;
  const levelScore =
    profile.maturity === "ADVANCED" ? 100 :
    profile.maturity === "INTERMEDIATE" ? 60 :
    30;
  return levelScore;
}

// ── Calculate Atlas Score ──────────────────────────────────────────
export function calculateAtlasScore(
  analyst: TeamAnalyst,
  teamMax: { maxDrafts: number; maxSessions: number; maxEvents: number }
): ScoreBreakdown {
  const drafts = analyst._count.tweetDrafts;
  const sessions = analyst._count.sessions;
  const events = analyst._count.analyticsEvents;

  // Output: drafts relative to team max (0-250)
  const output = teamMax.maxDrafts > 0
    ? Math.round((drafts / teamMax.maxDrafts) * 250)
    : 0;

  // Post rate: estimate from events-to-drafts ratio (0-200)
  // Higher events per draft = more engagement = higher score
  const eventsPerDraft = drafts > 0 ? events / drafts : 0;
  const postRate = Math.min(200, Math.round(eventsPerDraft * 40));

  // Engagement: sessions indicate active usage (0-200)
  const engagement = teamMax.maxSessions > 0
    ? Math.min(200, Math.round((sessions / teamMax.maxSessions) * 200))
    : 0;

  // Maturity: voice profile development (0-150)
  const mat = Math.round(maturityScore(analyst.voiceProfile) * 1.5);

  // Feedback: events beyond drafts indicate feedback/refinement (0-100)
  const feedbackEvents = Math.max(0, events - drafts);
  const feedback = teamMax.maxEvents > 0
    ? Math.min(100, Math.round((feedbackEvents / teamMax.maxEvents) * 100))
    : 0;

  // Streak: sessions as a proxy (0-100) — proper streak needs daily data
  const streak = Math.min(100, Math.round(sessions * 5));

  const total = Math.min(1000, output + postRate + engagement + mat + feedback + streak);

  return { output, postRate, engagement, maturity: mat, feedback, streak, total };
}

// ── Rank Team ──────────────────────────────────────────────────────
export interface RankedAnalyst {
  analyst: TeamAnalyst;
  score: ScoreBreakdown;
  tier: TierConfig;
  rank: number;
}

export function rankTeam(analysts: TeamAnalyst[]): RankedAnalyst[] {
  if (analysts.length === 0) return [];

  const maxDrafts = Math.max(...analysts.map((a) => a._count.tweetDrafts), 1);
  const maxSessions = Math.max(...analysts.map((a) => a._count.sessions), 1);
  const maxEvents = Math.max(...analysts.map((a) => a._count.analyticsEvents), 1);
  const teamMax = { maxDrafts, maxSessions, maxEvents };

  return analysts
    .map((analyst) => {
      const score = calculateAtlasScore(analyst, teamMax);
      return {
        analyst,
        score,
        tier: getAtlasTier(score.total),
        rank: 0,
      };
    })
    .sort((a, b) => b.score.total - a.score.total)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));
}

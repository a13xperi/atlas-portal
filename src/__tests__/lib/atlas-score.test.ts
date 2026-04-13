import {
  getAtlasTier,
  calculateAtlasScore,
  rankTeam,
  TIERS,
  type ScoreBreakdown,
} from "@/lib/atlas-score";
import type { TeamAnalyst, VoiceProfile } from "@/lib/api";

// ── Helpers ───────────────────────────────────────────────────────────

function makeAnalyst(
  overrides: Partial<TeamAnalyst> & {
    drafts?: number;
    events?: number;
    sessions?: number;
    maturity?: VoiceProfile["maturity"];
  } = {}
): TeamAnalyst {
  const { drafts = 0, events = 0, sessions = 0, maturity, ...rest } = overrides;
  return {
    id: "a1",
    handle: "tester",
    voiceProfile: maturity
      ? ({
          id: "vp1",
          userId: "a1",
          humor: 50,
          formality: 50,
          brevity: 50,
          contrarianTone: 50,
          maturity,
          tweetsAnalyzed: 10,
        } as VoiceProfile)
      : undefined,
    _count: { tweetDrafts: drafts, analyticsEvents: events, sessions },
    ...rest,
  };
}

const DEFAULT_TEAM_MAX = { maxDrafts: 10, maxSessions: 10, maxEvents: 50 };

// ── getAtlasTier ──────────────────────────────────────────────────────

describe("getAtlasTier", () => {
  it("returns Oracle for scores >= 900", () => {
    expect(getAtlasTier(900).name).toBe("Oracle");
    expect(getAtlasTier(1000).name).toBe("Oracle");
  });

  it("returns Alpha for scores 700-899", () => {
    expect(getAtlasTier(700).name).toBe("Alpha");
    expect(getAtlasTier(899).name).toBe("Alpha");
  });

  it("returns Analyst for scores 400-699", () => {
    expect(getAtlasTier(400).name).toBe("Analyst");
    expect(getAtlasTier(699).name).toBe("Analyst");
  });

  it("returns Apprentice for scores 100-399", () => {
    expect(getAtlasTier(100).name).toBe("Apprentice");
    expect(getAtlasTier(399).name).toBe("Apprentice");
  });

  it("returns Ghost for scores below 100", () => {
    expect(getAtlasTier(0).name).toBe("Ghost");
    expect(getAtlasTier(99).name).toBe("Ghost");
  });

  it("returns Ghost for negative scores", () => {
    expect(getAtlasTier(-1).name).toBe("Ghost");
  });

  it("tier boundaries are correct and ordered descending", () => {
    for (let i = 0; i < TIERS.length - 1; i++) {
      expect(TIERS[i].min).toBeGreaterThan(TIERS[i + 1].min);
    }
  });
});

// ── calculateAtlasScore ───────────────────────────────────────────────

describe("calculateAtlasScore", () => {
  it("returns all zeros for an analyst with no activity", () => {
    const analyst = makeAnalyst();
    const score = calculateAtlasScore(analyst, DEFAULT_TEAM_MAX);
    expect(score).toEqual<ScoreBreakdown>({
      output: 0,
      postRate: 0,
      engagement: 0,
      maturity: 0,
      feedback: 0,
      streak: 0,
      total: 0,
    });
  });

  it("calculates output relative to team max drafts", () => {
    const analyst = makeAnalyst({ drafts: 5 });
    const score = calculateAtlasScore(analyst, { ...DEFAULT_TEAM_MAX, maxDrafts: 10 });
    expect(score.output).toBe(125); // (5/10) * 250
  });

  it("output is 250 when analyst has team-max drafts", () => {
    const analyst = makeAnalyst({ drafts: 10 });
    const score = calculateAtlasScore(analyst, { ...DEFAULT_TEAM_MAX, maxDrafts: 10 });
    expect(score.output).toBe(250);
  });

  it("calculates postRate from events-to-drafts ratio", () => {
    const analyst = makeAnalyst({ drafts: 4, events: 20 });
    const score = calculateAtlasScore(analyst, DEFAULT_TEAM_MAX);
    // eventsPerDraft = 20/4 = 5, postRate = min(200, 5 * 40) = 200
    expect(score.postRate).toBe(200);
  });

  it("caps postRate at 200", () => {
    const analyst = makeAnalyst({ drafts: 1, events: 100 });
    const score = calculateAtlasScore(analyst, DEFAULT_TEAM_MAX);
    expect(score.postRate).toBe(200);
  });

  it("postRate is 0 when no drafts exist", () => {
    const analyst = makeAnalyst({ events: 50 });
    const score = calculateAtlasScore(analyst, DEFAULT_TEAM_MAX);
    expect(score.postRate).toBe(0);
  });

  it("calculates engagement relative to team max sessions", () => {
    const analyst = makeAnalyst({ sessions: 5 });
    const score = calculateAtlasScore(analyst, { ...DEFAULT_TEAM_MAX, maxSessions: 10 });
    expect(score.engagement).toBe(100); // (5/10) * 200
  });

  it("caps engagement at 200", () => {
    const analyst = makeAnalyst({ sessions: 20 });
    const score = calculateAtlasScore(analyst, { ...DEFAULT_TEAM_MAX, maxSessions: 10 });
    expect(score.engagement).toBe(200);
  });

  it("maturity is 150 for ADVANCED voice profile", () => {
    const analyst = makeAnalyst({ maturity: "ADVANCED" });
    const score = calculateAtlasScore(analyst, DEFAULT_TEAM_MAX);
    expect(score.maturity).toBe(150); // 100 * 1.5
  });

  it("maturity is 90 for INTERMEDIATE voice profile", () => {
    const analyst = makeAnalyst({ maturity: "INTERMEDIATE" });
    const score = calculateAtlasScore(analyst, DEFAULT_TEAM_MAX);
    expect(score.maturity).toBe(90); // 60 * 1.5
  });

  it("maturity is 45 for BEGINNER voice profile", () => {
    const analyst = makeAnalyst({ maturity: "BEGINNER" });
    const score = calculateAtlasScore(analyst, DEFAULT_TEAM_MAX);
    expect(score.maturity).toBe(45); // 30 * 1.5
  });

  it("maturity is 0 when no voice profile", () => {
    const analyst = makeAnalyst();
    const score = calculateAtlasScore(analyst, DEFAULT_TEAM_MAX);
    expect(score.maturity).toBe(0);
  });

  it("feedback uses events beyond drafts count", () => {
    const analyst = makeAnalyst({ drafts: 5, events: 25 });
    // feedbackEvents = 25 - 5 = 20, feedback = min(100, (20/50) * 100) = 40
    const score = calculateAtlasScore(analyst, { ...DEFAULT_TEAM_MAX, maxEvents: 50 });
    expect(score.feedback).toBe(40);
  });

  it("feedback is 0 when events <= drafts", () => {
    const analyst = makeAnalyst({ drafts: 10, events: 5 });
    const score = calculateAtlasScore(analyst, DEFAULT_TEAM_MAX);
    expect(score.feedback).toBe(0);
  });

  it("streak is sessions * 5, capped at 100", () => {
    expect(calculateAtlasScore(makeAnalyst({ sessions: 10 }), DEFAULT_TEAM_MAX).streak).toBe(50);
    expect(calculateAtlasScore(makeAnalyst({ sessions: 20 }), DEFAULT_TEAM_MAX).streak).toBe(100);
    expect(calculateAtlasScore(makeAnalyst({ sessions: 30 }), DEFAULT_TEAM_MAX).streak).toBe(100);
  });

  it("total is capped at 1000", () => {
    const analyst = makeAnalyst({
      drafts: 10,
      events: 100,
      sessions: 30,
      maturity: "ADVANCED",
    });
    const score = calculateAtlasScore(analyst, {
      maxDrafts: 10,
      maxSessions: 10,
      maxEvents: 50,
    });
    expect(score.total).toBeLessThanOrEqual(1000);
  });

  it("total equals sum of components when under cap", () => {
    const analyst = makeAnalyst({ drafts: 2, sessions: 3, events: 5, maturity: "BEGINNER" });
    const score = calculateAtlasScore(analyst, DEFAULT_TEAM_MAX);
    const sum = score.output + score.postRate + score.engagement + score.maturity + score.feedback + score.streak;
    expect(score.total).toBe(Math.min(1000, sum));
  });

  it("handles zero team maxes without division errors", () => {
    const analyst = makeAnalyst({ drafts: 5, sessions: 3, events: 10 });
    const score = calculateAtlasScore(analyst, { maxDrafts: 0, maxSessions: 0, maxEvents: 0 });
    expect(score.output).toBe(0);
    expect(score.engagement).toBe(0);
    expect(score.feedback).toBe(0);
    // postRate and streak still compute from analyst-local data
    expect(score.postRate).toBe(Math.min(200, Math.round((10 / 5) * 40)));
    expect(score.streak).toBe(15);
  });
});

// ── rankTeam ──────────────────────────────────────────────────────────

describe("rankTeam", () => {
  it("returns empty array for empty input", () => {
    expect(rankTeam([])).toEqual([]);
  });

  it("ranks a single analyst as rank 1", () => {
    const result = rankTeam([makeAnalyst({ drafts: 5, sessions: 3, events: 10 })]);
    expect(result).toHaveLength(1);
    expect(result[0].rank).toBe(1);
  });

  it("ranks analysts in descending score order", () => {
    const low = makeAnalyst({ id: "low", handle: "low", drafts: 1, sessions: 1, events: 1 });
    const mid = makeAnalyst({ id: "mid", handle: "mid", drafts: 5, sessions: 5, events: 20 });
    const high = makeAnalyst({
      id: "high",
      handle: "high",
      drafts: 10,
      sessions: 10,
      events: 50,
      maturity: "ADVANCED",
    });

    const result = rankTeam([low, high, mid]);
    expect(result[0].analyst.handle).toBe("high");
    expect(result[0].rank).toBe(1);
    expect(result[1].analyst.handle).toBe("mid");
    expect(result[1].rank).toBe(2);
    expect(result[2].analyst.handle).toBe("low");
    expect(result[2].rank).toBe(3);
  });

  it("assigns correct tiers based on calculated scores", () => {
    const ghost = makeAnalyst({ id: "g", handle: "ghost", drafts: 0, sessions: 0, events: 0 });
    const result = rankTeam([ghost]);
    expect(result[0].tier.name).toBe("Ghost");
  });

  it("computes team maxes from the analyst pool", () => {
    const a = makeAnalyst({ id: "a", handle: "a", drafts: 3, sessions: 2, events: 10 });
    const b = makeAnalyst({ id: "b", handle: "b", drafts: 7, sessions: 8, events: 30 });
    const result = rankTeam([a, b]);

    // b has more of everything, should rank first
    expect(result[0].analyst.handle).toBe("b");

    // a's output = (3/7) * 250 ≈ 107 (team max drafts = 7, not 10)
    expect(result[1].score.output).toBe(Math.round((3 / 7) * 250));
  });

  it("handles all-zero analysts without errors", () => {
    const a = makeAnalyst({ id: "a", handle: "a" });
    const b = makeAnalyst({ id: "b", handle: "b" });
    const result = rankTeam([a, b]);
    expect(result).toHaveLength(2);
    expect(result[0].score.total).toBe(0);
    expect(result[1].score.total).toBe(0);
  });
});

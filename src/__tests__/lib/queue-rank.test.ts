import { computeQueueRank, rankQueue } from "@/lib/queue-rank";
import type { QueuedDraft } from "@/lib/api";

function makeDraft(
  overrides: Partial<QueuedDraft> = {}
): QueuedDraft {
  const now = new Date();
  return {
    id: "d1",
    content: "Test draft",
    version: 1,
    status: "DRAFT",
    confidence: 0.8,
    predictedEngagement: 10,
    actualEngagement: undefined,
    sourceType: "MANUAL",
    createdAt: now.toISOString(),
    _score: 0,
    suggestedAt: now.toISOString(),
    ...overrides,
  };
}

describe("computeQueueRank", () => {
  it("returns empty array for empty input", () => {
    expect(computeQueueRank([])).toEqual([]);
  });

  it("assigns higher rank score to higher confidence drafts", () => {
    const low = makeDraft({ id: "low", confidence: 0.2 });
    const high = makeDraft({ id: "high", confidence: 0.95 });
    const ranked = computeQueueRank([low, high]);
    const lowScore = ranked.find((d) => d.id === "low")!._rankScore;
    const highScore = ranked.find((d) => d.id === "high")!._rankScore;
    expect(highScore).toBeGreaterThan(lowScore);
  });

  it("assigns higher rank score to peak-hour drafts", () => {
    const now = new Date();
    const offPeak = makeDraft({
      id: "off",
      suggestedAt: new Date(now.setHours(3, 0, 0, 0)).toISOString(),
    });
    const peak = makeDraft({
      id: "peak",
      suggestedAt: new Date(now.setHours(14, 0, 0, 0)).toISOString(),
    });
    const ranked = computeQueueRank([offPeak, peak]);
    const offScore = ranked.find((d) => d.id === "off")!._rankBreakdown.timeliness;
    const peakScore = ranked.find((d) => d.id === "peak")!._rankBreakdown.timeliness;
    expect(peakScore).toBeGreaterThan(offScore);
  });

  it("uses actualEngagement over predictedEngagement when available", () => {
    const predictedOnly = makeDraft({
      id: "pred",
      predictedEngagement: 5,
      actualEngagement: undefined,
    });
    const withActual = makeDraft({
      id: "actual",
      predictedEngagement: 5,
      actualEngagement: 50,
    });
    const ranked = computeQueueRank([predictedOnly, withActual]);
    const predPerf = ranked.find((d) => d.id === "pred")!._rankBreakdown.performance;
    const actualPerf = ranked.find((d) => d.id === "actual")!._rankBreakdown.performance;
    expect(actualPerf).toBeGreaterThan(predPerf);
  });

  it("normalizes _score to 0-1 range", () => {
    const draft = makeDraft({ confidence: 1, predictedEngagement: 100 });
    const ranked = computeQueueRank([draft]);
    expect(ranked[0]._score).toBeGreaterThan(0);
    expect(ranked[0]._score).toBeLessThanOrEqual(1);
  });
});

describe("rankQueue", () => {
  it("sorts drafts by descending rank score", () => {
    const now = new Date();
    const a = makeDraft({
      id: "a",
      confidence: 0.2,
      predictedEngagement: 1,
      createdAt: new Date(now.getTime() - 48 * 3600000).toISOString(),
      suggestedAt: new Date(now.setHours(3, 0, 0, 0)).toISOString(),
    });
    const b = makeDraft({
      id: "b",
      confidence: 0.95,
      predictedEngagement: 100,
      createdAt: now.toISOString(),
      suggestedAt: new Date(now.setHours(14, 0, 0, 0)).toISOString(),
    });
    const ranked = rankQueue([a, b]);
    expect(ranked[0].id).toBe("b");
    expect(ranked[1].id).toBe("a");
  });
});

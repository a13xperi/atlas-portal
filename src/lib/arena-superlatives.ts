import type { RankedAnalyst } from "./atlas-score";

export interface Superlative {
  label: string;
  handle: string;
  value: string;
  icon: "climb" | "streak" | "engage" | "output";
}

export function getSuperlatives(ranked: RankedAnalyst[]): Superlative[] {
  if (ranked.length === 0) return [];

  const superlatives: Superlative[] = [];

  // Highest output
  const topOutput = [...ranked].sort(
    (a, b) => b.analyst._count.tweetDrafts - a.analyst._count.tweetDrafts
  )[0];
  if (topOutput && topOutput.analyst._count.tweetDrafts > 0) {
    superlatives.push({
      label: "Top Output",
      handle: topOutput.analyst.handle,
      value: `${topOutput.analyst._count.tweetDrafts} drafts`,
      icon: "output",
    });
  }

  // Best engagement score
  const topEngage = [...ranked].sort(
    (a, b) => b.score.engagement - a.score.engagement
  )[0];
  if (topEngage && topEngage.score.engagement > 0) {
    superlatives.push({
      label: "Best Engagement",
      handle: topEngage.analyst.handle,
      value: `${topEngage.score.engagement}/200`,
      icon: "engage",
    });
  }

  // Longest streak (using streak score as proxy)
  const topStreak = [...ranked].sort(
    (a, b) => b.score.streak - a.score.streak
  )[0];
  if (topStreak && topStreak.score.streak > 0) {
    superlatives.push({
      label: "Hot Streak",
      handle: topStreak.analyst.handle,
      value: `${Math.round(topStreak.score.streak / 5)}d active`,
      icon: "streak",
    });
  }

  // Highest overall score (different from #1 if they're well-rounded vs specialized)
  const topScore = ranked[0];
  if (topScore && !superlatives.some((s) => s.handle === topScore.analyst.handle && s.label === "Top Output")) {
    superlatives.push({
      label: "Top Ranked",
      handle: topScore.analyst.handle,
      value: `${topScore.score.total} pts`,
      icon: "climb",
    });
  }

  return superlatives.slice(0, 3);
}

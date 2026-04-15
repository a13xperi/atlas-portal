import { QueuedDraft } from "./api";

const PEAK_HOURS = [9, 10, 13, 14, 19, 20];

export interface RankedDraft extends QueuedDraft {
  _rankScore: number;
  _rankBreakdown: {
    voiceFit: number;
    timeliness: number;
    performance: number;
  };
}

export function computeQueueRank(drafts: QueuedDraft[]): RankedDraft[] {
  if (drafts.length === 0) return [];

  const engagements = drafts.map(
    (d) => d.actualEngagement ?? d.predictedEngagement ?? 0
  );
  const maxEngagement = Math.max(...engagements, 1);
  const now = Date.now();

  return drafts.map((draft) => {
    const suggested = new Date(draft.suggestedAt);
    const hour = suggested.getHours();
    const isPeak = PEAK_HOURS.includes(hour);

    // Voice fit: confidence (0-1) scaled to 0-35 pts
    const voiceFit = (draft.confidence ?? 0.5) * 35;

    // Timeliness: peak-hour bonus + recency decay -> 0-35 pts
    const peakBonus = isPeak ? 20 : 0;
    const ageHours = Math.max(
      0,
      (now - new Date(draft.createdAt).getTime()) / 36e5
    );
    const recencyBonus = Math.max(0, 15 - ageHours * 0.5);
    const timeliness = Math.min(35, peakBonus + recencyBonus);

    // Performance: normalized engagement vs batch max -> 0-30 pts
    const engagement = draft.actualEngagement ?? draft.predictedEngagement ?? 0;
    const performance = Math.min(30, (engagement / maxEngagement) * 30);

    const total = voiceFit + timeliness + performance;

    return {
      ...draft,
      _score: total / 100,
      _rankScore: total,
      _rankBreakdown: {
        voiceFit,
        timeliness,
        performance,
      },
    };
  });
}

export function rankQueue(drafts: QueuedDraft[]): RankedDraft[] {
  const ranked = computeQueueRank(drafts);
  return ranked.sort((a, b) => b._rankScore - a._rankScore);
}

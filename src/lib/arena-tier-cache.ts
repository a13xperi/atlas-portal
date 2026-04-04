import type { TierConfig } from "./atlas-score";
import { TIERS } from "./atlas-score";

const STORAGE_KEY = "atlas_my_tier";

interface CachedTier {
  tierName: string;
  score: number;
  rank: number;
  timestamp: number;
}

export function cacheMyTier(tierName: string, score: number, rank: number): void {
  try {
    const data: CachedTier = { tierName, score, rank, timestamp: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* localStorage unavailable */ }
}

export function getCachedTier(): { tier: TierConfig; score: number; rank: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as CachedTier;
    const tier = TIERS.find((t) => t.name === data.tierName) || TIERS[TIERS.length - 1];
    return { tier, score: data.score, rank: data.rank };
  } catch {
    return null;
  }
}

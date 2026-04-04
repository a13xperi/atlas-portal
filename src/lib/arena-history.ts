import type { RankedAnalyst } from "./atlas-score";

const STORAGE_KEY = "atlas_arena_snapshot";

interface ArenaSnapshot {
  rankings: Record<string, number>; // analyst id → rank
  timestamp: number;
}

/** Save current rankings to localStorage */
export function saveSnapshot(ranked: RankedAnalyst[]): void {
  try {
    const snapshot: ArenaSnapshot = {
      rankings: Object.fromEntries(
        ranked.map((r) => [r.analyst.id, r.rank])
      ),
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // localStorage unavailable
  }
}

/** Load previous snapshot from localStorage */
function loadSnapshot(): ArenaSnapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ArenaSnapshot;
  } catch {
    return null;
  }
}

/** Get position change for an analyst: positive = moved up, negative = moved down */
export function getPositionChange(analystId: string, currentRank: number): number {
  const snapshot = loadSnapshot();
  if (!snapshot) return 0;

  const previousRank = snapshot.rankings[analystId];
  if (previousRank === undefined) return 0;

  // Lower rank number = higher position, so previous - current = improvement
  return previousRank - currentRank;
}

/** Check if snapshot is stale (older than 6 hours) and should be refreshed */
export function isSnapshotStale(): boolean {
  const snapshot = loadSnapshot();
  if (!snapshot) return true;
  const sixHours = 6 * 60 * 60 * 1000;
  return Date.now() - snapshot.timestamp > sixHours;
}

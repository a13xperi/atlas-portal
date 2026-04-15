export type ContentFormat = "one-liner" | "thread" | "article";

export interface TimingRecommendation {
  /** Day of the week, 0=Sunday ... 6=Saturday */
  dayOfWeek: number;
  /** Human-readable label: "Tuesday 10:00 AM EST" */
  label: string;
  /** Why this slot — shown as a tooltip / subtitle */
  reason: string;
}

export interface AnalystSuggestion {
  /** Slug from reference accounts (e.g. "anil", "kevin", "jonah"). */
  slug: string;
  /** Display name. */
  name: string;
  /** One-sentence "why this analyst". */
  reason: string;
}

interface AnalystRosterEntry {
  slug: string;
  name: string;
  strengths: string[];
}

const ROSTER: AnalystRosterEntry[] = [
  { slug: "anil", name: "Anil", strengths: ["contrarian take", "hot take"] },
  { slug: "kevin", name: "Kevin", strengths: ["data highlight", "key finding"] },
  { slug: "jonah", name: "Jonah", strengths: ["prediction", "thread hook"] },
  { slug: "ceteris", name: "Ceteris", strengths: ["article", "thread hook"] },
  { slug: "yan", name: "Yan", strengths: ["prediction", "data highlight"] },
];

/** Classify a draft into a content format by length + prefix. */
export function classifyFormat(content: string): ContentFormat {
  if (content.length > 1200 || content.includes("## ")) {
    return "article";
  }
  if (
    content.includes("\n\n1.") ||
    content.includes("\n\n1/") ||
    (content.match(/\n\n/g) || []).length > 2
  ) {
    return "thread";
  }
  return "one-liner";
}

/** Derive a timing slot per angle. Pure + deterministic. */
export function recommendTiming(angle: string, _format: ContentFormat): TimingRecommendation {
  const normalized = angle.toLowerCase();
  if (normalized === "contrarian take" || normalized === "hot take") {
    return {
      dayOfWeek: 2,
      label: "Tuesday 10:00 AM EST",
      reason:
        "Crypto Twitter peaks midweek mornings EST; contrarian takes generate most engagement then.",
    };
  }
  if (normalized === "data highlight") {
    return {
      dayOfWeek: 3,
      label: "Wednesday 2:00 PM EST",
      reason:
        "Data-heavy posts perform best midweek afternoons when readers have time to click.",
    };
  }
  if (normalized === "prediction") {
    return {
      dayOfWeek: 0,
      label: "Sunday 6:00 PM EST",
      reason: "Predictions about the week ahead land best Sunday evenings.",
    };
  }
  if (normalized === "key finding") {
    return {
      dayOfWeek: 4,
      label: "Thursday 11:00 AM EST",
      reason: "Core findings earn the most retweets midweek late-morning.",
    };
  }
  // "thread hook" / default
  return {
    dayOfWeek: 2,
    label: "Tuesday 9:00 AM EST",
    reason: "Thread hooks get more follow-throughs in the morning.",
  };
}

/**
 * Pick 1-2 Delphi analyst suggestions for a draft by matching angle
 * + format against each analyst's strengths.
 */
export function suggestAnalysts(angle: string, format: ContentFormat): AnalystSuggestion[] {
  const normalizedAngle = angle.toLowerCase();
  const scored = ROSTER.map((entry) => {
    const matchesAngle = entry.strengths.includes(normalizedAngle);
    const matchesFormat = entry.strengths.includes(format);
    const score = (matchesAngle ? 2 : 0) + (matchesFormat ? 1 : 0);
    return { entry, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const top = scored
    .slice(0, 2)
    .map(({ entry }) => ({
      slug: entry.slug,
      name: entry.name,
      reason: `Strong track record on ${angle} content.`,
    }));

  if (top.length > 0) return top;

  // Fallback to first 2
  return ROSTER.slice(0, 2).map((entry) => ({
    slug: entry.slug,
    name: entry.name,
    reason: `Strong track record on ${angle} content.`,
  }));
}

export interface InsightData {
  title: string;
  summary: string;
  keyQuote: string;
  angle: string;
}

interface GeneratedDraft {
  id: string;
  content: string;
  angle: string;
  qualityScore: number;
  discarded: boolean;
}

/** Build strategy bullets from insights and drafts. */
export function buildStrategyBullets(insights: InsightData[], drafts: GeneratedDraft[]): string[] {
  const activeDrafts = drafts.filter((d) => !d.discarded);
  const angleCounts = new Map<string, number>();
  for (const draft of activeDrafts) {
    const a = draft.angle.toLowerCase();
    angleCounts.set(a, (angleCounts.get(a) || 0) + 1);
  }

  const bullets: string[] = [];

  const contrarian = angleCounts.get("contrarian take") || angleCounts.get("hot take") || 0;
  if (contrarian > 0) {
    bullets.push(
      `${contrarian} contrarian take${contrarian > 1 ? "s" : ""} — lead with one Tuesday 10am EST`
    );
  }

  const data = angleCounts.get("data highlight") || 0;
  if (data > 0) {
    bullets.push(`${data} data highlight${data > 1 ? "s" : ""} — pair with chart, post Wed afternoon`);
  }

  const predictions = angleCounts.get("prediction") || 0;
  if (predictions > 0) {
    bullets.push(
      `Save ${predictions} prediction${predictions > 1 ? "s" : ""} for Sunday evening`
    );
  }

  // Fallback when no specific angles matched
  if (bullets.length === 0 && activeDrafts.length > 0) {
    bullets.push(`${activeDrafts.length} draft${activeDrafts.length > 1 ? "s" : ""} ready — review and schedule the top performers`);
  }

  return bullets;
}
